import { useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { useAppData } from '@/features/app-data/app-data-provider';
import { LoadingView } from '@/ui/components/loading-view';

export default function EntryScreen() {
  const params = useLocalSearchParams<{ documentId?: string | string[] }>();
  const requestedId = Array.isArray(params.documentId) ? params.documentId[0] : params.documentId;
  const { loading, documents, selectedDocumentId, launchSelection, selectDocument, updateAppPreferences } = useAppData();
  const routing = useRef(false);

  useEffect(() => {
    if (loading || routing.current) return;
    routing.current = true;
    void (async () => {
      try {
        if (requestedId && documents.some((item) => item.document.documentId === requestedId)) {
          if (requestedId !== selectedDocumentId) await selectDocument(requestedId);
          router.replace('/(tabs)');
          return;
        }
        if (launchSelection.kind === 'empty') {
          router.replace('/welcome');
          return;
        }
        if (launchSelection.kind === 'choose') {
          router.replace({ pathname: '/active-selector', params: { required: '1', suggested: launchSelection.suggestedDocumentId } });
          return;
        }
        if (launchSelection.kind === 'open') {
          if (launchSelection.documentId !== selectedDocumentId) await selectDocument(launchSelection.documentId);
          router.replace('/(tabs)');
          return;
        }
        if (launchSelection.kind === 'library') {
          if (launchSelection.suggestedDocumentId && launchSelection.suggestedDocumentId !== selectedDocumentId) {
            await selectDocument(launchSelection.suggestedDocumentId);
          } else if (!launchSelection.suggestedDocumentId && selectedDocumentId) {
            await updateAppPreferences({ selectedDocumentId: null });
          }
        }
        router.replace('/events');
      } catch {
        router.replace('/events');
      }
    })();
  }, [documents, launchSelection, loading, requestedId, selectDocument, selectedDocumentId, updateAppPreferences]);

  return <LoadingView />;
}
