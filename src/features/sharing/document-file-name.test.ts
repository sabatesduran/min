import { describe, expect, it } from 'vitest';

import { buildDocumentFileName } from './document-file-name';

describe('nom dels documents compartits', () => {
  it('posa sempre un nom visible abans del sufix', () => {
    expect(buildDocumentFileName('Correfoc 2026')).toBe('correfoc-2026.minut.json');
    expect(buildDocumentFileName('Correfoc 2026', 3)).toBe('correfoc-2026-v3.minut.json');
  });

  it('no genera un dotfile encara que el títol sigui buit', () => {
    expect(buildDocumentFileName('')).toBe('document.minut.json');
    expect(buildDocumentFileName('···', 1)).toBe('document-v1.minut.json');
    expect(buildDocumentFileName('')).not.toMatch(/^\./);
  });
});
