import type { DocumentPreferences, SharedDocument, Task } from '@/domain/models';
import { personIdsForTask, taskStartMs } from '@/domain/time';

export type NotificationGroup = {
  start: number;
  triggerAt: number;
  tasks: Task[];
};

function eligible(document: SharedDocument, task: Task, preferences: DocumentPreferences): boolean {
  if (task.kind === 'after' || preferences.reminderMode === 'off') return false;
  if (preferences.reminderMode === 'all') return true;
  if (!preferences.mePersonId) return false;
  return personIdsForTask(document, task).has(preferences.mePersonId) || (preferences.reminderIncludeCommon && task.common);
}

export function buildDocumentNotificationGroups(
  document: SharedDocument,
  preferences: DocumentPreferences,
  nowMs = Date.now(),
): NotificationGroup[] {
  if (preferences.reminderMinutes === null || preferences.reminderMode === 'off') return [];
  const byStart = new Map<number, Task[]>();
  for (const task of document.tasks) {
    const start = taskStartMs(task);
    if (start === null || !eligible(document, task, preferences)) continue;
    const triggerAt = start - preferences.reminderMinutes * 60_000;
    if (triggerAt <= nowMs) continue;
    byStart.set(start, [...(byStart.get(start) ?? []), task]);
  }
  return [...byStart.entries()]
    .sort(([left], [right]) => left - right)
    .slice(0, 60)
    .map(([start, tasks]) => ({ start, triggerAt: start - preferences.reminderMinutes! * 60_000, tasks }));
}

export function preferencesValidForDocument(
  document: SharedDocument,
  preferences: DocumentPreferences,
): DocumentPreferences {
  const personIds = new Set(document.people.map((person) => person.id));
  const mePersonId = preferences.mePersonId && personIds.has(preferences.mePersonId) ? preferences.mePersonId : null;
  const followingPersonId = preferences.followingPersonId && personIds.has(preferences.followingPersonId)
    ? preferences.followingPersonId
    : null;
  if (mePersonId) return { ...preferences, mePersonId, followingPersonId };
  return {
    ...preferences,
    mePersonId: null,
    followingPersonId,
    filter: preferences.filter === 'mine' ? 'all' : preferences.filter,
    liveMode: preferences.liveMode === 'mine' ? 'off' : preferences.liveMode,
    reminderMode: preferences.reminderMode === 'mine' ? 'off' : preferences.reminderMode,
    reminderMinutes: preferences.reminderMode === 'mine' ? null : preferences.reminderMinutes,
  };
}
