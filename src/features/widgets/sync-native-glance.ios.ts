import type { SQLiteDatabase } from 'expo-sqlite';

import type { DocumentPreferences, SharedDocument } from '@/domain/models';
import { eventStatus, nextBoundaryMs } from '@/domain/time';

import {
  buildGlanceTimeline,
  buildLiveGlanceProps,
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

let queue: Promise<void> = Promise.resolve();
let lastWidgetSignature: string | null = null;
let lastLiveSignature: string | null = null;

/** Runs one sync at a time so two overlapping runs cannot start duplicate activities. */
export function syncNativeGlance(
  db: SQLiteDatabase,
  document: SharedDocument | null,
  preferences: DocumentPreferences | null,
  nowMs: number,
): Promise<void> {
  const run = queue.then(() => syncNow(db, document, preferences, nowMs));
  queue = run.catch(() => {});
  return run;
}

async function syncNow(
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
    lastWidgetSignature = null;
    lastLiveSignature = null;
    MinNextTaskWidget.updateSnapshot(emptyGlanceProps);
    const instances = MinLiveActivity.getInstances();
    await Promise.all(instances.map((instance) => instance.end('immediate')));
    await rememberLiveDocument(db, null);
    return;
  }

  // Reloading the widget timeline is budgeted by iOS; only do it when its content changes.
  const timeline = buildGlanceTimeline(document, preferences, nowMs);
  const widgetSignature = JSON.stringify(timeline.map((entry, index) => [index === 0 ? 0 : entry.date.getTime(), entry.props]));
  if (widgetSignature !== lastWidgetSignature) {
    MinNextTaskWidget.updateTimeline(timeline);
    lastWidgetSignature = widgetSignature;
  }

  const canTrackMine = preferences.liveMode !== 'mine' || preferences.mePersonId !== null;
  if (
    preferences.liveMode === 'off' ||
    !canTrackMine ||
    eventStatus(document.event, nowMs) !== 'active'
  ) {
    lastLiveSignature = null;
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
  const props = buildLiveGlanceProps(document, livePreferences, nowMs);
  // Going stale at the next change makes iOS re-render the activity, which then shows the next step.
  const nextChange = props.steps[0]?.at ?? nextBoundaryMs(document, nowMs);
  const staleDate = nextChange == null ? undefined : new Date(nextChange);
  const liveSignature = JSON.stringify([props, nextChange]);
  const rememberedDocumentId = await storedLiveDocumentId(db);
  let instances = MinLiveActivity.getInstances();

  if (rememberedDocumentId && rememberedDocumentId !== document.documentId) {
    await Promise.all(instances.map((instance) => instance.end('immediate')));
    instances = [];
  }

  if (!instances.length) {
    MinLiveActivity.start(props, props.url, staleDate);
    lastLiveSignature = liveSignature;
    await rememberLiveDocument(db, document.documentId);
    return;
  }

  if (liveSignature === lastLiveSignature && instances.length === 1) return;
  // Keep a single activity if an earlier version left duplicates behind.
  await Promise.all(instances.slice(1).map((instance) => instance.end('immediate')));
  instances = instances.slice(0, 1);
  await Promise.all(instances.map((instance) => instance.update(props, staleDate)));
  lastLiveSignature = liveSignature;
  await rememberLiveDocument(db, document.documentId);
}
