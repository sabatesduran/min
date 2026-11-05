import { describe, expect, it } from 'vitest';

import { redirectSystemPath } from '@/app/+native-intent';

describe('enllaços interns', () => {
  it('conserva el document dels widgets i avisos', () => {
    expect(redirectSystemPath({ path: 'min://event/10000000-0000-4000-8000-000000000001', initial: true }))
      .toBe('/?documentId=10000000-0000-4000-8000-000000000001');
  });

  it('envia els fitxers rebuts a la revisió d’importació', () => {
    expect(redirectSystemPath({ path: 'file:///Documents/prova.minut.json', initial: true }))
      .toBe('/import-review?uri=file%3A%2F%2F%2FDocuments%2Fprova.minut.json');
  });
});
