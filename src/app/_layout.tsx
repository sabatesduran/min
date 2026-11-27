import '@/global.css';

import * as Notifications from 'expo-notifications';
import { router, Stack, useGlobalSearchParams, useSegments } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect } from 'react';
import { ActivityIndicator, Appearance, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { migrateDatabase } from '@/db/migrations';
import { AppDataProvider, useAppData } from '@/features/app-data/app-data-provider';
import { useMinTheme } from '@/ui/use-min-theme';

/** Opens the event a reminder belongs to when the user taps the notification. */
function NotificationLinks() {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const documentId = response.notification.request.content.data?.documentId;
    Notifications.clearLastNotificationResponse();
    if (typeof documentId === 'string') router.navigate({ pathname: '/', params: { documentId } });
  }, [response]);
  return null;
}

/**
 * With the app already open, `/?documentId=` resolves to the tabs instead of the entry screen,
 * so the requested event is selected here.
 */
function EventLinks() {
  const params = useGlobalSearchParams<{ documentId?: string | string[] }>();
  const requestedId = Array.isArray(params.documentId) ? params.documentId[0] : params.documentId;
  const inTabs = useSegments()[0] === '(tabs)';
  const { loading, documents, selectedDocumentId, selectDocument } = useAppData();
  useEffect(() => {
    if (!inTabs || !requestedId || loading) return;
    router.setParams({ documentId: undefined });
    if (requestedId !== selectedDocumentId && documents.some((item) => item.document.documentId === requestedId)) {
      void selectDocument(requestedId);
    }
  }, [documents, inTabs, loading, requestedId, selectDocument, selectedDocumentId]);
  return null;
}

function Navigator() {
  const { scheme, colors } = useMinTheme();
  const { appPreferences } = useAppData();
  useEffect(() => {
    // Keeps the status bar, alerts and pickers in step with the theme chosen in min.
    if (Platform.OS !== 'web') Appearance.setColorScheme(appPreferences.theme === 'system' ? 'unspecified' : appPreferences.theme);
  }, [appPreferences.theme]);
  return (
    <>
      {Platform.OS === 'web' ? null : <NotificationLinks />}
      <EventLinks />
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          statusBarStyle: scheme === 'dark' ? 'light' : 'dark',
          contentStyle: { backgroundColor: colors.canvas },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="events" />
        <Stack.Screen name="create-event" options={{ presentation: 'modal' }} />
        <Stack.Screen name="ai-assistant" options={{ presentation: 'modal' }} />
        <Stack.Screen name="active-selector" options={{ presentation: 'formSheet', sheetGrabberVisible: true }} />
        <Stack.Screen name="now-preferences" options={{ presentation: 'formSheet', sheetGrabberVisible: true }} />
        <Stack.Screen name="data-management" />
        <Stack.Screen name="revisions/index" />
        <Stack.Screen name="revisions/[hash]" />
        <Stack.Screen name="about" />
        <Stack.Screen name="editor" />
        <Stack.Screen name="document-actions" options={{ presentation: 'formSheet', sheetGrabberVisible: true }} />
        <Stack.Screen name="import-review" options={{ presentation: 'modal' }} />
        <Stack.Screen name="publish" options={{ presentation: 'formSheet', sheetGrabberVisible: true }} />
        <Stack.Screen name="tasks/[id]" options={{ presentation: 'formSheet', sheetGrabberVisible: true }} />
        <Stack.Screen name="tasks/edit/[id]" />
        <Stack.Screen name="people/[id]" options={{ presentation: 'formSheet', sheetGrabberVisible: true }} />
        <Stack.Screen name="people/edit/[id]" />
        <Stack.Screen name="people/remove/[id]" />
        <Stack.Screen name="teams/edit/[id]" />
        <Stack.Screen name="event/edit" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Suspense fallback={<View style={styles.loading}><ActivityIndicator size="large" color="#3947F5" /></View>}>
        <SQLiteProvider databaseName="min.db" onInit={migrateDatabase} useSuspense>
          <AppDataProvider>
            <Navigator />
          </AppDataProvider>
        </SQLiteProvider>
      </Suspense>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F4EC' },
});
