import { describe, expect, it } from 'vitest';

import { ids, makeDocument, makePreferences } from '@/test/fixtures';

import { buildDocumentNotificationGroups, preferencesValidForDocument } from './notification-plan';

describe('avisos locals', () => {
  const beforeEvent = Date.parse('2026-06-01T07:00:00Z');

  it('programa només les tasques assignades a la persona seleccionada', () => {
    const groups = buildDocumentNotificationGroups(
      makeDocument(),
      makePreferences({ reminderMode: 'mine', reminderMinutes: 10, reminderIncludeCommon: false }),
      beforeEvent,
    );

    expect(groups.map((group) => group.tasks.map((task) => task.title))).toEqual([
      ['Munta la plaça'],
      ['Engega el cercavila'],
    ]);
    expect(groups[0]?.triggerAt).toBe(Date.parse('2026-06-01T07:50:00Z'));
  });

  it('inclou les tasques generals opcionalment i agrupa les simultànies', () => {
    const document = makeDocument();
    const simultaneous = {
      ...document.tasks[0]!,
      id: '10000000-0000-4000-8000-000000000099',
      title: 'Prepara el material',
      personIds: [ids.personBiel],
      common: true,
    };
    const groups = buildDocumentNotificationGroups(
      { ...document, tasks: [...document.tasks, simultaneous] },
      makePreferences({ reminderMode: 'mine', reminderMinutes: 5, reminderIncludeCommon: true }),
      beforeEvent,
    );

    expect(groups[0]?.tasks.map((task) => task.title)).toEqual(['Munta la plaça', 'Prepara el material']);
  });

  it('desactiva els modes personals si una revisió elimina la identitat triada', () => {
    const preferences = makePreferences({
      filter: 'mine',
      liveMode: 'mine',
      reminderMode: 'mine',
      reminderMinutes: 10,
    });
    const document = makeDocument({ people: [{ id: ids.personBiel, name: 'Biel Soler', initialsColor: 'lime' }] });

    expect(preferencesValidForDocument(document, preferences)).toMatchObject({
      mePersonId: null,
      filter: 'all',
      liveMode: 'off',
      reminderMode: 'off',
      reminderMinutes: null,
    });
  });
});
