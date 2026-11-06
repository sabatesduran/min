import '@/global.css';

import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { migrateDatabase } from '@/db/migrations';
import { AppDataProvider } from '@/features/app-data/app-data-provider';
import { useMinTheme } from '@/ui/use-min-theme';

function Navigator() {
  const { scheme, colors } = useMinTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
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
