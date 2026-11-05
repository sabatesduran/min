import { describe, expect, it } from 'vitest';

import type { SharedDocument } from './models';
import { personRemovalImpact, removePerson } from './person-removal';

const removed = '00000000-0000-4000-8000-000000000001';
const replacement = '00000000-0000-4000-8000-000000000002';
const document = {
  people: [{ id: removed, name: 'A' }, { id: replacement, name: 'B' }],
  teams: [{ id: '00000000-0000-4000-8000-000000000003', name: 'Equip', personIds: [removed] }],
  tasks: [{ id: '00000000-0000-4000-8000-000000000004', title: 'Tasca', kind: 'point', startsAt: '2026-01-01T10:00:00Z', sortOrder: 0, personIds: [removed], teamIds: [], roles: [{ id: '00000000-0000-4000-8000-000000000005', name: 'Rol', personIds: [removed], teamIds: [] }], common: false, checklist: [] }],
} as unknown as SharedDocument;

describe('person removal', () => {
  it('descriu totes les assignacions afectades', () => {
    expect(personRemovalImpact(document, removed)).toEqual({ directTasks: ['Tasca'], roles: [{ taskTitle: 'Tasca', roleName: 'Rol' }], teams: ['Equip'] });
  });

  it('pot reassignar totes les referències', () => {
    const result = removePerson(document, removed, replacement);
    expect(result.teams[0]?.personIds).toEqual([replacement]);
    expect(result.tasks[0]?.personIds).toEqual([replacement]);
    expect(result.tasks[0]?.roles[0]?.personIds).toEqual([replacement]);
  });
});
