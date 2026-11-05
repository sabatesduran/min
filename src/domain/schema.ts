import { Temporal } from '@js-temporal/polyfill';
import { z } from 'zod';

const limits = {
  title: 160,
  name: 120,
  place: 240,
  notes: 20_000,
  checklist: 300,
} as const;

const idSchema = z.string().uuid();
const instantSchema = z.string().max(80).refine(
  (value) => {
    try {
      Temporal.Instant.from(value);
      return /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
    } catch {
      return false;
    }
  },
  { message: 'Cal una data ISO amb desplaçament horari.' },
);

const timeZoneSchema = z.string().min(1).max(80).refine(
  (value) => {
    try {
      new Intl.DateTimeFormat('ca-ES', { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  },
  { message: 'La zona horària no és vàlida.' },
);

const personSchema = z.strictObject({
  id: idSchema,
  name: z.string().trim().min(1).max(limits.name),
  disambiguation: z.string().trim().max(limits.name).optional(),
  initialsColor: z.enum(['blue', 'lime', 'lilac', 'peach', 'red']).optional(),
});

const teamSchema = z.strictObject({
  id: idSchema,
  name: z.string().trim().min(1).max(limits.name),
  personIds: z.array(idSchema).max(500),
});

const roleSchema = z.strictObject({
  id: idSchema,
  name: z.string().trim().min(1).max(limits.name),
  personIds: z.array(idSchema).max(500),
  teamIds: z.array(idSchema).max(100),
});

const checklistSchema = z.strictObject({
  id: idSchema,
  text: z.string().trim().min(1).max(limits.checklist),
});

const baseTaskShape = {
  id: idSchema,
  title: z.string().trim().min(1).max(limits.title),
  category: z.string().trim().max(limits.name).optional(),
  sortOrder: z.number().int().min(0).max(100_000),
  place: z.string().trim().max(limits.place).optional(),
  notes: z.string().max(limits.notes).optional(),
  personIds: z.array(idSchema).max(500),
  teamIds: z.array(idSchema).max(100),
  roles: z.array(roleSchema).max(100),
  common: z.boolean(),
  checklist: z.array(checklistSchema).max(200),
};

const taskSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...baseTaskShape, kind: z.literal('point'), startsAt: instantSchema }),
  z.strictObject({
    ...baseTaskShape,
    kind: z.literal('interval'),
    startsAt: instantSchema,
    endsAt: instantSchema,
  }),
  z.strictObject({ ...baseTaskShape, kind: z.literal('after'), afterTaskId: idSchema }),
]);

export const sharedDocumentSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    documentId: idSchema,
    organizationId: idSchema,
    revision: z.number().int().min(1),
    publishedAt: instantSchema,
    event: z.strictObject({
      title: z.string().trim().min(1).max(limits.title),
      organization: z.string().trim().min(1).max(limits.title),
      startsAt: instantSchema,
      endsAt: instantSchema,
      timeZone: timeZoneSchema,
      notes: z.string().max(limits.notes).optional(),
      accent: z.enum(['blue', 'lime', 'lilac', 'peach', 'red']),
    }),
    people: z.array(personSchema).max(500),
    teams: z.array(teamSchema).max(100),
    tasks: z.array(taskSchema).max(1_000),
  })
  .superRefine((document, context) => {
    const eventStart = Temporal.Instant.from(document.event.startsAt);
    const eventEnd = Temporal.Instant.from(document.event.endsAt);
    if (Temporal.Instant.compare(eventStart, eventEnd) >= 0) {
      context.addIssue({ code: 'custom', path: ['event', 'endsAt'], message: 'El final ha de ser posterior a l’inici.' });
    }

    const assertUnique = (items: { id: string }[], path: string) => {
      const ids = new Set<string>();
      for (const item of items) {
        if (ids.has(item.id)) context.addIssue({ code: 'custom', path: [path], message: `Hi ha un identificador repetit a ${path}.` });
        ids.add(item.id);
      }
    };
    assertUnique(document.people, 'people');
    assertUnique(document.teams, 'teams');
    assertUnique(document.tasks, 'tasks');

    const people = new Set(document.people.map((person) => person.id));
    const teams = new Set(document.teams.map((team) => team.id));
    const tasks = new Map(document.tasks.map((task) => [task.id, task]));

    document.teams.forEach((team, index) => {
      for (const personId of team.personIds) {
        if (!people.has(personId)) context.addIssue({ code: 'custom', path: ['teams', index, 'personIds'], message: 'L’equip referencia una persona inexistent.' });
      }
    });

    document.tasks.forEach((task, index) => {
      for (const personId of task.personIds) {
        if (!people.has(personId)) context.addIssue({ code: 'custom', path: ['tasks', index, 'personIds'], message: 'La tasca referencia una persona inexistent.' });
      }
      for (const teamId of task.teamIds) {
        if (!teams.has(teamId)) context.addIssue({ code: 'custom', path: ['tasks', index, 'teamIds'], message: 'La tasca referencia un equip inexistent.' });
      }
      if (task.kind === 'interval' && Temporal.Instant.compare(Temporal.Instant.from(task.startsAt), Temporal.Instant.from(task.endsAt)) >= 0) {
        context.addIssue({ code: 'custom', path: ['tasks', index, 'endsAt'], message: 'El final de la tasca ha de ser posterior a l’inici.' });
      }
      if (task.kind !== 'after') {
        const start = Temporal.Instant.from(task.startsAt);
        const end = task.kind === 'interval' ? Temporal.Instant.from(task.endsAt) : start;
        if (Temporal.Instant.compare(start, eventStart) < 0 || Temporal.Instant.compare(end, eventEnd) > 0) {
          context.addIssue({ code: 'custom', path: ['tasks', index], message: 'La tasca queda fora de la finestra de l’esdeveniment.' });
        }
      }
      if (task.kind === 'after' && !tasks.has(task.afterTaskId)) {
        context.addIssue({ code: 'custom', path: ['tasks', index, 'afterTaskId'], message: 'La tasca de referència no existeix.' });
      }
    });

    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (taskId: string): boolean => {
      if (visiting.has(taskId)) return true;
      if (visited.has(taskId)) return false;
      visiting.add(taskId);
      const task = tasks.get(taskId);
      const cycle = task?.kind === 'after' ? visit(task.afterTaskId) : false;
      visiting.delete(taskId);
      visited.add(taskId);
      return cycle;
    };
    for (const task of document.tasks) {
      if (visit(task.id)) {
        context.addIssue({ code: 'custom', path: ['tasks'], message: 'Les dependències «En acabar» formen un cicle.' });
        break;
      }
    }
  });

export type ParsedSharedDocument = z.infer<typeof sharedDocumentSchema>;

export function parseSharedDocument(input: unknown): ParsedSharedDocument {
  return sharedDocumentSchema.parse(input);
}

export function safeParseSharedDocument(input: unknown) {
  return sharedDocumentSchema.safeParse(input);
}
