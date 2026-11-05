import { describe, expect, it } from 'vitest';

import type { Task } from './models';
import { moveTaskInSlot, taskPositionInSlot } from './task-order';

const base = { personIds: [], teamIds: [], roles: [], common: false, checklist: [] };
const tasks: Task[] = [
  { ...base, id: '00000000-0000-4000-8000-000000000001', title: 'A', kind: 'point', startsAt: '2026-01-01T10:00:00Z', sortOrder: 0 },
  { ...base, id: '00000000-0000-4000-8000-000000000002', title: 'B', kind: 'point', startsAt: '2026-01-01T10:00:00Z', sortOrder: 1 },
  { ...base, id: '00000000-0000-4000-8000-000000000003', title: 'C', kind: 'point', startsAt: '2026-01-01T11:00:00Z', sortOrder: 2 },
];

describe('task order', () => {
  it('reordena només dins del mateix moment', () => {
    const moved = moveTaskInSlot(tasks, tasks[1]!.id, 'up');
    expect(moved.find((task) => task.id === tasks[1]!.id)?.sortOrder).toBe(0);
    expect(moved.find((task) => task.id === tasks[2]!.id)?.sortOrder).toBe(2);
  });

  it('indica els límits del grup', () => {
    expect(taskPositionInSlot(tasks, tasks[0]!.id)).toEqual({ canMoveUp: false, canMoveDown: true });
    expect(taskPositionInSlot(tasks, tasks[2]!.id)).toEqual({ canMoveUp: false, canMoveDown: false });
  });
});
