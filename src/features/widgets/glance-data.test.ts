import { describe, expect, it } from 'vitest';

import { buildGlanceProps, buildGlanceTimeline, buildLiveGlanceProps } from './glance-data';
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

  it('inclou els passos següents a l’activitat en directe', () => {
    const now = Date.parse('2026-06-01T07:30:00Z');
    const live = buildLiveGlanceProps(makeDocument(), makePreferences(), now);
    const timeline = buildGlanceTimeline(makeDocument(), makePreferences(), now);
    expect(live.title).toBe(timeline[0]?.props.title);
    expect(live.steps.length).toBeGreaterThan(0);
    expect(live.steps.length).toBeLessThanOrEqual(6);
    expect(live.steps[0]?.at).toBe(timeline[1]?.date.getTime());
    expect(live.steps.every((step, index) => index === 0 || step.at > (live.steps[index - 1]?.at ?? 0))).toBe(true);
    expect(JSON.stringify(live).length).toBeLessThan(4000);
  });

  it('retalla els passos perquè l’activitat no superi el límit d’iOS', () => {
    const document = makeDocument();
    document.tasks.forEach((task) => { task.title = '字'.repeat(180); });
    const live = buildLiveGlanceProps(document, makePreferences(), Date.parse('2026-06-01T07:30:00Z'));
    expect(new TextEncoder().encode(JSON.stringify(live)).length).toBeLessThan(4000);
  });
});
