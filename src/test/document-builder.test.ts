import { describe, expect, it } from 'vitest';

import { ids, makeDocument } from '@/test/fixtures';

import { documentToDraft, draftToDocument } from '../../web/src/lib/document-builder';

describe('generador web', () => {
  it('conserva funcions i checklists i publica la revisió següent d’un fitxer importat', () => {
    const base = makeDocument();
    const [first, ...rest] = base.tasks;
    if (!first) throw new Error('fixture sense tasques');
    const document = {
      ...base,
      revision: 4,
      tasks: [
        {
          ...first,
          category: 'Muntatge',
          roles: [{ id: '90000000-0000-4000-8000-000000000001', name: 'Carro', personIds: base.people.slice(0, 1).map((person) => person.id), teamIds: [] }],
          checklist: [{ id: '90000000-0000-4000-8000-000000000002', text: 'Extintor' }],
        },
        ...rest,
      ],
    };
    const result = draftToDocument(documentToDraft(document));
    expect(result.documentId).toBe(ids.document);
    expect(result.revision).toBe(5);
    expect(result.tasks[0]?.category).toBe('Muntatge');
    expect(result.tasks[0]?.roles).toEqual(document.tasks[0]?.roles);
    expect(result.tasks[0]?.checklist).toEqual(document.tasks[0]?.checklist);
  });
});
