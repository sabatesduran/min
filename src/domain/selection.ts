import type { StoredDocument } from './models';
import { eventStatus } from './time';

export type LaunchSelection =
  | { kind: 'empty' }
  | { kind: 'open'; documentId: string }
  | { kind: 'choose'; suggestedDocumentId: string; activeDocumentIds: string[] }
  | { kind: 'library'; suggestedDocumentId: string | null };

export function selectForLaunch(
  documents: StoredDocument[],
  selectedDocumentId: string | null,
  nowMs: number,
): LaunchSelection {
  if (!documents.length) return { kind: 'empty' };
  const active = documents.filter((item) => eventStatus(item.document.event, nowMs) === 'active');
  if (active.length === 1) return { kind: 'open', documentId: active[0]!.document.documentId };
  if (active.length > 1) {
    const selected = active.find((item) => item.document.documentId === selectedDocumentId);
    if (selected) return { kind: 'open', documentId: selected.document.documentId };
    const sorted = [...active].sort((left, right) => {
      if (left.favorite !== right.favorite) return Number(right.favorite) - Number(left.favorite);
      const startDifference = Date.parse(right.document.event.startsAt) - Date.parse(left.document.event.startsAt);
      return startDifference || left.document.event.title.localeCompare(right.document.event.title, 'ca') || left.document.documentId.localeCompare(right.document.documentId);
    });
    return {
      kind: 'choose',
      suggestedDocumentId: sorted[0]!.document.documentId,
      activeDocumentIds: sorted.map((item) => item.document.documentId),
    };
  }
  const upcoming = documents
    .filter((item) => eventStatus(item.document.event, nowMs) === 'upcoming')
    .sort((left, right) => Date.parse(left.document.event.startsAt) - Date.parse(right.document.event.startsAt));
  return { kind: 'library', suggestedDocumentId: upcoming[0]?.document.documentId ?? null };
}
