import type { Task } from './models';

function slotKey(task: Task): string {
  return task.kind === 'after' ? `after:${task.afterTaskId}` : `at:${task.startsAt}`;
}

export function moveTaskInSlot(tasks: Task[], taskId: string, direction: 'up' | 'down'): Task[] {
  const target = tasks.find((task) => task.id === taskId);
  if (!target) return tasks;
  const siblings = tasks
    .filter((task) => slotKey(task) === slotKey(target))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
  const index = siblings.findIndex((task) => task.id === taskId);
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= siblings.length) return tasks;
  [siblings[index], siblings[swapIndex]] = [siblings[swapIndex]!, siblings[index]!];
  const order = new Map(siblings.map((task, orderIndex) => [task.id, orderIndex]));
  return tasks.map((task) => order.has(task.id) ? { ...task, sortOrder: order.get(task.id)! } : task);
}

export function taskPositionInSlot(tasks: Task[], taskId: string): { canMoveUp: boolean; canMoveDown: boolean } {
  const target = tasks.find((task) => task.id === taskId);
  if (!target) return { canMoveUp: false, canMoveDown: false };
  const siblings = tasks
    .filter((task) => slotKey(task) === slotKey(target))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
  const index = siblings.findIndex((task) => task.id === taskId);
  return { canMoveUp: index > 0, canMoveDown: index >= 0 && index < siblings.length - 1 };
}
