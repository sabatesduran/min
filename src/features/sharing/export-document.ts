import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { SharedDocument, Task } from '@/domain/models';
import { formatDateTime, formatTaskTime, personIdsForTask } from '@/domain/time';

function safeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ca')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'document';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}

export async function shareDocumentFile(document: SharedDocument): Promise<string> {
  const file = new File(Paths.cache, `${safeName(document.event.title)}-v${document.revision}.minut.json`);
  if (file.exists) file.delete();
  file.create({ intermediates: true });
  await file.write(`${JSON.stringify(document, null, 2)}\n`);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/vnd.min.document+json',
      UTI: 'dev.min.document',
      dialogTitle: 'Comparteix aquest min',
    });
  }
  return file.uri;
}

function taskPeople(document: SharedDocument, task: Task): string {
  return [...personIdsForTask(document, task)]
    .map((id) => document.people.find((person) => person.id === id)?.name)
    .filter(Boolean)
    .join(', ') || 'Per assignar';
}

export async function shareDocumentPdf(document: SharedDocument, personId?: string): Promise<string> {
  const tasks = personId
    ? document.tasks.filter((task) => personIdsForTask(document, task).has(personId) || task.common)
    : document.tasks;
  const person = personId ? document.people.find((candidate) => candidate.id === personId) : null;
  const rows = tasks.map((task) => `
    <article class="task">
      <div class="time">${escapeHtml(formatTaskTime(task, document))}</div>
      <div><h2>${escapeHtml(task.title)}</h2>
      ${task.place ? `<p>${escapeHtml(task.place)}</p>` : ''}
      <p>${escapeHtml(taskPeople(document, task))}</p>
      ${task.notes ? `<p>${escapeHtml(task.notes).replace(/\n/g, '<br>')}</p>` : ''}</div>
    </article>`).join('');
  const html = `<!doctype html><html lang="ca"><head><meta charset="utf-8"><style>
    @page { margin: 32px; } body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #20221F; font-size: 12px; }
    header { border-bottom: 3px solid #3947F5; padding-bottom: 18px; margin-bottom: 24px; }
    h1 { font-size: 28px; margin: 0 0 8px; } h2 { font-size: 16px; margin: 0 0 5px; } p { margin: 3px 0; line-height: 1.45; }
    .meta { color: #646862; } .task { display: grid; grid-template-columns: 90px 1fr; gap: 16px; padding: 14px 0; border-bottom: 1px solid #D6D9CF; break-inside: avoid; }
    .time { font-variant-numeric: tabular-nums; font-weight: 700; color: #3947F5; }
  </style></head><body><header><h1>${escapeHtml(document.event.title)}</h1><p>${escapeHtml(document.event.organization)}</p>
  <p class="meta">${escapeHtml(formatDateTime(document.event.startsAt, document.event.timeZone))} — ${escapeHtml(formatDateTime(document.event.endsAt, document.event.timeZone))}</p>
  <p class="meta">Revisió ${document.revision}${person ? ` · Full de ${escapeHtml(person.name)}` : ' · Full general'} · Aquesta és una còpia</p></header>${rows}</body></html>`;
  const result = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Comparteix el PDF' });
  return result.uri;
}
