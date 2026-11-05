import { useEffect, useMemo, useRef, useState } from 'react';

import type { SharedDocument } from '@/domain/models';
import { safeParseSharedDocument } from '@/domain/schema';
import { buildAiImportPrompt } from '@/features/ai/build-ai-prompt';
import { MIN_DOCUMENT_MIME_TYPE } from '@/features/sharing/document-type';

import {
  addBuilderTask,
  createBuilderDraft,
  documentFileName,
  documentToDraft,
  draftToDocument,
  type BuilderDraft,
  type BuilderTask,
} from '../../lib/document-builder';

const STORAGE_KEY = 'min.web-builder.v1';
const steps = ['Dades', 'Persones', 'Tasques', 'Revisa'] as const;

function loadBuilderDraft(): BuilderDraft {
  if (typeof window === 'undefined') return createBuilderDraft();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return createBuilderDraft();
  try {
    return JSON.parse(stored) as BuilderDraft;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return createBuilderDraft();
  }
}

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'issues' in error && Array.isArray(error.issues)) {
    const first = error.issues[0];
    if (first && typeof first === 'object' && 'message' in first && typeof first.message === 'string') return first.message;
  }
  return error instanceof Error ? error.message : 'Revisa els camps abans de descarregar el fitxer.';
}

function updateItem<T extends { id: string }>(items: T[], itemId: string, update: Partial<T>): T[] {
  return items.map((item) => (item.id === itemId ? { ...item, ...update } : item));
}

function toggleId(ids: string[], value: string): string[] {
  return ids.includes(value) ? ids.filter((id) => id !== value) : [...ids, value];
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const textarea = window.document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    window.document.body.appendChild(textarea);
    textarea.select();
    const legacyDocument = window.document as unknown as { execCommand(commandId: string): boolean };
    const copied = legacyDocument.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('Clipboard unavailable');
  }
}

function formatPreviewTime(value: string): string {
  if (!value.includes('T')) return value;
  return value.split('T')[1]?.slice(0, 5) ?? value;
}

