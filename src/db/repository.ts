import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { contentHash } from '@/domain/canonical';
import type {
  AppPreferences,
  DocumentOrigin,
  DocumentPreferences,
  PersonalTaskState,
  SharedDocument,
  StoredDocument,
} from '@/domain/models';
import { parseSharedDocument } from '@/domain/schema';

type DocumentRow = {
  id: string;
  organization_id: string;
  origin: DocumentOrigin;
  favorite: number;
  current_revision: number;
  current_json: string;
  draft_json: string | null;
  imported_at: string | null;
  updated_at: string;
};

type PreferenceRow = {
  document_id: string;
  me_person_id: string | null;
  filter: 'all' | 'mine';
  include_common: number;
  following_person_id: string | null;
  live_mode: 'off' | 'all' | 'mine';
  live_include_common: number;
  reminder_mode: 'off' | 'all' | 'mine';
  reminder_include_common: number;
  reminder_minutes: null | 5 | 10 | 15;
};

export type ImportAssessment =
  | { kind: 'new'; incoming: SharedDocument; hash: string }
  | { kind: 'update'; current: SharedDocument; incoming: SharedDocument; hash: string }
  | { kind: 'duplicate'; current: SharedDocument; incoming: SharedDocument; hash: string }
  | { kind: 'conflict'; current: SharedDocument; incoming: SharedDocument; hash: string }
  | { kind: 'older'; current: SharedDocument; incoming: SharedDocument; hash: string };

export type StoredRevision = {
  document: SharedDocument;
  contentHash: string;
  receivedAt: string;
};

function rowToStored(row: DocumentRow): StoredDocument {
  return {
    document: parseSharedDocument(JSON.parse(row.current_json)),
    draft: row.origin === 'received' || row.origin === 'demo' ? null : row.draft_json ? parseSharedDocument(JSON.parse(row.draft_json)) : null,
    origin: row.origin,
    favorite: Boolean(row.favorite),
    importedAt: row.imported_at,
    updatedAt: row.updated_at,
  };
}

export async function listDocuments(db: SQLiteDatabase): Promise<StoredDocument[]> {
  const rows = await db.getAllAsync<DocumentRow>('SELECT * FROM documents ORDER BY favorite DESC, updated_at DESC');
  return rows.map(rowToStored);
}

export async function getStoredDocument(db: SQLiteDatabase, documentId: string): Promise<StoredDocument | null> {
  const row = await db.getFirstAsync<DocumentRow>('SELECT * FROM documents WHERE id = ?', documentId);
  return row ? rowToStored(row) : null;
}

export async function listRevisions(db: SQLiteDatabase, documentId: string): Promise<StoredRevision[]> {
  const rows = await db.getAllAsync<{ json: string; content_hash: string; received_at: string }>(
    'SELECT json, content_hash, received_at FROM revisions WHERE document_id = ? ORDER BY revision DESC, received_at DESC',
    documentId,
  );
  return rows.map((row) => ({ document: parseSharedDocument(JSON.parse(row.json)), contentHash: row.content_hash, receivedAt: row.received_at }));
}

export async function getRevision(db: SQLiteDatabase, documentId: string, contentHashValue: string): Promise<StoredRevision | null> {
  const row = await db.getFirstAsync<{ json: string; content_hash: string; received_at: string }>(
    'SELECT json, content_hash, received_at FROM revisions WHERE document_id = ? AND content_hash = ? ORDER BY received_at DESC LIMIT 1',
    documentId,
    contentHashValue,
  );
  return row ? { document: parseSharedDocument(JSON.parse(row.json)), contentHash: row.content_hash, receivedAt: row.received_at } : null;
}

export async function duplicateRevision(db: SQLiteDatabase, documentId: string, contentHashValue: string): Promise<string> {
  const revision = await getRevision(db, documentId, contentHashValue);
  if (!revision) throw new Error('No s’ha trobat aquesta revisió.');
  const duplicateId = Crypto.randomUUID();
  const duplicate = parseSharedDocument({
    ...revision.document,
    documentId: duplicateId,
    revision: 1,
    publishedAt: new Date().toISOString(),
  });
  await saveNewDocument(db, duplicate, 'duplicated');
  return duplicateId;
}

