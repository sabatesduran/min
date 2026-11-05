import { describe, expect, it } from 'vitest';

import { buildGlanceProps, buildGlanceTimeline } from './glance-data';
import { ids, makeDocument, makePreferences } from '@/test/fixtures';

describe('dades de widget', () => {
  it('mostra la tasca vigent i la següent', () => {
    const props = buildGlanceProps(makeDocument(), makePreferences(), Date.parse('2026-06-01T08:30:00Z'));
    expect(props.state).toBe('active');
    expect(props.title).toBe('Munta la plaça');
    expect(props.secondary).toContain('Engega el cercavila');
  });

  it('genera entrades als canvis temporals sense duplicats consecutius', () => {
    const entries = buildGlanceTimeline(makeDocument(), makePreferences(), Date.parse('2026-06-01T07:30:00Z'));
    expect(entries.some((entry) => entry.props.title === 'Munta la plaça')).toBe(true);
    expect(entries.some((entry) => entry.props.title === 'Engega el cercavila')).toBe(true);
    expect(entries.every((entry, index) => index === 0 || JSON.stringify(entry.props) !== JSON.stringify(entries[index - 1]?.props))).toBe(true);
    expect(entries[0]?.props.documentId).toBe(ids.document);
  });
});
