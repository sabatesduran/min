import type { SharedDocument } from './models';

export type PersonRemovalImpact = {
  directTasks: string[];
  roles: { taskTitle: string; roleName: string }[];
  teams: string[];
};

export function personRemovalImpact(document: SharedDocument, personId: string): PersonRemovalImpact {
  return {
    directTasks: document.tasks.filter((task) => task.personIds.includes(personId)).map((task) => task.title),
    roles: document.tasks.flatMap((task) => task.roles
      .filter((role) => role.personIds.includes(personId))
      .map((role) => ({ taskTitle: task.title, roleName: role.name }))),
    teams: document.teams.filter((team) => team.personIds.includes(personId)).map((team) => team.name),
  };
}

function replaceId(values: string[], removedId: string, replacementId: string | null): string[] {
  const next = values.filter((id) => id !== removedId);
  if (replacementId && !next.includes(replacementId) && values.includes(removedId)) next.push(replacementId);
  return next;
}

export function removePerson(document: SharedDocument, personId: string, replacementId: string | null): SharedDocument {
  if (replacementId === personId) throw new Error('La persona substituta ha de ser diferent.');
  if (replacementId && !document.people.some((person) => person.id === replacementId)) throw new Error('No s’ha trobat la persona substituta.');
  return {
    ...document,
    people: document.people.filter((person) => person.id !== personId),
    teams: document.teams.map((team) => ({ ...team, personIds: replaceId(team.personIds, personId, replacementId) })),
    tasks: document.tasks.map((task) => ({
      ...task,
      personIds: replaceId(task.personIds, personId, replacementId),
      roles: task.roles.map((role) => ({ ...role, personIds: replaceId(role.personIds, personId, replacementId) })),
    })),
  };
}
