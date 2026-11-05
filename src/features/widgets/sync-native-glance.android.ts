import type { SQLiteDatabase } from 'expo-sqlite';

import type { DocumentPreferences, SharedDocument } from '@/domain/models';

import { buildGlanceProps, emptyGlanceProps } from './glance-data';
import { nativeWidgetsAvailable } from './native-widgets';

export async function syncNativeGlance(
  _db: SQLiteDatabase,
  document: SharedDocument | null,
  preferences: DocumentPreferences | null,
  nowMs: number,
): Promise<void> {
  if (!nativeWidgetsAvailable()) return;

  const { default: MinNextTaskWidget } = await import('@/widgets/MinNextTaskWidget');
  MinNextTaskWidget.updateSnapshot(
    document && preferences ? buildGlanceProps(document, preferences, nowMs) : emptyGlanceProps,
  );
}