export async function clearRevisionHistory(db: SQLiteDatabase, documentId: string): Promise<number> {
  const stored = await getStoredDocument(db, documentId);
  if (!stored) throw new Error('No s’ha trobat el document.');
  const currentHash = await contentHash(stored.document);
  const result = await db.runAsync(
    'DELETE FROM revisions WHERE document_id = ? AND content_hash <> ?',
    documentId,
    currentHash,
  );
  return result.changes;
}

export async function saveNewDocument(
  db: SQLiteDatabase,
  document: SharedDocument,
  origin: DocumentOrigin = 'author',
): Promise<void> {
  const parsed = parseSharedDocument(document);
  const hash = await contentHash(parsed);
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO documents
       (id, organization_id, origin, favorite, current_revision, current_json, draft_json, imported_at, updated_at)
       VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?)`,
      parsed.documentId,
      parsed.organizationId,
      origin,
      parsed.revision,
      JSON.stringify(parsed),
      origin === 'received' || origin === 'demo' ? null : JSON.stringify(parsed),
      origin === 'received' ? now : null,
      now,
    );
    await db.runAsync(
      `INSERT INTO revisions (document_id, revision, content_hash, json, published_at, received_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      parsed.documentId,
      parsed.revision,
      hash,
      JSON.stringify(parsed),
      parsed.publishedAt,
      now,
    );
    await db.runAsync('INSERT INTO document_preferences (document_id) VALUES (?)', parsed.documentId);
  });
}

export async function saveDraft(db: SQLiteDatabase, documentId: string, draft: SharedDocument): Promise<void> {
  const stored = await getStoredDocument(db, documentId);
  if (!stored) throw new Error('No s’ha trobat el document.');
  if (stored.origin === 'received' || stored.origin === 'demo') throw new Error('Aquesta és una còpia de consulta. Duplica-la abans d’editar.');
  const parsed = parseSharedDocument(draft);
  await db.runAsync('UPDATE documents SET draft_json = ?, updated_at = ? WHERE id = ?', JSON.stringify(parsed), new Date().toISOString(), documentId);
}

export async function publishDraft(db: SQLiteDatabase, documentId: string): Promise<SharedDocument> {
  const stored = await getStoredDocument(db, documentId);
  if (stored?.origin === 'received' || stored?.origin === 'demo') throw new Error('Aquesta és una còpia de consulta. Duplica-la abans de crear una revisió.');
  if (!stored?.draft) throw new Error('No hi ha cap esborrany per publicar.');
  const published = parseSharedDocument({
    ...stored.draft,
    revision: stored.document.revision + 1,
    publishedAt: new Date().toISOString(),
  });
  const hash = await contentHash(published);
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE documents SET current_revision = ?, current_json = ?, draft_json = ?, updated_at = ? WHERE id = ?`,
      published.revision,
      JSON.stringify(published),
      JSON.stringify(published),
      now,
      documentId,
    );
    await db.runAsync(
      `INSERT INTO revisions (document_id, revision, content_hash, json, published_at, received_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      documentId,
      published.revision,
      hash,
      JSON.stringify(published),
      published.publishedAt,
      now,
    );
  });
  return published;
}

export async function assessImport(db: SQLiteDatabase, input: unknown): Promise<ImportAssessment> {
  const incoming = parseSharedDocument(input);
  const hash = await contentHash(incoming);
  const stored = await getStoredDocument(db, incoming.documentId);
  if (!stored) return { kind: 'new', incoming, hash };
  const current = stored.document;
  const knownRevision = await db.getFirstAsync<{ content_hash: string }>(
    'SELECT content_hash FROM revisions WHERE document_id = ? AND content_hash = ? LIMIT 1',
    incoming.documentId,
    hash,
  );
  if (knownRevision) return { kind: 'duplicate', current, incoming, hash };
  if (incoming.revision > current.revision) return { kind: 'update', current, incoming, hash };
  if (incoming.revision < current.revision) return { kind: 'older', current, incoming, hash };
  return { kind: 'conflict', current, incoming, hash };
}

