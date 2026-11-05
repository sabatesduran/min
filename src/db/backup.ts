import type { SQLiteDatabase } from 'expo-sqlite';

import { parseBackup, type MinBackup } from '@/domain/backup';
import { parseSharedDocument } from '@/domain/schema';

import { getAppPreferences, getDocumentPreferences, listDocuments } from './repository';

type RevisionRow = { content_hash: string; json: string; received_at: string };
type PersonalRow = { task_id: string; done: number; checked_item_ids: string };

export async function createBackup(db: SQLiteDatabase): Promise<MinBackup> {
  const [documents, appPreferences] = await Promise.all([listDocuments(db), getAppPreferences(db)]);
  const backedUpDocuments: MinBackup['documents'] = [];
  for (const stored of documents.filter((item) => item.origin !== 'demo')) {
    const documentId = stored.document.documentId;
    const [preferences, revisionRows, personalRows] = await Promise.all([
      getDocumentPreferences(db, documentId),
      db.getAllAsync<RevisionRow>('SELECT content_hash, json, received_at FROM revisions WHERE document_id = ? ORDER BY revision, received_at', documentId),
      db.getAllAsync<PersonalRow>('SELECT task_id, done, checked_item_ids FROM personal_task_states WHERE document_id = ?', documentId),
    ]);
    backedUpDocuments.push({
      ...stored,
      preferences,
      revisions: revisionRows.map((row) => ({ document: parseSharedDocument(JSON.parse(row.json)), contentHash: row.content_hash, receivedAt: row.received_at })),
      personalStates: personalRows.map((row) => ({ documentId, taskId: row.task_id, done: Boolean(row.done), checkedItemIds: JSON.parse(row.checked_item_ids) as string[] })),
    });
  }
  return parseBackup({ backupVersion: 1, exportedAt: new Date().toISOString(), appPreferences, documents: backedUpDocuments });
}

export async function restoreBackup(db: SQLiteDatabase, input: unknown, mode: 'merge' | 'replace'): Promise<MinBackup> {
  const backup = parseBackup(input);
  await db.withTransactionAsync(async () => {
    if (mode === 'replace') {
      await db.runAsync('DELETE FROM documents');
      await db.runAsync('DELETE FROM app_preferences');
    }
    for (const item of backup.documents) {
      await db.runAsync(
        `INSERT INTO documents
          (id, organization_id, origin, favorite, current_revision, current_json, draft_json, imported_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
          organization_id = excluded.organization_id, origin = excluded.origin, favorite = excluded.favorite,
          current_revision = excluded.current_revision, current_json = excluded.current_json,
          draft_json = excluded.draft_json, imported_at = excluded.imported_at, updated_at = excluded.updated_at`,
        item.document.documentId,
        item.document.organizationId,
        item.origin,
        item.favorite ? 1 : 0,
        item.document.revision,
        JSON.stringify(item.document),
        item.draft ? JSON.stringify(item.draft) : null,
        item.importedAt,
        item.updatedAt,
      );
      await db.runAsync(
        `INSERT INTO document_preferences
          (document_id, me_person_id, filter, include_common, following_person_id, live_mode, live_include_common, reminder_mode, reminder_include_common, reminder_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(document_id) DO UPDATE SET
          me_person_id = excluded.me_person_id, filter = excluded.filter, include_common = excluded.include_common,
          following_person_id = excluded.following_person_id, live_mode = excluded.live_mode,
          live_include_common = excluded.live_include_common, reminder_mode = excluded.reminder_mode,
          reminder_include_common = excluded.reminder_include_common, reminder_minutes = excluded.reminder_minutes`,
        item.document.documentId,
        item.preferences.mePersonId,
        item.preferences.filter,
        item.preferences.includeCommon ? 1 : 0,
        item.preferences.followingPersonId,
        item.preferences.liveMode,
        item.preferences.liveIncludeCommon ? 1 : 0,
        item.preferences.reminderMode,
        item.preferences.reminderIncludeCommon ? 1 : 0,
        item.preferences.reminderMinutes,
      );
      for (const revision of item.revisions) {
        await db.runAsync(
          `INSERT OR IGNORE INTO revisions (document_id, revision, content_hash, json, published_at, received_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          item.document.documentId,
          revision.document.revision,
          revision.contentHash,
          JSON.stringify(revision.document),
          revision.document.publishedAt,
          revision.receivedAt,
        );
      }
      for (const state of item.personalStates) {
        await db.runAsync(
          `INSERT INTO personal_task_states (document_id, task_id, done, checked_item_ids, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(document_id, task_id) DO UPDATE SET done = excluded.done, checked_item_ids = excluded.checked_item_ids, updated_at = excluded.updated_at`,
          item.document.documentId,
          state.taskId,
          state.done ? 1 : 0,
          JSON.stringify(state.checkedItemIds),
          new Date().toISOString(),
        );
      }
      await db.runAsync('DELETE FROM notification_jobs WHERE document_id = ?', item.document.documentId);
    }
    const selectedExists = backup.appPreferences.selectedDocumentId
      && backup.documents.some((item) => item.document.documentId === backup.appPreferences.selectedDocumentId);
    await db.runAsync("INSERT INTO app_preferences (key, value) VALUES ('theme', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", backup.appPreferences.theme);
    const selectedDocumentId = selectedExists ? backup.appPreferences.selectedDocumentId : null;
    if (selectedDocumentId) {
      await db.runAsync("INSERT INTO app_preferences (key, value) VALUES ('selectedDocumentId', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", selectedDocumentId);
    } else {
      await db.runAsync("DELETE FROM app_preferences WHERE key = 'selectedDocumentId'");
    }
  });
  return backup;
}
