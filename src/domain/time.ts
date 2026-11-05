import { Temporal } from '@js-temporal/polyfill';

import type { DocumentPreferences, EventStatus, SharedDocument, Task } from './models';

const POINT_READING_WINDOW_MS = 10 * 60 * 1_000;

export type Clock = { now: () => number };
export const systemClock: Clock = { now: () => Date.now() };

export function eventStatus(event: SharedDocument['event'], nowMs: number): EventStatus {
  const start = Temporal.Instant.from(event.startsAt).epochMilliseconds;
  const end = Temporal.Instant.from(event.endsAt).epochMilliseconds;
  return nowMs < start ? 'upcoming' : nowMs < end ? 'active' : 'finished';
}

export function taskStartMs(task: Task): number | null {
  return task.kind === 'after' ? null : Temporal.Instant.from(task.startsAt).epochMilliseconds;
}

export function isTaskCurrent(task: Task, nowMs: number): boolean {
  if (task.kind === 'interval') {
    return Temporal.Instant.from(task.startsAt).epochMilliseconds <= nowMs && nowMs < Temporal.Instant.from(task.endsAt).epochMilliseconds;
  }
  if (task.kind === 'point') {
    const start = Temporal.Instant.from(task.startsAt).epochMilliseconds;
    return start <= nowMs && nowMs < start + POINT_READING_WINDOW_MS;
  }
  return false;
}

export function orderedTasks(tasks: Task[]): Task[] {
  const base = tasks
    .filter((task) => task.kind !== 'after')
    .sort((left, right) => (taskStartMs(left) ?? 0) - (taskStartMs(right) ?? 0) || left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
  const children = new Map<string, Task[]>();
  for (const task of tasks) {
    if (task.kind !== 'after') continue;
    const group = children.get(task.afterTaskId) ?? [];
    group.push(task);
    group.sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
    children.set(task.afterTaskId, group);
  }
  const result: Task[] = [];
  const append = (task: Task) => {
    result.push(task);
    for (const child of children.get(task.id) ?? []) append(child);
  };
  base.forEach(append);
  return result;
}

export function personIdsForTask(document: SharedDocument, task: Task): Set<string> {
  const ids = new Set(task.personIds);
  for (const teamId of task.teamIds) {
    document.teams.find((team) => team.id === teamId)?.personIds.forEach((id) => ids.add(id));
  }
  for (const role of task.roles) {
    role.personIds.forEach((id) => ids.add(id));
    for (const teamId of role.teamIds) {
      document.teams.find((team) => team.id === teamId)?.personIds.forEach((id) => ids.add(id));
    }
  }
  return ids;
}

export function filterTasks(document: SharedDocument, preferences: DocumentPreferences): Task[] {
  const tasks = orderedTasks(document.tasks);
  if (preferences.filter === 'all' || !preferences.mePersonId) return tasks;
  return tasks.filter((task) => personIdsForTask(document, task).has(preferences.mePersonId!) || (preferences.includeCommon && task.common));
}

export function currentTasks(document: SharedDocument, preferences: DocumentPreferences, nowMs: number): Task[] {
  const me = preferences.mePersonId;
  return filterTasks(document, preferences)
    .filter((task) => isTaskCurrent(task, nowMs))
    .sort((left, right) => {
      const leftMine = me ? Number(personIdsForTask(document, left).has(me)) : 0;
      const rightMine = me ? Number(personIdsForTask(document, right).has(me)) : 0;
      return rightMine - leftMine || left.sortOrder - right.sortOrder;
    });
}

export function nextTaskGroup(document: SharedDocument, preferences: DocumentPreferences, nowMs: number): Task[] {
  const future = filterTasks(document, preferences).filter((task) => {
    const start = taskStartMs(task);
    return start !== null && start > nowMs;
  });
  const firstStart = future.length ? taskStartMs(future[0]!) : null;
  return firstStart === null ? [] : future.filter((task) => taskStartMs(task) === firstStart);
}

export function nextBoundaryMs(document: SharedDocument, nowMs: number): number | null {
  const boundaries = [
    Temporal.Instant.from(document.event.startsAt).epochMilliseconds,
    Temporal.Instant.from(document.event.endsAt).epochMilliseconds,
    ...document.tasks.flatMap((task) => {
      if (task.kind === 'after') return [];
      if (task.kind === 'point') return [Temporal.Instant.from(task.startsAt).epochMilliseconds, Temporal.Instant.from(task.startsAt).epochMilliseconds + POINT_READING_WINDOW_MS];
      return [Temporal.Instant.from(task.startsAt).epochMilliseconds, Temporal.Instant.from(task.endsAt).epochMilliseconds];
    }),
  ].filter((value) => value > nowMs);
  return boundaries.length ? Math.min(...boundaries) : null;
}

export function formatTime(instant: string, timeZone: string): string {
  return new Intl.DateTimeFormat('ca-ES', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(instant));
}

export function formatDate(instant: string, timeZone: string): string {
  return new Intl.DateTimeFormat('ca-ES', { timeZone, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(instant));
}

export function formatDateTime(instant: string, timeZone: string): string {
  return new Intl.DateTimeFormat('ca-ES', { timeZone, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(instant));
}

export function formatTaskTime(task: Task, document: SharedDocument): string {
  if (task.kind === 'after') {
    const parent = document.tasks.find((candidate) => candidate.id === task.afterTaskId);
    return parent ? `En acabar ${parent.title}` : 'En acabar';
  }
  if (task.kind === 'point') return formatTime(task.startsAt, document.event.timeZone);
  return `${formatTime(task.startsAt, document.event.timeZone)}–${formatTime(task.endsAt, document.event.timeZone)}`;
}

export function minutesUntil(instant: string, nowMs: number): number {
  return Math.max(0, Math.ceil((Temporal.Instant.from(instant).epochMilliseconds - nowMs) / 60_000));
}

export function resolveLocalDateTime(local: string, timeZone: string, disambiguation: 'earlier' | 'later' | 'reject' = 'reject'): string {
  const plain = Temporal.PlainDateTime.from(local);
  return plain.toZonedDateTime(timeZone, { disambiguation }).toInstant().toString();
}
