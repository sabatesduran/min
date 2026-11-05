import type { SQLiteDatabase } from 'expo-sqlite';

import type { DocumentPreferences, SharedDocument } from '@/domain/models';

export async function syncNativeGlance(
  _db: SQLiteDatabase,
  _document: SharedDocument | null,
  _preferences: DocumentPreferences | null,
  _nowMs: number,
): Promise<void> {}