function TaskEditor({
  task,
  index,
  draft,
  onChange,
  onRemove,
}: {
  task: BuilderTask;
  index: number;
  draft: BuilderDraft;
  onChange: (update: Partial<BuilderTask>) => void;
  onRemove: () => void;
}) {
  const previousTasks = draft.tasks.filter((candidate) => candidate.id !== task.id);

  return (
    <fieldset className="task-editor">
      <legend>Tasca {index + 1}</legend>
      <div className="builder-fields builder-fields--two">
        <label>
          Tipus
          <select value={task.kind} onChange={(event) => onChange({ kind: event.target.value as BuilderTask['kind'] })}>
            <option value="interval">Interval</option>
            <option value="point">Hora puntual</option>
            <option value="after">En acabar</option>
          </select>
        </label>
        <label>
          Títol
          <input value={task.title} onChange={(event) => onChange({ title: event.target.value })} required maxLength={160} />
        </label>
      </div>

      {task.kind === 'after' ? (
        <label>
          Després de
          <select value={task.afterTaskId} onChange={(event) => onChange({ afterTaskId: event.target.value })} required>
            <option value="">Tria una tasca</option>
            {previousTasks.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title || 'Tasca sense títol'}</option>)}
          </select>
        </label>
      ) : (
        <div className="builder-fields builder-fields--two">
          <label>
            {task.kind === 'point' ? 'Hora' : 'Inici'}
            <input type="datetime-local" value={task.startsAt} onChange={(event) => onChange({ startsAt: event.target.value })} required />
          </label>
          {task.kind === 'interval' ? (
            <label>
              Final
              <input type="datetime-local" value={task.endsAt} onChange={(event) => onChange({ endsAt: event.target.value })} required />
            </label>
          ) : null}
        </div>
      )}

      <div className="builder-fields builder-fields--two">
        <label>
          Lloc, opcional
          <input value={task.place} onChange={(event) => onChange({ place: event.target.value })} maxLength={240} />
        </label>
        <label>
          Notes, opcional
          <input value={task.notes} onChange={(event) => onChange({ notes: event.target.value })} maxLength={20000} />
        </label>
      </div>

      {draft.people.length || draft.teams.length ? (
        <div className="assignees">
          <span>Responsables</span>
          <div className="assignee-options">
            {draft.people.map((person) => (
              <label key={person.id} className="check-row">
                <input type="checkbox" checked={task.personIds.includes(person.id)} onChange={() => onChange({ personIds: toggleId(task.personIds, person.id) })} />
                {person.name || 'Persona sense nom'}
              </label>
            ))}
            {draft.teams.map((team) => (
              <label key={team.id} className="check-row">
                <input type="checkbox" checked={task.teamIds.includes(team.id)} onChange={() => onChange({ teamIds: toggleId(task.teamIds, team.id) })} />
                {team.name || 'Equip sense nom'}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="task-editor__footer">
        <label className="check-row">
          <input type="checkbox" checked={task.common} onChange={(event) => onChange({ common: event.target.checked })} />
          És per a tota la colla
        </label>
        <button className="text-button text-button--danger" type="button" onClick={onRemove} disabled={draft.tasks.length === 1}>Elimina la tasca</button>
      </div>
    </fieldset>
  );
}

export default function MinBuilder() {
  const [draft, setDraft] = useState<BuilderDraft>(loadBuilderDraft);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const sortedTasks = useMemo(() => [...draft.tasks].sort((a, b) => {
    if (a.kind === 'after') return 1;
    if (b.kind === 'after') return -1;
    return a.startsAt.localeCompare(b.startsAt);
  }), [draft.tasks]);

  const updateDraft = <K extends keyof BuilderDraft>(key: K, value: BuilderDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError('');
    setStatus('');
  };

  const goNext = () => setStep((current) => Math.min(steps.length - 1, current + 1));
  const goBack = () => setStep((current) => Math.max(0, current - 1));

  const addPerson = () => updateDraft('people', [...draft.people, { id: crypto.randomUUID(), name: '' }]);
  const addTeam = () => updateDraft('teams', [...draft.teams, { id: crypto.randomUUID(), name: '', personIds: [] }]);
  const addTask = () => updateDraft('tasks', [...draft.tasks, addBuilderTask(draft)]);

  const validate = (): SharedDocument | null => {
    try {
      const document = draftToDocument(draft);
      setError('');
      return document;
    } catch (caught) {
      setError(errorMessage(caught));
      return null;
    }
  };

  const download = () => {
    const document = validate();
    if (!document) return;
    const blob = new Blob([`${JSON.stringify(document, null, 2)}\n`], { type: MIN_DOCUMENT_MIME_TYPE });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = documentFileName(document.event.title);
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('El fitxer s’ha descarregat al dispositiu.');
  };

  const importFile = async (file: File) => {
    setStatus('');
    setError('');
    try {
      const content = await file.text();
      const parsed = safeParseSharedDocument(JSON.parse(content));
      if (!parsed.success) throw parsed.error;
      setDraft(documentToDraft(parsed.data));
      setStep(3);
      setStatus('Fitxer validat. Revisa’l abans de tornar-lo a descarregar.');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const copyAiPrompt = async () => {
    try {
      await copyText(buildAiImportPrompt());
      setError('');
      setStatus('Instruccions copiades. Enganxa-les a la IA que triïs i adjunta-hi el document original.');
    } catch {
      setError('No s’han pogut copiar les instruccions. Revisa el permís del porta-retalls.');
    }
  };

  const reset = () => {
    if (!window.confirm('Vols esborrar l’esborrany d’aquest navegador?')) return;
    localStorage.removeItem(STORAGE_KEY);
    setDraft(createBuilderDraft());
    setStep(0);
    setStatus('');
    setError('');
  };

  return (
    <div className="builder">
      <div className="builder-toolbar">
        <ol className="builder-steps" aria-label="Passos del generador">
          {steps.map((label, index) => (
            <li key={label}>
              <button type="button" aria-current={step === index ? 'step' : undefined} onClick={() => setStep(index)}>
                <span>{index + 1}</span>{label}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <section className="builder-ai" id="amb-ia" aria-labelledby="builder-ai-title">
        <div>
          <h2 id="builder-ai-title">Porta-hi un horari. La IA el converteix.</h2>
          <p>Copia les instruccions, enganxa-les a la IA que triïs i adjunta-hi l’horari original. Després obre aquí el fitxer que et retorni.</p>
        </div>
        <div className="builder-ai__actions">
          <button className="button" type="button" onClick={() => void copyAiPrompt()}>
            {status.startsWith('Instruccions copiades') ? 'Instruccions copiades' : 'Copia les instruccions'}
          </button>
          <input
            ref={fileInput}
            className="visually-hidden"
            id="import-min"
            tabIndex={-1}
            type="file"
            accept={`.json,.minut.json,application/json,${MIN_DOCUMENT_MIME_TYPE}`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importFile(file);
            }}
          />
          <button className="button button--quiet" type="button" onClick={() => fileInput.current?.click()}>Obre el resultat</button>
        </div>
      </section>

      <div className="builder-grid">
        <section className="builder-panel" aria-labelledby={`builder-step-${step}`}>
          {step === 0 ? (
            <div className="builder-step">
              <div className="builder-step__heading">
                <h2 id="builder-step-0">Dades del dia.</h2>
                <p>Defineix la finestra completa de l’esdeveniment.</p>
              </div>
              <div className="builder-fields">
                <label>
                  Nom de l’esdeveniment
                  <input value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} required maxLength={160} autoComplete="off" />
                </label>
                <label>
                  Entitat o colla
                  <input value={draft.organization} onChange={(event) => updateDraft('organization', event.target.value)} required maxLength={160} autoComplete="organization" />
                </label>
                <div className="builder-fields builder-fields--two">
                  <label>
                    Inici
                    <input type="datetime-local" value={draft.startsAt} onChange={(event) => updateDraft('startsAt', event.target.value)} required />
                  </label>
                  <label>
                    Final
                    <input type="datetime-local" value={draft.endsAt} onChange={(event) => updateDraft('endsAt', event.target.value)} required />
                  </label>
                </div>
                <label>
                  Zona horària
                  <input value={draft.timeZone} onChange={(event) => updateDraft('timeZone', event.target.value)} required autoComplete="off" />
                  <small>Exemple: Europe/Madrid</small>
                </label>
                <label>
                  Notes generals, opcionals
                  <textarea value={draft.notes} onChange={(event) => updateDraft('notes', event.target.value)} rows={4} maxLength={20000} />
                </label>
                <fieldset className="accent-picker">
                  <legend>Color del document</legend>
                  {(['blue', 'lime', 'lilac', 'peach', 'red'] as const).map((accent) => (
                    <label key={accent} data-accent={accent}>
                      <input type="radio" name="accent" value={accent} checked={draft.accent === accent} onChange={() => updateDraft('accent', accent)} />
                      {accent === 'blue' ? 'Blau' : accent === 'lime' ? 'Llima' : accent === 'lilac' ? 'Lila' : accent === 'peach' ? 'Préssec' : 'Vermell'}
                    </label>
                  ))}
                </fieldset>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="builder-step">
              <div className="builder-step__heading">
                <h2 id="builder-step-1">La gent que ho fa.</h2>
                <p>Afegeix només les persones i equips que cal assignar.</p>
              </div>
              <div className="entity-section">
                <div className="entity-section__header">
                  <h3>Persones</h3>
                  <button className="text-button" type="button" onClick={addPerson}>Afegeix una persona</button>
                </div>
                {draft.people.length ? draft.people.map((person) => (
                  <div className="entity-row" key={person.id}>
                    <label>
                      Nom
                      <input value={person.name} onChange={(event) => updateDraft('people', updateItem(draft.people, person.id, { name: event.target.value }))} maxLength={120} />
                    </label>
                    <button className="text-button text-button--danger" type="button" onClick={() => updateDraft('people', draft.people.filter((candidate) => candidate.id !== person.id))}>Elimina</button>
                  </div>
                )) : <p className="empty-copy">Encara no hi ha persones. Pots continuar si l’horari és per a tothom.</p>}
              </div>
              <div className="entity-section">
                <div className="entity-section__header">
                  <h3>Equips</h3>
                  <button className="text-button" type="button" onClick={addTeam}>Afegeix un equip</button>
                </div>
                {draft.teams.map((team) => (
                  <fieldset className="team-row" key={team.id}>
                    <legend>Equip</legend>
                    <label>
                      Nom
                      <input value={team.name} onChange={(event) => updateDraft('teams', updateItem(draft.teams, team.id, { name: event.target.value }))} maxLength={120} />
                    </label>
                    {draft.people.length ? (
                      <div className="assignee-options">
                        {draft.people.map((person) => (
                          <label className="check-row" key={person.id}>
                            <input type="checkbox" checked={team.personIds.includes(person.id)} onChange={() => updateDraft('teams', updateItem(draft.teams, team.id, { personIds: toggleId(team.personIds, person.id) }))} />
                            {person.name || 'Persona sense nom'}
                          </label>
                        ))}
                      </div>
                    ) : null}
                    <button className="text-button text-button--danger" type="button" onClick={() => updateDraft('teams', draft.teams.filter((candidate) => candidate.id !== team.id))}>Elimina l’equip</button>
                  </fieldset>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="builder-step">
              <div className="builder-step__heading builder-step__heading--action">
                <div>
                  <h2 id="builder-step-2">El fil del dia.</h2>
                  <p>Les tasques es desaran en l’ordre que apareixen aquí.</p>
                </div>
                <button className="button button--quiet" type="button" onClick={addTask}>Afegeix una tasca</button>
              </div>
              <div className="task-list">
                {draft.tasks.map((task, index) => (
                  <TaskEditor
                    key={task.id}
                    task={task}
                    index={index}
                    draft={draft}
                    onChange={(update) => updateDraft('tasks', updateItem(draft.tasks, task.id, update))}
                    onRemove={() => updateDraft('tasks', draft.tasks.filter((candidate) => candidate.id !== task.id))}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="builder-step">
              <div className="builder-step__heading">
                <h2 id="builder-step-3">Revisa i descarrega.</h2>
                <p>min validarà una altra vegada el fitxer quan l’obris a l’app.</p>
              </div>
              <dl className="review-list">
                <div><dt>Esdeveniment</dt><dd>{draft.title || 'Falta el nom'}</dd></div>
                <div><dt>Entitat</dt><dd>{draft.organization || 'Falta l’entitat'}</dd></div>
                <div><dt>Persones</dt><dd>{draft.people.length}</dd></div>
                <div><dt>Equips</dt><dd>{draft.teams.length}</dd></div>
                <div><dt>Tasques</dt><dd>{draft.tasks.length}</dd></div>
              </dl>
              <div className="download-panel">
                <p>El fitxer inclou només les dades que has escrit aquí. No incorpora preferències personals del navegador.</p>
                <button className="button" type="button" onClick={download}>Descarrega el fitxer</button>
              </div>
              <button className="text-button text-button--danger" type="button" onClick={reset}>Esborra l’esborrany</button>
            </div>
          ) : null}

          <div className="builder-status" aria-live="polite">
            {error ? <p className="builder-error">{error}</p> : status ? <p>{status}</p> : null}
          </div>

          <div className="builder-nav">
            <button className="button button--quiet" type="button" onClick={goBack} disabled={step === 0}>Enrere</button>
            {step < steps.length - 1 ? <button className="button" type="button" onClick={goNext}>Continua</button> : null}
          </div>
        </section>

        <aside className="schedule-preview" aria-label="Previsualització del minut a minut">
          <div className="schedule-preview__head">
            <img src="/images/brand/min-logo.png" width="952" height="464" alt="min" />
            <span>Esborrany local</span>
          </div>
          <h2>{draft.title || 'El teu esdeveniment'}</h2>
          <p>{draft.organization || 'La teva colla'}</p>
          <div className="schedule-preview__date">
            <time>{draft.startsAt ? draft.startsAt.replace('T', ' ') : 'Inici pendent'}</time>
            <span>fins a</span>
            <time>{draft.endsAt ? draft.endsAt.replace('T', ' ') : 'Final pendent'}</time>
          </div>
          <ol className="schedule-preview__tasks">
            {sortedTasks.slice(0, 7).map((task) => (
              <li key={task.id}>
                <time>{task.kind === 'after' ? 'En acabar' : formatPreviewTime(task.startsAt)}</time>
                <div>
                  <strong>{task.title || 'Tasca sense títol'}</strong>
                  {task.place ? <span>{task.place}</span> : null}
                </div>
              </li>
            ))}
          </ol>
          {sortedTasks.length > 7 ? <p className="schedule-preview__more">I {sortedTasks.length - 7} tasques més.</p> : null}
        </aside>
      </div>
    </div>
  );
}
