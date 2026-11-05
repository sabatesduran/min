import type { SharedDocument } from './models';

export type DocumentDiff = {
  tasksAdded: string[];
  tasksRemoved: string[];
  tasksChanged: string[];
  peopleAdded: string[];
  peopleRemoved: string[];
  eventChanged: boolean;
};

export function diffDocuments(previous: SharedDocument, next: SharedDocument): DocumentDiff {
  const previousTasks = new Map(previous.tasks.map((task) => [task.id, task]));
  const nextTasks = new Map(next.tasks.map((task) => [task.id, task]));
  const previousPeople = new Map(previous.people.map((person) => [person.id, person]));
  const nextPeople = new Map(next.people.map((person) => [person.id, person]));
  return {
    tasksAdded: next.tasks.filter((task) => !previousTasks.has(task.id)).map((task) => task.title),
    tasksRemoved: previous.tasks.filter((task) => !nextTasks.has(task.id)).map((task) => task.title),
    tasksChanged: next.tasks
      .filter((task) => previousTasks.has(task.id) && JSON.stringify(previousTasks.get(task.id)) !== JSON.stringify(task))
      .map((task) => task.title),
    peopleAdded: next.people.filter((person) => !previousPeople.has(person.id)).map((person) => person.name),
    peopleRemoved: previous.people.filter((person) => !nextPeople.has(person.id)).map((person) => person.name),
    eventChanged: JSON.stringify(previous.event) !== JSON.stringify(next.event),
  };
}
