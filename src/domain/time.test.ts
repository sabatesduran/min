import { describe, expect, it } from 'vitest';

import {
  currentTasks,
  filterTasks,
  nextTaskGroup,
  orderedTasks,
  personIdsForTask,
  resolveLocalDateTime,
} from './time';
import { ids, makeDocument, makePreferences } from '@/test/fixtures';

describe('motor temporal', () => {
  it('manté les tasques En acabar just després de la seva referència', () => {
    expect(orderedTasks(makeDocument().tasks).map((task) => task.id)).toEqual([
      ids.interval,
      ids.point,
      ids.after,
    ]);
  });

  it('considera vigent un interval i una tasca puntual durant deu minuts', () => {
    const document = makeDocument();
    const preferences = makePreferences();
    expect(currentTasks(document, preferences, Date.parse('2026-06-01T08:30:00Z')).map((task) => task.id)).toEqual([ids.interval]);
    expect(currentTasks(document, preferences, Date.parse('2026-06-01T10:09:59Z')).map((task) => task.id)).toEqual([ids.point]);
    expect(currentTasks(document, preferences, Date.parse('2026-06-01T10:10:00Z'))).toEqual([]);
  });

  it('resol equips i funcions al filtre personal', () => {
    const document = makeDocument();
    const point = document.tasks.find((task) => task.id === ids.point)!;
    expect(personIdsForTask(document, point)).toEqual(new Set([ids.personBiel, ids.personAda]));
    expect(filterTasks(document, makePreferences({ filter: 'mine', includeCommon: false })).map((task) => task.id)).toEqual([
      ids.interval,
      ids.point,
    ]);
  });

  it('agrupa totes les tasques del següent instant', () => {
    const document = makeDocument();
    document.tasks.push({
      ...document.tasks[1]!,
      id: '10000000-0000-4000-8000-000000000011',
      title: 'Segona sortida',
      sortOrder: 4,
    });
    expect(nextTaskGroup(document, makePreferences(), Date.parse('2026-06-01T09:30:00Z'))).toHaveLength(2);
  });

  it('fa explícita l’ambigüitat del canvi d’hora', () => {
    expect(() => resolveLocalDateTime('2026-10-25T02:30:00', 'Europe/Madrid')).toThrow();
    expect(resolveLocalDateTime('2026-10-25T02:30:00', 'Europe/Madrid', 'earlier')).not.toBe(
      resolveLocalDateTime('2026-10-25T02:30:00', 'Europe/Madrid', 'later'),
    );
  });
});
