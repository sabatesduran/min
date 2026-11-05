import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { AppPreferences, DocumentPreferences, SharedDocument, StoredDocument } from '@/domain/models';
import { createDemoDocument } from '@/domain/factory';
import { selectForLaunch, type LaunchSelection } from '@/domain/selection';
import {
  clearDemoDocuments,
  deleteDocument as deleteDocumentRecord,
  duplicateDocument as duplicateDocumentRecord,
  getAppPreferences,
  getDocumentPreferences,
  listDocuments,
  publishDraft as publishDraftRecord,
  saveAppPreferences,
  saveDocumentPreferences,
  saveDraft as saveDraftRecord,
  saveNewDocument,
  setFavorite as setFavoriteRecord,
} from '@/db/repository';
import {
  applyDocumentNotificationPreferences,
  cancelDocumentNotifications,
  preferencesValidForDocument,
} from '@/features/notifications/scheduler';
import { useNow } from '@/features/time/use-now';
import { syncNativeGlance } from '@/features/widgets/sync-native-glance';

type AppDataContextValue = {
  loading: boolean;
  documents: StoredDocument[];
  selectedDocumentId: string | null;
  selected: StoredDocument | null;
  documentPreferences: DocumentPreferences | null;
  appPreferences: AppPreferences;
  launchSelection: LaunchSelection;
  refresh: () => Promise<void>;
  selectDocument: (documentId: string) => Promise<void>;
  addDocument: (document: SharedDocument) => Promise<void>;
  openDemo: () => Promise<void>;
  saveDraft: (draft: SharedDocument) => Promise<void>;
  publishDraft: () => Promise<SharedDocument>;
  duplicateDocument: (documentId: string) => Promise<string>;
  deleteDocument: (documentId: string) => Promise<void>;
  setFavorite: (documentId: string, favorite: boolean) => Promise<void>;
  updateDocumentPreferences: (patch: Partial<DocumentPreferences>) => Promise<void>;
  updateAppPreferences: (patch: Partial<AppPreferences>) => Promise<void>;
};