export async function applyImport(db: SQLiteDatabase, assessment: ImportAssessment): Promise<void> {
  if (assessment.kind === 'duplicate') return;
  if (assessment.kind === 'new') {
    await saveNewDocument(db, assessment.incoming, 'received');
    return;
  }
  const now = new Date().toISOString();
  if (assessment.kind === 'older' || assessment.kind === 'conflict') {
    await db.runAsync(
      `INSERT OR IGNORE INTO revisions (document_id, revision, content_hash, json, published_at, received_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      assessment.incoming.documentId,
      assessment.incoming.revision,
      assessment.hash,
      JSON.stringify(assessment.incoming),
      assessment.incoming.publishedAt,
      now,
    );
    return;
  }
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR IGNORE INTO revisions (document_id, revision, content_hash, json, published_at, received_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      assessment.incoming.documentId,
      assessment.incoming.revision,
      assessment.hash,
      JSON.stringify(assessment.incoming),
      assessment.incoming.publishedAt,
      now,
    );
    await db.runAsync(
      `UPDATE documents
       SET current_revision = ?, current_json = ?,
           draft_json = CASE WHEN origin = 'received' THEN NULL ELSE draft_json END,
           imported_at = ?, updated_at = ?
       WHERE id = ?`,
      assessment.incoming.revision,
      JSON.stringify(assessment.incoming),
      now,
      now,
      assessment.incoming.documentId,
    );
  });
}

export async function duplicateDocument(db: SQLiteDatabase, sourceId: string): Promise<string> {
  const stored = await getStoredDocument(db, sourceId);
  if (!stored) throw new Error('No s’ha trobat el document.');
  const documentId = Crypto.randomUUID();
  const source = stored.draft ?? stored.document;
  const duplicate = parseSharedDocument({
    ...source,
    documentId,
    revision: 1,
    publishedAt: new Date().toISOString(),
    tasks: source.tasks.map((task) => ({ ...task })),
  });
  await saveNewDocument(db, duplicate, 'duplicated');
  return documentId;
}

export async function deleteDocument(db: SQLiteDatabase, documentId: string): Promise<void> {
  await db.runAsync('DELETE FROM documents WHERE id = ?', documentId);
}

export async function clearDemoDocuments(db: SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<{ id: string }>("SELECT id FROM documents WHERE origin = 'demo'");
  if (!rows.length) return;
  await db.runAsync("DELETE FROM documents WHERE origin = 'demo'");
  const preferences = await getAppPreferences(db);
  if (preferences.selectedDocumentId && rows.some((row) => row.id === preferences.selectedDocumentId)) {
    await saveAppPreferences(db, { ...preferences, selectedDocumentId: null });
  }
}

export async function setFavorite(db: SQLiteDatabase, documentId: string, favorite: boolean): Promise<void> {
  await db.runAsync('UPDATE documents SET favorite = ?, updated_at = ? WHERE id = ?', favorite ? 1 : 0, new Date().toISOString(), documentId);
}

export async function getDocumentPreferences(db: SQLiteDatabase, documentId: string): Promise<DocumentPreferences> {
  const row = await db.getFirstAsync<PreferenceRow>('SELECT * FROM document_preferences WHERE document_id = ?', documentId);
  if (!row) {
    await db.runAsync('INSERT OR IGNORE INTO document_preferences (document_id) VALUES (?)', documentId);
    return {
      documentId,
      mePersonId: null,
      filter: 'all',
      includeCommon: true,
      followingPersonId: null,
      liveMode: 'off',
      liveIncludeCommon: true,
      reminderMode: 'off',
      reminderIncludeCommon: true,
      reminderMinutes: null,
    };
  }
  return {
    documentId,
    mePersonId: row.me_person_id,
    filter: row.filter,
    includeCommon: Boolean(row.include_common),
    followingPersonId: row.following_person_id,
    liveMode: row.live_mode,
    liveIncludeCommon: Boolean(row.live_include_common),
    reminderMode: row.reminder_mode,
    reminderIncludeCommon: Boolean(row.reminder_include_common),
    reminderMinutes: row.reminder_minutes,
  };
}

export async function saveDocumentPreferences(db: SQLiteDatabase, preferences: DocumentPreferences): Promise<void> {
  await db.runAsync(
    `INSERT INTO document_preferences
      (document_id, me_person_id, filter, include_common, following_person_id, live_mode, live_include_common, reminder_mode, reminder_include_common, reminder_minutes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(document_id) DO UPDATE SET
      me_person_id = excluded.me_person_id,
      filter = excluded.filter,
      include_common = excluded.include_common,
      following_person_id = excluded.following_person_id,
      live_mode = excluded.live_mode,
      live_include_common = excluded.live_include_common,
      reminder_mode = excluded.reminder_mode,
      reminder_include_common = excluded.reminder_include_common,
      reminder_minutes = excluded.reminder_minutes`,
    preferences.documentId,
    preferences.mePersonId,
    preferences.filter,
    preferences.includeCommon ? 1 : 0,
    preferences.followingPersonId,
    preferences.liveMode,
    preferences.liveIncludeCommon ? 1 : 0,
    preferences.reminderMode,
    preferences.reminderIncludeCommon ? 1 : 0,
    preferences.reminderMinutes,
  );
}

export async function getAppPreferences(db: SQLiteDatabase): Promise<AppPreferences> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM app_preferences');
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const theme = values.get('theme');
  return {
    theme: theme === 'light' || theme === 'dark' ? theme : 'system',
    selectedDocumentId: values.get('selectedDocumentId') ?? null,
  };
}

export async function saveAppPreferences(db: SQLiteDatabase, preferences: AppPreferences): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync("INSERT INTO app_preferences (key, value) VALUES ('theme', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", preferences.theme);
    if (preferences.selectedDocumentId) {
      await db.runAsync("INSERT INTO app_preferences (key, value) VALUES ('selectedDocumentId', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", preferences.selectedDocumentId);
    } else {
      await db.runAsync("DELETE FROM app_preferences WHERE key = 'selectedDocumentId'");
    }
  });
}

export async function getPersonalTaskState(db: SQLiteDatabase, documentId: string, taskId: string): Promise<PersonalTaskState> {
  const row = await db.getFirstAsync<{ done: number; checked_item_ids: string }>(
    'SELECT done, checked_item_ids FROM personal_task_states WHERE document_id = ? AND task_id = ?',
    documentId,
    taskId,
  );
  return { documentId, taskId, done: Boolean(row?.done), checkedItemIds: row ? JSON.parse(row.checked_item_ids) : [] };
}

export async function savePersonalTaskState(db: SQLiteDatabase, state: PersonalTaskState): Promise<void> {
  await db.runAsync(
    `INSERT INTO personal_task_states (document_id, task_id, done, checked_item_ids, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(document_id, task_id) DO UPDATE SET
      done = excluded.done, checked_item_ids = excluded.checked_item_ids, updated_at = excluded.updated_at`,
    state.documentId,
    state.taskId,
    state.done ? 1 : 0,
    JSON.stringify(state.checkedItemIds),
    new Date().toISOString(),
  );
}

export async function replaceNotificationJobs(
  db: SQLiteDatabase,
  documentId: string,
  jobs: { groupKey: string; nativeId: string; scheduledFor: string }[],
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await writeNotificationJobs(db, documentId, jobs);
  });
}

async function writeNotificationJobs(
  db: SQLiteDatabase,
  documentId: string,
  jobs: { groupKey: string; nativeId: string; scheduledFor: string }[],
): Promise<void> {
  await db.runAsync('DELETE FROM notification_jobs WHERE document_id = ?', documentId);
  for (const job of jobs) {
    await db.runAsync(
      'INSERT INTO notification_jobs (document_id, task_group_key, native_id, scheduled_for) VALUES (?, ?, ?, ?)',
      documentId,
      job.groupKey,
      job.nativeId,
      job.scheduledFor,
    );
  }
}

export async function saveDocumentPreferencesAndNotificationJobs(
  db: SQLiteDatabase,
  preferences: DocumentPreferences,
  jobs: { groupKey: string; nativeId: string; scheduledFor: string }[],
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await saveDocumentPreferences(db, preferences);
    await writeNotificationJobs(db, preferences.documentId, jobs);
  });
}

export async function getNotificationIds(db: SQLiteDatabase, documentId: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ native_id: string }>('SELECT native_id FROM notification_jobs WHERE document_id = ?', documentId);
  return rows.map((row) => row.native_id);
}
