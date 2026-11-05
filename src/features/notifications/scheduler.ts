import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import {
  getNotificationIds,
  replaceNotificationJobs,
  saveDocumentPreferencesAndNotificationJobs,
} from '@/db/repository';
import type { DocumentPreferences, SharedDocument } from '@/domain/models';
import { formatTime } from '@/domain/time';

import { buildDocumentNotificationGroups } from './notification-plan';

export { buildDocumentNotificationGroups, preferencesValidForDocument } from './notification-plan';

const ANDROID_CHANNEL_ID = 'task-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type NotificationPermissionState = 'granted' | 'provisional' | 'undetermined' | 'denied' | 'unavailable';

function permissionAllowed(permission: Notifications.NotificationPermissionsStatus): boolean {
  return permission.granted
    || permission.ios?.status === IosAuthorizationStatus.PROVISIONAL
    || permission.ios?.status === IosAuthorizationStatus.EPHEMERAL;
}

async function androidChannelIsBlocked(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const channel = await Notifications.getNotificationChannelAsync(ANDROID_CHANNEL_ID);
  return channel?.importance === AndroidImportance.NONE;
}

async function prepareAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Avisos de tasques',
    description: 'Alertes abans de les tasques dels teus esdeveniments.',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
    vibrationPattern: [0, 250, 150, 250],
    showBadge: false,
  });
}

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  if (Platform.OS === 'web') return 'unavailable';
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.ios?.status === IosAuthorizationStatus.PROVISIONAL) return 'provisional';
    if (permissionAllowed(permission)) return await androidChannelIsBlocked() ? 'denied' : 'granted';
    return permission.status === 'undetermined' ? 'undetermined' : 'denied';
  } catch {
    return 'unavailable';
  }
}

async function ensureNotificationPermission(): Promise<void> {
  await prepareAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  const finalPermission = permissionAllowed(current) ? current : await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
    android: {},
  });
  if (!permissionAllowed(finalPermission) || await androidChannelIsBlocked()) {
    throw new Error('Els avisos estan desactivats als ajustos del sistema.');
  }
}

export async function getScheduledDocumentNotificationCount(db: SQLiteDatabase, documentId: string): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const ids = new Set(await getNotificationIds(db, documentId));
  if (!ids.size) return 0;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.filter((notification) => ids.has(notification.identifier)).length;
  } catch {
    return ids.size;
  }
}

export async function cancelDocumentNotifications(db: SQLiteDatabase, documentId: string): Promise<void> {
  const ids = await getNotificationIds(db, documentId);
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  await replaceNotificationJobs(db, documentId, []);
}

type NotificationJob = { groupKey: string; nativeId: string; scheduledFor: string };

async function createNativeJobs(document: SharedDocument, preferences: DocumentPreferences): Promise<NotificationJob[]> {
  const groups = buildDocumentNotificationGroups(document, preferences);
  const jobs: NotificationJob[] = [];
  try {
    for (const { start, triggerAt, tasks } of groups) {
      const first = tasks[0]!;
      const taskSummary = tasks.length === 1 ? first.title : `${first.title} i ${tasks.length - 1} més`;
      const triggerDate = new Date(triggerAt);
      const nativeId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `A les ${formatTime(new Date(start).toISOString(), document.event.timeZone)} · ${document.event.title}`,
          body: taskSummary,
          sound: 'default',
          data: { url: `min://event/${document.documentId}`, documentId: document.documentId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
        },
      });
      jobs.push({ groupKey: `${start}`, nativeId, scheduledFor: triggerDate.toISOString() });
    }
    return jobs;
  } catch (error) {
    await Promise.allSettled(jobs.map((job) => Notifications.cancelScheduledNotificationAsync(job.nativeId)));
    throw error;
  }
}

async function replaceDocumentNotifications(
  db: SQLiteDatabase,
  document: SharedDocument,
  preferences: DocumentPreferences,
  persistPreferences: boolean,
): Promise<number> {
  const oldIds = await getNotificationIds(db, document.documentId);
  if (preferences.reminderMinutes === null || preferences.reminderMode === 'off') {
    await Promise.all(oldIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    if (persistPreferences) await saveDocumentPreferencesAndNotificationJobs(db, preferences, []);
    else await replaceNotificationJobs(db, document.documentId, []);
    return 0;
  }

  await ensureNotificationPermission();
  const jobs = await createNativeJobs(document, preferences);
  try {
    await Promise.all(oldIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    if (persistPreferences) await saveDocumentPreferencesAndNotificationJobs(db, preferences, jobs);
    else await replaceNotificationJobs(db, document.documentId, jobs);
  } catch (error) {
    await Promise.allSettled(jobs.map((job) => Notifications.cancelScheduledNotificationAsync(job.nativeId)));
    throw error;
  }
  return jobs.length;
}

export async function scheduleDocumentNotifications(
  db: SQLiteDatabase,
  document: SharedDocument,
  preferences: DocumentPreferences,
): Promise<number> {
  return replaceDocumentNotifications(db, document, preferences, false);
}

export async function applyDocumentNotificationPreferences(
  db: SQLiteDatabase,
  document: SharedDocument,
  preferences: DocumentPreferences,
): Promise<number> {
  return replaceDocumentNotifications(db, document, preferences, true);
}
