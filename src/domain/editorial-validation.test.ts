import { describe, expect, it } from 'vitest';

import type { SharedDocument } from './models';
import { validateEditorially } from './editorial-validation';

const personId = '00000000-0000-4000-8000-000000000001';
const taskA = '00000000-0000-4000-8000-000000000002';
const taskB = '00000000-0000-4000-8000-000000000003';

function document(): SharedDocument {
  return {
    schemaVersion: 1,
    documentId: '00000000-0000-4000-8000-000000000010',
    organizationId: '00000000-0000-4000-8000-000000000011',
    revision: 1,
    publishedAt: '2026-01-01T00:00:00Z',
    event: { title: 'Prova', organization: 'Colla', startsAt: '2026-01-01T08:00:00Z', endsAt: '2026-01-01T18:00:00Z', timeZone: 'Europe/Madrid', accent: 'blue' },
    people: [{ id: personId, name: 'Dídac' }],
    teams: [],
    tasks: [
      { id: taskA, title: 'A', kind: 'interval', startsAt: '2026-01-01T10:00:00Z', endsAt: '2026-01-01T11:00:00Z', sortOrder: 0, personIds: [personId], teamIds: [], roles: [], common: false, checklist: [] },
      { id: taskB, title: 'B', kind: 'interval', startsAt: '2026-01-01T10:30:00Z', endsAt: '2026-01-01T11:30:00Z', sortOrder: 1, personIds: [personId], teamIds: [], roles: [], common: false, checklist: [] },
    ],
  };
}

describe('validateEditorially', () => {
  it('detecta solapaments d’una persona', () => {
    expect(validateEditorially(document()).some((issue) => issue.kind === 'overlap')).toBe(true);
  });

  it('no considera solapades dues tasques contigües', () => {
    const value = document();
    const first = value.tasks[0];
    if (first?.kind === 'interval') first.endsAt = '2026-01-01T10:30:00Z';
    expect(validateEditorially(value).some((issue) => issue.kind === 'overlap')).toBe(false);
  });

  it('avisa de tasques i funcions sense assignar', () => {
    const value = document();
    value.tasks = [{ ...value.tasks[0]!, personIds: [], roles: [{ id: '00000000-0000-4000-8000-000000000004', name: 'Coordinació', personIds: [], teamIds: [] }] }];
    const kinds = validateEditorially(value).map((issue) => issue.kind);
    expect(kinds).toContain('unassigned-task');
    expect(kinds).toContain('unassigned-role');
  });
});
