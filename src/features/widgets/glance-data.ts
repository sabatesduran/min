import type { DocumentPreferences, SharedDocument } from '@/domain/models';
import {
  currentTasks,
  eventStatus,
  formatTaskTime,
  nextBoundaryMs,
  nextTaskGroup,
} from '@/domain/time';

export type GlanceProps = {
  documentId: string;
  eventTitle: string;
  state: 'empty' | 'upcoming' | 'active' | 'finished';
  eyebrow: string;
  title: string;
  timeLabel: string;
  secondary: string;
  url: string;
};

export const emptyGlanceProps: GlanceProps = {
  documentId: '',
  eventTitle: 'min',
  state: 'empty',
  eyebrow: 'TOT AL SEU MOMENT',
  title: 'Obre min per preparar el teu dia',
  timeLabel: '',
  secondary: 'Les dades es desen al dispositiu.',
  url: 'min://app',
};

export function preferencesForGlance(
  preferences: DocumentPreferences,
  mode: 'all' | 'mine',
  includeCommon: boolean,
): DocumentPreferences {
  return { ...preferences, filter: mode, includeCommon };
}

export function buildGlanceProps(
  document: SharedDocument,
  preferences: DocumentPreferences,
  nowMs: number,
): GlanceProps {
  const status = eventStatus(document.event, nowMs);
  const current = currentTasks(document, preferences, nowMs);
  const next = nextTaskGroup(document, preferences, nowMs);
  const currentTask = current[0];
  const nextTask = next[0];
  const url = `min://event/${document.documentId}`;

  if (status === 'finished') {
    return {
      documentId: document.documentId,
      eventTitle: document.event.title,
      state: 'finished',
      eyebrow: 'FINALITZAT',
      title: 'Tot fet per avui',
      timeLabel: '',
      secondary: `Revisió ${document.revision}`,
      url,
    };
  }

  if (currentTask) {
    return {
      documentId: document.documentId,
      eventTitle: document.event.title,
      state: 'active',
      eyebrow: 'ARA',
      title: currentTask.title,
      timeLabel: formatTaskTime(currentTask, document),
      secondary: nextTask ? `Després: ${nextTask.title}` : 'Després no hi ha cap tasca prevista.',
      url,
    };
  }

  if (nextTask) {
    return {
      documentId: document.documentId,
      eventTitle: document.event.title,
      state: 'upcoming',
      eyebrow: status === 'upcoming' ? 'PRÒXIM MIN' : 'DESPRÉS',
      title: nextTask.title,
      timeLabel: formatTaskTime(nextTask, document),
      secondary: next.length > 1 ? `${next.length - 1} tasques més al mateix moment` : document.event.title,
      url,
    };
  }

  return {
    documentId: document.documentId,
    eventTitle: document.event.title,
    state: status,
    eyebrow: status === 'active' ? 'ARA' : 'PRÒXIM MIN',
    title: status === 'active' ? 'Pausa entre tasques' : 'Encara no hi ha tasques',
    timeLabel: '',
    secondary: status === 'active' ? 'Consulta l’agenda completa a min.' : document.event.title,
    url,
  };
}

export function buildGlanceTimeline(
  document: SharedDocument,
  preferences: DocumentPreferences,
  nowMs: number,
): { date: Date; props: GlanceProps }[] {
  const entries = [{ date: new Date(nowMs), props: buildGlanceProps(document, preferences, nowMs) }];
  let cursor = nowMs;
  for (let index = 0; index < 48; index += 1) {
    const boundary = nextBoundaryMs(document, cursor);
    if (boundary === null) break;
    cursor = boundary;
    entries.push({ date: new Date(boundary + 1), props: buildGlanceProps(document, preferences, boundary + 1) });
  }
  return entries.filter((entry, index) => index === 0 || JSON.stringify(entry.props) !== JSON.stringify(entries[index - 1]?.props));
}
