import type { DocumentPreferences, SharedDocument } from '@/domain/models';

export const ids = {
  document: '10000000-0000-4000-8000-000000000001',
  organization: '10000000-0000-4000-8000-000000000002',
  personAda: '10000000-0000-4000-8000-000000000003',
  personBiel: '10000000-0000-4000-8000-000000000004',
  team: '10000000-0000-4000-8000-000000000005',
  interval: '10000000-0000-4000-8000-000000000006',
  point: '10000000-0000-4000-8000-000000000007',
  after: '10000000-0000-4000-8000-000000000008',
  role: '10000000-0000-4000-8000-000000000009',
  checklist: '10000000-0000-4000-8000-000000000010',
} as const;

export function makeDocument(overrides: Partial<SharedDocument> = {}): SharedDocument {
  const document: SharedDocument = {
    schemaVersion: 1,
    documentId: ids.document,
    organizationId: ids.organization,
    revision: 1,
    publishedAt: '2026-06-01T07:00:00Z',
    event: {
      title: 'Festa del foc',
      organization: 'Colla de prova',
      startsAt: '2026-06-01T08:00:00Z',
      endsAt: '2026-06-01T18:00:00Z',
      timeZone: 'Europe/Madrid',
      accent: 'blue',
    },
    people: [
      { id: ids.personAda, name: 'Ada Puig', initialsColor: 'lilac' },
      { id: ids.personBiel, name: 'Biel Soler', initialsColor: 'lime' },
    ],
    teams: [{ id: ids.team, name: 'Foc', personIds: [ids.personBiel] }],
    tasks: [
      {
        id: ids.interval,
        kind: 'interval',
        title: 'Munta la plaça',
        sortOrder: 0,
        startsAt: '2026-06-01T08:00:00Z',
        endsAt: '2026-06-01T09:00:00Z',
        personIds: [ids.personAda],
        teamIds: [],
        roles: [],
        common: false,
        checklist: [{ id: ids.checklist, text: 'Comprova el material' }],
      },
      {
        id: ids.point,
        kind: 'point',
        title: 'Engega el cercavila',
        sortOrder: 1,
        startsAt: '2026-06-01T10:00:00Z',
        personIds: [],
        teamIds: [ids.team],
        roles: [{ id: ids.role, name: 'Coordinació', personIds: [ids.personAda], teamIds: [] }],
        common: true,
        checklist: [],
      },
      {
        id: ids.after,
        kind: 'after',
        title: 'Recull les tanques',
        sortOrder: 2,
        afterTaskId: ids.point,
        personIds: [ids.personBiel],
        teamIds: [],
        roles: [],
        common: false,
        checklist: [],
      },
    ],
  };
  return { ...document, ...overrides };
}

export function makePreferences(overrides: Partial<DocumentPreferences> = {}): DocumentPreferences {
  return {
    documentId: ids.document,
    mePersonId: ids.personAda,
    filter: 'all',
    includeCommon: true,
    followingPersonId: null,
    liveMode: 'off',
    liveIncludeCommon: true,
    reminderMode: 'off',
    reminderIncludeCommon: true,
    reminderMinutes: null,
    ...overrides,
  };
}
