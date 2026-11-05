import { describe, expect, it } from 'vitest';

import type { StoredDocument } from './models';
import { selectForLaunch } from './selection';
import { makeDocument } from '@/test/fixtures';

function stored(documentId: string, startsAt: string, favorite = false): StoredDocument {
  return {
    document: makeDocument({ documentId, event: { ...makeDocument().event, startsAt } }),
    draft: null,
    origin: 'received',
    favorite,
    importedAt: '2026-06-01T07:00:00Z',
    updatedAt: '2026-06-01T07:00:00Z',
  };
}

describe('selecció inicial', () => {
  it('obre directament l’únic min actiu', () => {
    const item = stored('10000000-0000-4000-8000-000000000021', '2026-06-01T08:00:00Z');
    expect(selectForLaunch([item], null, Date.parse('2026-06-01T09:00:00Z'))).toEqual({ kind: 'open', documentId: item.document.documentId });
  });

  it('respecta la selecció prèvia quan hi ha més d’un min actiu', () => {
    const first = stored('10000000-0000-4000-8000-000000000021', '2026-06-01T08:00:00Z');
    const second = stored('10000000-0000-4000-8000-000000000022', '2026-06-01T08:30:00Z', true);
    expect(selectForLaunch([first, second], first.document.documentId, Date.parse('2026-06-01T09:00:00Z'))).toEqual({ kind: 'open', documentId: first.document.documentId });
  });

  it('proposa el favorit de manera determinista', () => {
    const first = stored('10000000-0000-4000-8000-000000000021', '2026-06-01T08:00:00Z');
    const second = stored('10000000-0000-4000-8000-000000000022', '2026-06-01T08:30:00Z', true);
    const result = selectForLaunch([first, second], null, Date.parse('2026-06-01T09:00:00Z'));
    expect(result.kind).toBe('choose');
    if (result.kind === 'choose') expect(result.suggestedDocumentId).toBe(second.document.documentId);
  });

  it('no proposa cap min quan només en queden de finalitzats', () => {
    const finished = stored('10000000-0000-4000-8000-000000000021', '2026-06-01T08:00:00Z');
    expect(selectForLaunch([finished], finished.document.documentId, Date.parse('2026-06-02T09:00:00Z')))
      .toEqual({ kind: 'library', suggestedDocumentId: null });
  });

  it('proposa el pròxim min, però no un de finalitzat', () => {
    const finished = stored('10000000-0000-4000-8000-000000000021', '2026-06-01T08:00:00Z');
    const upcoming = stored('10000000-0000-4000-8000-000000000022', '2026-06-03T08:00:00Z');
    expect(selectForLaunch([finished, upcoming], finished.document.documentId, Date.parse('2026-06-02T09:00:00Z')))
      .toEqual({ kind: 'library', suggestedDocumentId: upcoming.document.documentId });
  });
});
