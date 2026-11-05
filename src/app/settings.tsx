import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking, Platform, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import type { DocumentPreferences } from '@/domain/models';
import { useAppData } from '@/features/app-data/app-data-provider';
import {
  getNotificationPermissionState,
  getScheduledDocumentNotificationCount,
  type NotificationPermissionState,
  scheduleDocumentNotifications,
} from '@/features/notifications/scheduler';
import { nativeWidgetsAvailable } from '@/features/widgets/native-widgets';
import { Button } from '@/ui/components/button';
import { Card, PressableCard } from '@/ui/components/card';
import { MinIcon } from '@/ui/components/icon';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { SegmentedControl } from '@/ui/components/segmented-control';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

const permissionLabels: Record<NotificationPermissionState, string> = {
  granted: 'Permesos pel sistema',
  provisional: 'Permesos discretament per iOS',
  undetermined: 'Encara no s’ha demanat permís',
  denied: 'Bloquejats als ajustos del sistema',
  unavailable: 'No disponibles en aquest entorn',
};

export default function SettingsScreen() {
  const {
    selected, documentPreferences, appPreferences, updateAppPreferences, updateDocumentPreferences,
  } = useAppData();
  const db = useSQLiteContext();
  const { colors } = useMinTheme();
  const widgetsAvailable = nativeWidgetsAvailable();
  const document = selected?.document;
  const [permission, setPermission] = useState<NotificationPermissionState | null>(null);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [working, setWorking] = useState(false);

  const refreshNotificationState = useCallback(async () => {
    const [nextPermission, nextCount] = await Promise.all([
      getNotificationPermissionState(),
      document ? getScheduledDocumentNotificationCount(db, document.documentId) : Promise.resolve(0),
    ]);
    setPermission(nextPermission);
    setScheduledCount(nextCount);
  }, [db, document]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getNotificationPermissionState(),
      document ? getScheduledDocumentNotificationCount(db, document.documentId) : Promise.resolve(0),
    ]).then(([nextPermission, nextCount]) => {
      if (!active) return;
      setPermission(nextPermission);
      setScheduledCount(nextCount);
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshNotificationState();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [db, document, refreshNotificationState]);

  const showPreferenceError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Torna-ho a provar.';
    Alert.alert('No s’ha pogut desar', message, [
      { text: 'D’acord', style: 'cancel' },
      ...(message.includes('sistema') ? [{ text: 'Obre els ajustos', onPress: () => void Linking.openSettings() }] : []),
    ]);
  };

  const applyPreferences = async (patch: Partial<DocumentPreferences>) => {
    if (working) return;
    setWorking(true);
    try {
      await updateDocumentPreferences(patch);
      await refreshNotificationState();
    } catch (error) {
      showPreferenceError(error);
    } finally {
      setWorking(false);
    }
  };

  const changeReminderMode = (reminderMode: DocumentPreferences['reminderMode']) => {
    if (reminderMode === 'mine' && !documentPreferences?.mePersonId) {
      router.push({ pathname: '/active-selector', params: { mode: 'person', enable: 'reminders' } });
      return;
    }
    void applyPreferences({
      reminderMode,
      reminderMinutes: reminderMode === 'off' ? null : documentPreferences?.reminderMinutes ?? 10,
    });
  };

  const changeLiveMode = (liveMode: DocumentPreferences['liveMode']) => {
    if (liveMode === 'mine' && !documentPreferences?.mePersonId) {
      router.push({ pathname: '/active-selector', params: { mode: 'person', enable: 'live' } });
      return;
    }
    void applyPreferences({ liveMode });
  };

  const reschedule = async () => {
    if (!document || !documentPreferences || working) return;
    setWorking(true);
    try {
      const count = await scheduleDocumentNotifications(db, document, documentPreferences);
      setScheduledCount(count);
      setPermission(await getNotificationPermissionState());
      Alert.alert('Avisos actualitzats', count ? `Hi ha ${count} ${count === 1 ? 'avís programat' : 'avisos programats'}.` : 'No hi ha tasques futures que compleixin el filtre.');
    } catch (error) {
      showPreferenceError(error);
    } finally {
      setWorking(false);
    }
  };

  const permissionColor = permission === 'granted' || permission === 'provisional'
    ? colors.success
    : permission === 'denied'
      ? colors.error
      : colors.secondary;

  return (
    <Screen>
      <NavigationHeader title="Configuració" />
      <View style={styles.section}>
        <MinText variant="label">Aparença</MinText>
        <SegmentedControl
          label="Aparença"
          value={appPreferences.theme}
          options={[{ value: 'system', label: 'Sistema' }, { value: 'light', label: 'Clar' }, { value: 'dark', label: 'Fosc' }]}
          onChange={(theme) => void updateAppPreferences({ theme })}
        />
      </View>

      {document && documentPreferences ? (
        <>
          <View style={styles.section}>
            <MinText variant="label">Aquest esdeveniment</MinText>
            <Card style={styles.card}>
              <MinText style={styles.strong}>{document.event.title}</MinText>
              <MinText variant="metadata" style={{ color: colors.secondary }}>{document.event.organization} · revisió {document.revision}</MinText>
            </Card>
          </View>

          <View style={styles.section}>
            <MinText variant="label">Identitat</MinText>
            <MinText style={{ color: colors.secondary }}>
              {document.people.find((person) => person.id === documentPreferences.mePersonId)?.name ?? 'Encara no has indicat qui ets.'}
            </MinText>
            <Button label="Canvia qui soc" icon="person" variant="secondary" onPress={() => router.push('/active-selector?mode=person')} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionHeadingText}>
                <MinText variant="label">Avisos locals</MinText>
                <MinText variant="metadata" style={{ color: colors.secondary }}>Configuració pròpia de {document.event.title}</MinText>
              </View>
              {working ? <MinText variant="caption" style={{ color: colors.brand }}>Actualitzant…</MinText> : null}
            </View>
            <SegmentedControl
              label="Tasques amb avís"
              value={documentPreferences.reminderMode}
              options={[{ value: 'off', label: 'Cap' }, { value: 'all', label: 'Totes' }, { value: 'mine', label: 'Les meves' }]}
              onChange={changeReminderMode}
            />
            {documentPreferences.reminderMode !== 'off' ? (
              <>
                <SegmentedControl
                  label="Antelació"
                  value={`${documentPreferences.reminderMinutes ?? 10}`}
                  options={[{ value: '5', label: '5 min' }, { value: '10', label: '10 min' }, { value: '15', label: '15 min' }]}
                  onChange={(value) => void applyPreferences({ reminderMinutes: Number(value) as 5 | 10 | 15 })}
                />
                {documentPreferences.reminderMode === 'mine' ? (
                  <SettingsSwitch
                    label="Inclou tasques generals"
                    description="Avisa també de les tasques marcades per a tothom."
                    value={documentPreferences.reminderIncludeCommon}
                    disabled={working}
                    onValueChange={(reminderIncludeCommon) => void applyPreferences({ reminderIncludeCommon })}
                  />
                ) : null}
              </>
            ) : null}
            <Card style={styles.statusCard}>
              <View style={styles.statusRow}>
                <MinIcon name="notifications" size={22} color={permissionColor} />
                <View style={styles.statusText}>
                  <MinText style={styles.strong}>{permission ? permissionLabels[permission] : 'Comprovant els permisos…'}</MinText>
                  <MinText variant="metadata" style={{ color: colors.secondary }}>
                    {documentPreferences.reminderMode === 'off'
                      ? 'No hi ha avisos activats per a aquest esdeveniment.'
                      : `${scheduledCount} ${scheduledCount === 1 ? 'avís programat' : 'avisos programats'} ara mateix.`}
                  </MinText>
                </View>
              </View>
              {permission === 'denied' ? <Button label="Obre els ajustos del sistema" variant="quiet" onPress={() => void Linking.openSettings()} /> : null}
            </Card>
            {documentPreferences.reminderMode !== 'off' ? <Button label="Reprograma els avisos" icon="notifications" variant="secondary" loading={working} onPress={reschedule} /> : null}
            <MinText variant="caption" style={{ color: colors.secondary }}>Els canvis es programen al moment. Les tasques simultànies comparteixen un sol avís; les tasques «En acabar» no en generen perquè no tenen una hora exacta.</MinText>
          </View>

          {Platform.OS === 'ios' && widgetsAvailable ? (
            <View style={styles.section}>
              <MinText variant="label">Activitat en directe</MinText>
              <SegmentedControl
                label="Contingut de l’activitat en directe"
                value={documentPreferences.liveMode}
                options={[{ value: 'off', label: 'No' }, { value: 'all', label: 'Tot' }, { value: 'mine', label: 'Les meves' }]}
                onChange={changeLiveMode}
              />
              {documentPreferences.liveMode === 'mine' ? (
                <SettingsSwitch
                  label="Inclou tasques generals"
                  description="Mostra també les tasques marcades per a tothom."
                  value={documentPreferences.liveIncludeCommon}
                  disabled={working}
                  onValueChange={(liveIncludeCommon) => void applyPreferences({ liveIncludeCommon })}
                />
              ) : null}
              <MinText variant="caption" style={{ color: colors.secondary }}>Mostra la tasca actual i la següent a la pantalla bloquejada i a la Dynamic Island. S’actualitza quan obres min.</MinText>
            </View>
          ) : Platform.OS === 'ios' ? (
            <View style={styles.section}>
              <MinText variant="label">Activitat en directe</MinText>
              <Card><MinText style={{ color: colors.secondary }}>No està disponible a Expo Go. Funcionarà a la development build i a l’app publicada.</MinText></Card>
            </View>
          ) : null}

          {Platform.OS !== 'web' ? (
            <View style={styles.section}>
              <MinText variant="label">Widgets</MinText>
              <Card style={styles.card}>
                <MinText style={styles.strong}>{widgetsAvailable ? 'Disponibles al sistema' : 'Disponibles a la build nativa'}</MinText>
                <MinText variant="metadata" style={{ color: colors.secondary }}>Els widgets són independents de l’Activitat en directe i segueixen el filtre de l’agenda de l’esdeveniment obert.</MinText>
              </Card>
            </View>
          ) : null}
        </>
      ) : null}

      <View style={styles.section}>
        <MinText variant="label">Dades locals</MinText>
        <PressableCard accessibilityLabel="Gestiona les dades locals" onPress={() => router.push('/data-management')}>
          <View style={styles.aboutRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.peach }]}><MinIcon name="download" size={24} color={colors.text} /></View>
            <View style={styles.aboutText}>
              <MinText style={styles.strong}>Còpia de seguretat i restauració</MinText>
              <MinText variant="metadata" style={{ color: colors.secondary }}>Exporta documents, revisions, preferències i marques personals</MinText>
            </View>
            <MinIcon name="chevronRight" size={20} color={colors.secondary} />
          </View>
        </PressableCard>
      </View>

      <View style={styles.section}>
        <MinText variant="label">min</MinText>
        <PressableCard accessibilityLabel="Sobre min" onPress={() => router.push('/about')}>
          <View style={styles.aboutRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.lilac }]}><MinIcon name="info" size={24} color={colors.brand} /></View>
            <View style={styles.aboutText}>
              <MinText style={styles.strong}>Sobre min</MinText>
              <MinText variant="metadata" style={{ color: colors.secondary }}>Versió, desenvolupador i més projectes</MinText>
            </View>
            <MinIcon name="chevronRight" size={20} color={colors.secondary} />
          </View>
        </PressableCard>
      </View>
    </Screen>
  );
}

function SettingsSwitch({
  label,
  description,
  value,
  disabled,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  disabled: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { colors } = useMinTheme();
  return (
    <Card style={styles.switchCard}>
      <View style={styles.switchText}>
        <MinText style={styles.strong}>{label}</MinText>
        <MinText variant="metadata" style={{ color: colors.secondary }}>{description}</MinText>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: colors.line, true: colors.brand }}
        thumbColor={colors.raised}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.x3, marginBottom: spacing.x8 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.x3 },
  sectionHeadingText: { flex: 1, gap: spacing.x1 },
  card: { gap: spacing.x1 },
  strong: { fontWeight: '600' },
  statusCard: { gap: spacing.x3 },
  statusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x3 },
  statusText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  switchCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.x4 },
  switchText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
  aboutText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  iconBox: { width: 46, height: 46, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center' },
});
