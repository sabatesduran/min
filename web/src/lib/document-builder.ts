import { Temporal } from '@js-temporal/polyfill';

import type { Accent, ChecklistItem, RoleAssignment, SharedDocument, Task } from '@/domain/models';
import { parseSharedDocument } from '@/domain/schema';
import { orderedTasks } from '@/domain/time';
import { buildDocumentFileName } from '@/features/sharing/document-file-name';

export type BuilderPerson = {
  id: string;
  name: string;
  disambiguation?: string;
};

export type BuilderTeam = {
  id: string;
  name: string;
  personIds: string[];
};

export type BuilderTask = {
  id: string;
  kind: 'point' | 'interval' | 'after';
  title: string;
  startsAt: string;
  endsAt: string;
  afterTaskId: string;
  place: string;
  notes: string;
  personIds: string[];
  teamIds: string[];
  common: boolean;
  // Kept from an imported file; the generator has no fields for them.
  category?: string;
  roles?: RoleAssignment[];
  checklist?: ChecklistItem[];
};

export type BuilderDraft = {
  documentId: string;
  organizationId: string;
  title: string;
  organization: string;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  notes: string;
  accent: Accent;
  people: BuilderPerson[];
  teams: BuilderTeam[];
  tasks: BuilderTask[];
  /** Revision of the imported file, so the download is published as the next one. */
  baseRevision?: number;
};

const id = () => crypto.randomUUID();

function localDateTime(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function localToInstant(value: string, timeZone: string): string {
  return Temporal.PlainDateTime.from(value)
    .toZonedDateTime(timeZone)
    .toString({ smallestUnit: 'second', timeZoneName: 'never' });
}

function instantToLocal(value: string, timeZone: string): string {
  return Temporal.Instant.from(value)
    .toZonedDateTimeISO(timeZone)
    .toPlainDateTime()
    .toString({ smallestUnit: 'minute' });
}

function emptyTask(startsAt: string, endsAt: string): BuilderTask {
  return {
    id: id(),
    kind: 'interval',
    title: '',
    startsAt,
    endsAt,
    afterTaskId: '',
    place: '',
    notes: '',
    personIds: [],
    teamIds: [],
    common: false,
  };
}

export function createBuilderDraft(now = new Date()): BuilderDraft {
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(18, 0, 0, 0);
  const firstEnd = new Date(start);
  firstEnd.setHours(10, 0, 0, 0);
  const startsAt = localDateTime(start);
  const endsAt = localDateTime(end);

  return {
    documentId: id(),
    organizationId: id(),
    title: '',
    organization: '',
    startsAt,
    endsAt,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid',
    notes: '',
    accent: 'blue',
    people: [],
    teams: [],
    tasks: [emptyTask(startsAt, localDateTime(firstEnd))],
  };
}

export function addBuilderTask(draft: BuilderDraft): BuilderTask {
  return emptyTask(draft.startsAt, draft.endsAt);
}

export function draftToDocument(draft: BuilderDraft): SharedDocument {
  const personIds = new Set(draft.people.map((person) => person.id));
  const teamIds = new Set(draft.teams.map((team) => team.id));
  const tasks = draft.tasks.map((task, sortOrder): Task => {
    const base = {
      id: task.id,
      title: task.title.trim(),
      ...(task.category?.trim() ? { category: task.category.trim() } : {}),
      sortOrder,
      ...(task.place.trim() ? { place: task.place.trim() } : {}),
      ...(task.notes.trim() ? { notes: task.notes.trim() } : {}),
      personIds: task.personIds,
      teamIds: task.teamIds,
      roles: (task.roles ?? []).map((role) => ({
        ...role,
        personIds: role.personIds.filter((personId) => personIds.has(personId)),
        teamIds: role.teamIds.filter((teamId) => teamIds.has(teamId)),
      })),
      common: task.common,
      checklist: task.checklist ?? [],
    };

    if (task.kind === 'after') {
      return { ...base, kind: 'after', afterTaskId: task.afterTaskId };
    }
    if (task.kind === 'point') {
      return { ...base, kind: 'point', startsAt: localToInstant(task.startsAt, draft.timeZone) };
    }
    return {
      ...base,
      kind: 'interval',
      startsAt: localToInstant(task.startsAt, draft.timeZone),
      endsAt: localToInstant(task.endsAt, draft.timeZone),
    };
  });

  return parseSharedDocument({
    schemaVersion: 1,
    documentId: draft.documentId,
    organizationId: draft.organizationId,
    revision: (draft.baseRevision ?? 0) + 1,
    publishedAt: new Date().toISOString(),
    event: {
      title: draft.title.trim(),
      organization: draft.organization.trim(),
      startsAt: localToInstant(draft.startsAt, draft.timeZone),
      endsAt: localToInstant(draft.endsAt, draft.timeZone),
      timeZone: draft.timeZone,
      ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
      accent: draft.accent,
    },
    people: draft.people.map((person) => ({
      id: person.id,
      name: person.name.trim(),
      ...(person.disambiguation?.trim() ? { disambiguation: person.disambiguation.trim() } : {}),
    })),
    teams: draft.teams.map((team) => ({ id: team.id, name: team.name.trim(), personIds: team.personIds })),
    tasks,
  });
}

export function documentToDraft(document: SharedDocument): BuilderDraft {
  const { timeZone } = document.event;
  return {
    documentId: document.documentId,
    organizationId: document.organizationId,
    title: document.event.title,
    organization: document.event.organization,
    startsAt: instantToLocal(document.event.startsAt, timeZone),
    endsAt: instantToLocal(document.event.endsAt, timeZone),
    timeZone,
    notes: document.event.notes ?? '',
    accent: document.event.accent,
    baseRevision: document.revision,
    people: document.people.map((person) => ({
      id: person.id,
      name: person.name,
      ...(person.disambiguation ? { disambiguation: person.disambiguation } : {}),
    })),
    teams: document.teams.map((team) => ({ id: team.id, name: team.name, personIds: [...team.personIds] })),
    // The download numbers tasks by position, so start from the order the app shows.
    tasks: orderedTasks(document.tasks).map((task) => ({
      id: task.id,
      kind: task.kind,
      title: task.title,
      startsAt: task.kind === 'after' ? '' : instantToLocal(task.startsAt, timeZone),
      endsAt: task.kind === 'interval' ? instantToLocal(task.endsAt, timeZone) : '',
      afterTaskId: task.kind === 'after' ? task.afterTaskId : '',
      place: task.place ?? '',
      notes: task.notes ?? '',
      personIds: [...task.personIds],
      teamIds: [...task.teamIds],
      common: task.common,
      ...(task.category ? { category: task.category } : {}),
      roles: task.roles.map((role) => ({ ...role, personIds: [...role.personIds], teamIds: [...role.teamIds] })),
      checklist: task.checklist.map((item) => ({ ...item })),
    })),
  };
}

export function documentFileName(title: string): string {
  return buildDocumentFileName(title);
}
