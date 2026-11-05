import { randomUUID } from 'node:crypto';
import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it, vi } from 'vitest';

import { createDemoDocument } from './factory';
import { currentTasks, eventStatus, personIdsForTask } from './time';

vi.mock('expo-crypto', () => ({ randomUUID }));

describe('document de demostració', () => {
  it('crea un esdeveniment complet, editable i actiu el dia actual', () => {
    const nowMs = Date.parse('2026-11-04T20:00:00Z');
    const timeZone = 'Europe/Madrid';
    const document = createDemoDocument(nowMs, timeZone);
    const startDay = Temporal.Instant.from(document.event.startsAt).toZonedDateTimeISO(timeZone).toPlainDate().toString();
    const currentDay = Temporal.Instant.fromEpochMilliseconds(nowMs).toZonedDateTimeISO(timeZone).toPlainDate().toString();

    expect(document.event.title).toContain('Demo');
    expect(startDay).toBe(currentDay);
    expect(eventStatus(document.event, nowMs)).toBe('active');
    expect(Date.parse(document.event.endsAt) - Date.parse(document.event.startsAt)).toBe(12 * 60 * 60 * 1_000);
    expect(document.people).toHaveLength(10);
    expect(document.people.every((person) => person.disambiguation === undefined)).toBe(true);
    expect(document.teams).toHaveLength(6);
    expect(document.tasks).toHaveLength(24);
    const assignedPeople = new Set<string>();
    document.tasks.forEach((task) => personIdsForTask(document, task).forEach((personId) => assignedPeople.add(personId)));
    expect(assignedPeople.size).toBe(document.people.length);
    expect(document.tasks.filter((task) => task.roles.length)).not.toHaveLength(0);
    expect(document.tasks.filter((task) => task.checklist.length)).not.toHaveLength(0);
    expect(currentTasks(document, {
      documentId: document.documentId,
      mePersonId: null,
      filter: 'all',
      includeCommon: true,
      followingPersonId: null,
      liveMode: 'off',
      liveIncludeCommon: true,
      reminderMode: 'off',
      reminderIncludeCommon: true,
      reminderMinutes: null,
    }, nowMs)).not.toHaveLength(0);
  });
});
