import { describe, expect, it } from 'vitest';

import { AI_PROMPT_VERSION, buildAiImportPrompt } from './build-ai-prompt';

describe('prompt d’importació amb IA', () => {
  it('inclou el contracte i les regles que eviten inventar dades', () => {
    const prompt = buildAiImportPrompt();
    expect(AI_PROMPT_VERSION).toBe(1);
    expect(prompt).toContain('No inventis cap persona');
    expect(prompt).toContain('fitxer descarregable');
    expect(prompt).toContain('"schemaVersion": 1');
    expect(prompt).toContain('"kind": "after"');
    expect(prompt).toContain('correfoc-2026.minut.json');
    expect(prompt).toContain('No l’anomenis simplement .minut.json');
  });
});