const defaultAppPreferences: AppPreferences = { theme: 'system', selectedDocumentId: null };
const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [appPreferences, setAppPreferencesState] = useState<AppPreferences>(defaultAppPreferences);
  const [documentPreferences, setDocumentPreferencesState] = useState<DocumentPreferences | null>(null);
  const now = useNow();

  const selectedDocumentId = appPreferences.selectedDocumentId;
  const selected = useMemo(
    () => documents.find((item) => item.document.documentId === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  );

  const refresh = useCallback(async () => {
    const [nextDocuments, nextAppPreferences] = await Promise.all([listDocuments(db), getAppPreferences(db)]);
    let selectedId = nextAppPreferences.selectedDocumentId;
    if (selectedId && !nextDocuments.some((item) => item.document.documentId === selectedId)) selectedId = null;
    const resolvedAppPreferences = { ...nextAppPreferences, selectedDocumentId: selectedId };
    setDocuments(nextDocuments);
    setAppPreferencesState(resolvedAppPreferences);
    if (selectedId) setDocumentPreferencesState(await getDocumentPreferences(db, selectedId));
    else setDocumentPreferencesState(null);
    setLoading(false);
  }, [db]);

  const removeDemoDocuments = useCallback(async () => {
    const stored = await listDocuments(db);
    const demoIds = stored.filter((item) => item.origin === 'demo').map((item) => item.document.documentId);
    await Promise.allSettled(demoIds.map((documentId) => cancelDocumentNotifications(db, documentId)));
    await clearDemoDocuments(db);
  }, [db]);

  useEffect(() => {
    // SQLite hydration is asynchronous; this effect only starts the initial read.
    void removeDemoDocuments()
      .then(refresh)
      .catch(() => setLoading(false));
  }, [refresh, removeDemoDocuments]);

  useEffect(() => {
    void syncNativeGlance(db, selected?.document ?? null, documentPreferences, now).catch(() => {
      // Widgets and Live Activities are best-effort system surfaces.
    });
  }, [db, documentPreferences, now, selected?.document]);

  const selectDocument = useCallback(
    async (documentId: string) => {
      const next = { ...appPreferences, selectedDocumentId: documentId };
      await saveAppPreferences(db, next);
      setAppPreferencesState(next);
      setDocumentPreferencesState(await getDocumentPreferences(db, documentId));
    },
    [appPreferences, db],
  );

  const addDocument = useCallback(
    async (document: SharedDocument) => {
      await saveNewDocument(db, document, 'author');
      await selectDocument(document.documentId);
      await refresh();
    },
    [db, refresh, selectDocument],
  );

  const openDemo = useCallback(async () => {
    await removeDemoDocuments();
    const demo = createDemoDocument();
    await saveNewDocument(db, demo, 'demo');
    await selectDocument(demo.documentId);
    await refresh();
  }, [db, refresh, removeDemoDocuments, selectDocument]);

  const saveDraft = useCallback(
    async (draft: SharedDocument) => {
      const stored = documents.find((item) => item.document.documentId === draft.documentId);
      if (!stored) throw new Error('No s’ha trobat el min que vols editar.');
      await saveDraftRecord(db, draft.documentId, draft);
      await refresh();
    },
    [db, documents, refresh],
  );

  const publishDraft = useCallback(async () => {
    if (!selectedDocumentId) throw new Error('No hi ha cap min seleccionat.');
    const published = await publishDraftRecord(db, selectedDocumentId);
    await refresh();
    return published;
  }, [db, refresh, selectedDocumentId]);

  const duplicateDocument = useCallback(
    async (documentId: string) => {
      const duplicateId = await duplicateDocumentRecord(db, documentId);
      await selectDocument(duplicateId);
      await refresh();
      return duplicateId;
    },
    [db, refresh, selectDocument],
  );

  const deleteDocument = useCallback(
    async (documentId: string) => {
      await cancelDocumentNotifications(db, documentId);
      await deleteDocumentRecord(db, documentId);
      if (selectedDocumentId === documentId) {
        const next = { ...appPreferences, selectedDocumentId: null };
        await saveAppPreferences(db, next);
        setAppPreferencesState(next);
      }
      await refresh();
    },
    [appPreferences, db, refresh, selectedDocumentId],
  );

  const setFavorite = useCallback(
    async (documentId: string, favorite: boolean) => {
      await setFavoriteRecord(db, documentId, favorite);
      await refresh();
    },
    [db, refresh],
  );

  const updateDocumentPreferences = useCallback(
    async (patch: Partial<DocumentPreferences>) => {
      if (!documentPreferences || !selected) return;
      const next = preferencesValidForDocument(selected.document, { ...documentPreferences, ...patch });
      const changesReminders = ['mePersonId', 'reminderMode', 'reminderIncludeCommon', 'reminderMinutes']
        .some((key) => Object.prototype.hasOwnProperty.call(patch, key));
      if (changesReminders) await applyDocumentNotificationPreferences(db, selected.document, next);
      else await saveDocumentPreferences(db, next);
      setDocumentPreferencesState(next);
    },
    [db, documentPreferences, selected],
  );

  const updateAppPreferences = useCallback(
    async (patch: Partial<AppPreferences>) => {
      const next = { ...appPreferences, ...patch };
      await saveAppPreferences(db, next);
      setAppPreferencesState(next);
    },
    [appPreferences, db],
  );

  const launchSelection = useMemo(
    () => selectForLaunch(documents, selectedDocumentId, now),
    [documents, now, selectedDocumentId],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      loading,
      documents,
      selectedDocumentId,
      selected,
      documentPreferences,
      appPreferences,
      launchSelection,
      refresh,
      selectDocument,
      addDocument,
      openDemo,
      saveDraft,
      publishDraft,
      duplicateDocument,
      deleteDocument,
      setFavorite,
      updateDocumentPreferences,
      updateAppPreferences,
    }),
    [
      addDocument,
      appPreferences,
      deleteDocument,
      documentPreferences,
      documents,
      duplicateDocument,
      launchSelection,
      loading,
      openDemo,
      publishDraft,
      refresh,
      saveDraft,
      selectDocument,
      selected,
      selectedDocumentId,
      setFavorite,
      updateAppPreferences,
      updateDocumentPreferences,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const value = useContext(AppDataContext);
  if (!value) throw new Error('useAppData s’ha d’utilitzar dins d’AppDataProvider.');
  return value;
}
