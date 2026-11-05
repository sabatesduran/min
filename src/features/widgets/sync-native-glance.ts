import type { SQLiteDatabase } from 'expo-sqlite';

import type { DocumentPreferences, SharedDocument } from '@/domain/models';

// Fallback for non-native tooling. Metro selects the .ios, .android or .web module.
export async function syncNativeGlance(
  _db: SQLiteDatabase,
  _document: SharedDocument | null,
  _preferences: DocumentPreferences | null,
  _nowMs: number,
): Promise<void> {}
