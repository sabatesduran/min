import type { SharedDocument, Task } from './models';
import { personIdsForTask } from './time';

export type EditorialIssue = {
  kind: 'overlap' | 'unassigned-role' | 'unassigned-task' | 'person-without-tasks' | 'empty-team';
  message: string;
  taskId?: string;
  personId?: string;
  teamId?: string;
};

function taskRange(task: Task): { start: number; end: number } | null {
  if (task.kind === 'after') return null;
  const start = new Date(task.startsAt).getTime();
  return { start, end: task.kind === 'interval' ? new Date(task.endsAt).getTime() : start + 1 };
}

export function validateEditorially(document: SharedDocument): EditorialIssue[] {
  const issues: EditorialIssue[] = [];
  const assignedTaskIdsByPerson = new Map<string, Set<string>>();

  for (const task of document.tasks) {
    const people = personIdsForTask(document, task);
    people.forEach((personId) => {
      const ids = assignedTaskIdsByPerson.get(personId) ?? new Set<string>();
      ids.add(task.id);
      assignedTaskIdsByPerson.set(personId, ids);
    });
    if (!people.size && !task.common) {
      issues.push({ kind: 'unassigned-task', taskId: task.id, message: `«${task.title}» no té cap responsable.` });
    }
    for (const role of task.roles) {
      if (!role.personIds.length && !role.teamIds.length) {
        issues.push({ kind: 'unassigned-role', taskId: task.id, message: `La funció «${role.name}» de «${task.title}» està per assignar.` });
      }
    }
  }

  for (const person of document.people) {
    const taskIds = assignedTaskIdsByPerson.get(person.id) ?? new Set<string>();
    if (!taskIds.size) {
      issues.push({ kind: 'person-without-tasks', personId: person.id, message: `${person.name} no té cap tasca assignada.` });
      continue;
    }
    const tasks = document.tasks
      .filter((task) => taskIds.has(task.id))
      .map((task) => ({ task, range: taskRange(task) }))
      .filter((item): item is { task: Task; range: { start: number; end: number } } => item.range !== null)
      .sort((left, right) => left.range.start - right.range.start || left.range.end - right.range.end);
    for (let index = 0; index < tasks.length; index += 1) {
      const left = tasks[index]!;
      for (let nextIndex = index + 1; nextIndex < tasks.length; nextIndex += 1) {
        const right = tasks[nextIndex]!;
        if (right.range.start >= left.range.end) break;
        issues.push({
          kind: 'overlap',
          personId: person.id,
          taskId: right.task.id,
          message: `${person.name} té «${left.task.title}» i «${right.task.title}» alhora.`,
        });
      }
    }
  }

  for (const team of document.teams) {
    if (!team.personIds.length) issues.push({ kind: 'empty-team', teamId: team.id, message: `L’equip «${team.name}» no té cap persona.` });
  }
  return issues;
}
