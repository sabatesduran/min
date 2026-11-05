import { describe, expect, it } from 'vitest';

import { safeParseSharedDocument } from './schema';
import { ids, makeDocument } from '@/test/fixtures';

describe('sharedDocumentSchema', () => {
  it('accepta un document complet vàlid', () => {
    expect(safeParseSharedDocument(makeDocument()).success).toBe(true);
  });

  it('rebutja referències inexistents', () => {
    const document = makeDocument();
    document.tasks[0]!.personIds = ['20000000-0000-4000-8000-000000000001'];
    const result = safeParseSharedDocument(document);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.message.includes('persona inexistent'))).toBe(true);
  });

  it('rebutja tasques fora de la finestra', () => {
    const document = makeDocument();
    const interval = document.tasks.find((task) => task.id === ids.interval);
    if (interval?.kind === 'interval') interval.startsAt = '2026-06-01T07:59:00Z';
    expect(safeParseSharedDocument(document).success).toBe(false);
  });

  it('detecta cicles a les dependències En acabar', () => {
    const document = makeDocument();
    document.tasks = [
      {
        id: ids.after,
        kind: 'after',
        title: 'Primera',
        sortOrder: 2,
        afterTaskId: ids.point,
        personIds: [],
        teamIds: [],
        roles: [],
        common: false,
        checklist: [],
      },
      {
        id: ids.point,
        kind: 'after',
        title: 'Segona',
        sortOrder: 3,
        afterTaskId: ids.after,
        personIds: [],
        teamIds: [],
        roles: [],
        common: false,
        checklist: [],
      },
    ];
    const result = safeParseSharedDocument(document);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.message.includes('cicle'))).toBe(true);
  });
});
