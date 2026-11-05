import { createHash, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDatabase } from './migrations';
import { createBackup, restoreBackup } from './backup';
import {
  applyImport,
  assessImport,
  clearDemoDocuments,
  deleteDocument,
  duplicateDocument,
  duplicateRevision,
  getAppPreferences,
  getDocumentPreferences,
  getPersonalTaskState,
  getStoredDocument,
  listDocuments,
  listRevisions,
  publishDraft,
  saveAppPreferences,
  saveDraft,
  saveNewDocument,
  savePersonalTaskState,
} from './repository';
import { makeDocument } from '@/test/fixtures';

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: async (_algorithm: string, value: string) => createHash('sha256').update(value).digest('hex'),
  randomUUID,
}));

type SqlValue = string | number | bigint | null | Uint8Array;

function expoAdapter(database: DatabaseSync): SQLiteDatabase {
  const adapter = {
    execAsync: async (source: string) => database.exec(source),
    getFirstAsync: async <T>(source: string, ...params: SqlValue[]) => database.prepare(source).get(...params) as T | null,
    getAllAsync: async <T>(source: string, ...params: SqlValue[]) => database.prepare(source).all(...params) as T[],
    runAsync: async (source: string, ...params: SqlValue[]) => database.prepare(source).run(...params),
    withTransactionAsync: async (task: () => Promise<void>) => {
      database.exec('BEGIN');
      try {
        await task();
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return adapter as unknown as SQLiteDatabase;
}

describe('repositori SQLite', () => {
  let native: DatabaseSync;
  let db: SQLiteDatabase;

  beforeEach(async () => {
    native = new DatabaseSync(':memory:');
    db = expoAdapter(native);
    await migrateDatabase(db);
  });

  afterEach(() => native.close());

  it('desa el document, crea preferències i conserva estat personal', async () => {
    const document = makeDocument();
    await saveNewDocument(db, document);
    expect(await listDocuments(db)).toHaveLength(1);
    expect((await getDocumentPreferences(db, document.documentId)).filter).toBe('all');

    await savePersonalTaskState(db, {
      documentId: document.documentId,
      taskId: document.tasks[0]!.id,
      done: true,
      checkedItemIds: [document.tasks[0]!.checklist[0]!.id],
    });
    expect(await getPersonalTaskState(db, document.documentId, document.tasks[0]!.id)).toMatchObject({ done: true });
  });

  it('tracta la demo com una sessió temporal i no com un document propi', async () => {
    const document = makeDocument();
    await saveNewDocument(db, document, 'demo');
    await saveAppPreferences(db, { theme: 'system', selectedDocumentId: document.documentId });
    const stored = await getStoredDocument(db, document.documentId);

    expect(stored?.origin).toBe('demo');
    expect(stored?.draft).toBeNull();
    await expect(saveDraft(db, document.documentId, document)).rejects.toThrow('còpia de consulta');

    const duplicateId = await duplicateDocument(db, document.documentId);
    expect((await getStoredDocument(db, duplicateId))?.origin).toBe('duplicated');

    await deleteDocument(db, duplicateId);
    await clearDemoDocuments(db);
    expect(await listDocuments(db)).toHaveLength(0);
    expect((await getAppPreferences(db)).selectedDocumentId).toBeNull();
  });

  it('separa esborrany i revisió publicada', async () => {
    const document = makeDocument();
    await saveNewDocument(db, document);
    await saveDraft(db, document.documentId, { ...document, event: { ...document.event, title: 'Títol nou' } });
    expect((await getStoredDocument(db, document.documentId))?.document.event.title).toBe('Festa del foc');
    const published = await publishDraft(db, document.documentId);
    expect(published.revision).toBe(2);
    expect(published.event.title).toBe('Títol nou');
  });

  it('duplica el contingut més recent de l’esborrany', async () => {
    const document = makeDocument();
    await saveNewDocument(db, document);
    await saveDraft(db, document.documentId, { ...document, event: { ...document.event, title: 'Títol encara no publicat' } });
    const duplicateId = await duplicateDocument(db, document.documentId);
    const duplicate = await getStoredDocument(db, duplicateId);
    expect(duplicate?.origin).toBe('duplicated');
    expect(duplicate?.document.event.title).toBe('Títol encara no publicat');
    expect(duplicate?.document.revision).toBe(1);
  });

  it('protegeix una còpia rebuda i permet editar-ne un duplicat', async () => {
    const document = makeDocument();
    await saveNewDocument(db, document, 'received');
    expect((await getStoredDocument(db, document.documentId))?.draft).toBeNull();

    await expect(saveDraft(db, document.documentId, { ...document, event: { ...document.event, title: 'Edició local' } })).rejects.toThrow('còpia de consulta');
    const duplicateId = await duplicateDocument(db, document.documentId);
    const duplicate = await getStoredDocument(db, duplicateId);
    await saveDraft(db, duplicateId, { ...duplicate!.document, event: { ...duplicate!.document.event, title: 'Edició local' } });
    const published = await publishDraft(db, duplicateId);

    expect(await listDocuments(db)).toHaveLength(2);
    expect(published).toMatchObject({ documentId: duplicateId, revision: 2 });
    expect((await getStoredDocument(db, document.documentId))?.document.event.title).toBe('Festa del foc');
    expect((await getStoredDocument(db, duplicateId))?.origin).toBe('duplicated');
  });

  it('actualitza una còpia rebuda sense crear-hi esborrany', async () => {
    const document = makeDocument();
    await saveNewDocument(db, document, 'received');

    const incoming = { ...document, revision: 2, publishedAt: '2026-06-01T07:30:00Z', event: { ...document.event, title: 'Revisió rebuda' } };
    await applyImport(db, await assessImport(db, incoming));
    const stored = await getStoredDocument(db, document.documentId);

    expect(stored?.document.event.title).toBe('Revisió rebuda');
    expect(stored?.draft).toBeNull();
  });

  it('distingeix duplicats, actualitzacions i conflictes', async () => {
    const document = makeDocument();
    await saveNewDocument(db, document, 'received');
    expect((await assessImport(db, document)).kind).toBe('duplicate');

    const update = { ...document, revision: 2, publishedAt: '2026-06-01T07:30:00Z', event: { ...document.event, title: 'Revisió dos' } };
    const assessment = await assessImport(db, update);
    expect(assessment.kind).toBe('update');
    await applyImport(db, assessment);
    expect((await getStoredDocument(db, document.documentId))?.document.revision).toBe(2);
    expect((await assessImport(db, document)).kind).toBe('duplicate');

    const conflict = { ...update, event: { ...update.event, title: 'Mateixa revisió, altre contingut' } };
    const conflictAssessment = await assessImport(db, conflict);
    expect(conflictAssessment.kind).toBe('conflict');
    await applyImport(db, conflictAssessment);
    expect(await listRevisions(db, document.documentId)).toHaveLength(3);
    expect((await assessImport(db, conflict)).kind).toBe('duplicate');

    const revisions = await listRevisions(db, document.documentId);
    const duplicateId = await duplicateRevision(db, document.documentId, revisions[0]!.contentHash);
    expect((await getStoredDocument(db, duplicateId))?.origin).toBe('duplicated');
  });

  it('exporta i restaura una còpia completa', async () => {
    const document = makeDocument();
    await saveNewDocument(db, document);
    await saveAppPreferences(db, { theme: 'dark', selectedDocumentId: document.documentId });
    await savePersonalTaskState(db, {
      documentId: document.documentId,
      taskId: document.tasks[0]!.id,
      done: true,
      checkedItemIds: [document.tasks[0]!.checklist[0]!.id],
    });
    const backup = await createBackup(db);
    await deleteDocument(db, document.documentId);
    await restoreBackup(db, backup, 'replace');

    expect((await listDocuments(db))[0]?.document.documentId).toBe(document.documentId);
    expect((await getAppPreferences(db)).theme).toBe('dark');
    expect((await getPersonalTaskState(db, document.documentId, document.tasks[0]!.id)).done).toBe(true);
  });
});
