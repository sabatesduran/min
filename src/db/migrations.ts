import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 2;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = result?.user_version ?? 0;
  if (current >= DATABASE_VERSION) return;

  if (current === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY NOT NULL,
        organization_id TEXT NOT NULL,
        origin TEXT NOT NULL CHECK (origin IN ('author', 'received', 'duplicated', 'demo')),
        favorite INTEGER NOT NULL DEFAULT 0,
        current_revision INTEGER NOT NULL,
        current_json TEXT NOT NULL,
        draft_json TEXT,
        imported_at TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS revisions (
        document_id TEXT NOT NULL,
        revision INTEGER NOT NULL,
        content_hash TEXT NOT NULL,
        json TEXT NOT NULL,
        published_at TEXT NOT NULL,
        received_at TEXT NOT NULL,
        PRIMARY KEY (document_id, revision, content_hash),
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS revisions_document_revision
      ON revisions(document_id, revision DESC);

      CREATE TABLE IF NOT EXISTS document_preferences (
        document_id TEXT PRIMARY KEY NOT NULL,
        me_person_id TEXT,
        filter TEXT NOT NULL DEFAULT 'all',
        include_common INTEGER NOT NULL DEFAULT 1,
        following_person_id TEXT,
        live_mode TEXT NOT NULL DEFAULT 'off',
        live_include_common INTEGER NOT NULL DEFAULT 1,
        reminder_mode TEXT NOT NULL DEFAULT 'off',
        reminder_include_common INTEGER NOT NULL DEFAULT 1,
        reminder_minutes INTEGER,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS personal_task_states (
        document_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0,
        checked_item_ids TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL,
        PRIMARY KEY (document_id, task_id),
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notification_jobs (
        document_id TEXT NOT NULL,
        task_group_key TEXT NOT NULL,
        native_id TEXT NOT NULL,
        scheduled_for TEXT NOT NULL,
        PRIMARY KEY (document_id, task_group_key),
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS app_preferences (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
  } else if (current < 2) {
    await db.execAsync(`
      PRAGMA foreign_keys = OFF;
      BEGIN IMMEDIATE;
      CREATE TABLE documents_v2 (
        id TEXT PRIMARY KEY NOT NULL,
        organization_id TEXT NOT NULL,
        origin TEXT NOT NULL CHECK (origin IN ('author', 'received', 'duplicated', 'demo')),
        favorite INTEGER NOT NULL DEFAULT 0,
        current_revision INTEGER NOT NULL,
        current_json TEXT NOT NULL,
        draft_json TEXT,
        imported_at TEXT,
        updated_at TEXT NOT NULL
      );
      INSERT INTO documents_v2
        (id, organization_id, origin, favorite, current_revision, current_json, draft_json, imported_at, updated_at)
      SELECT id, organization_id, origin, favorite, current_revision, current_json, draft_json, imported_at, updated_at
      FROM documents;
      DROP TABLE documents;
      ALTER TABLE documents_v2 RENAME TO documents;
      COMMIT;
      PRAGMA foreign_keys = ON;
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
