import type { SQLiteDatabase } from 'expo-sqlite';

import type { DocumentPreferences, SharedDocument } from '@/domain/models';
import { eventStatus, nextBoundaryMs } from '@/domain/time';

import {
  buildGlanceProps,
  buildGlanceTimeline,
  emptyGlanceProps,
  preferencesForGlance,
} from './glance-data';
import { nativeWidgetsAvailable } from './native-widgets';

const LIVE_DOCUMENT_KEY = 'liveActivityDocumentId';

async function storedLiveDocumentId(db: SQLiteDatabase): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_preferences WHERE key = ?',
    LIVE_DOCUMENT_KEY,
  );
  return row?.value ?? null;
}

async function rememberLiveDocument(db: SQLiteDatabase, documentId: string | null): Promise<void> {
  if (!documentId) {
    await db.runAsync('DELETE FROM app_preferences WHERE key = ?', LIVE_DOCUMENT_KEY);
    return;
  }
  await db.runAsync(
    'INSERT INTO app_preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    LIVE_DOCUMENT_KEY,
    documentId,
  );
}

export async function syncNativeGlance(
  db: SQLiteDatabase,
  document: SharedDocument | null,
  preferences: DocumentPreferences | null,
  nowMs: number,
): Promise<void> {
  if (!nativeWidgetsAvailable()) return;

  const [{ default: MinLiveActivity }, { default: MinNextTaskWidget }] = await Promise.all([
    import('@/widgets/MinLiveActivity'),
    import('@/widgets/MinNextTaskWidget'),
  ]);

  if (!document || !preferences) {
    MinNextTaskWidget.updateSnapshot(emptyGlanceProps);
    const instances = MinLiveActivity.getInstances();
    await Promise.all(instances.map((instance) => instance.end('immediate')));
    await rememberLiveDocument(db, null);
    return;
  }

  MinNextTaskWidget.updateTimeline(buildGlanceTimeline(document, preferences, nowMs));

  const canTrackMine = preferences.liveMode !== 'mine' || preferences.mePersonId !== null;
  if (
    preferences.liveMode === 'off' ||
    !canTrackMine ||
    eventStatus(document.event, nowMs) !== 'active'
  ) {
    const instances = MinLiveActivity.getInstances();
    await Promise.all(instances.map((instance) => instance.end('immediate')));
    await rememberLiveDocument(db, null);
    return;
  }

  const livePreferences = preferencesForGlance(
    preferences,
    preferences.liveMode,
    preferences.liveIncludeCommon,
  );
  const props = buildGlanceProps(document, livePreferences, nowMs);
  const nextBoundary = nextBoundaryMs(document, nowMs);
  const staleDate = nextBoundary === null ? undefined : new Date(nextBoundary + 60_000);
  const rememberedDocumentId = await storedLiveDocumentId(db);
  let instances = MinLiveActivity.getInstances();

  if (rememberedDocumentId && rememberedDocumentId !== document.documentId) {
    await Promise.all(instances.map((instance) => instance.end('immediate')));
    instances = [];
  }

  if (!instances.length) {
    MinLiveActivity.start(props, props.url, staleDate);
    await rememberLiveDocument(db, document.documentId);
    return;
  }

  await Promise.all(instances.map((instance) => instance.update(props, staleDate)));
  await rememberLiveDocument(db, document.documentId);
}
