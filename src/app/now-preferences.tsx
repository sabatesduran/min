import { useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';

import type { DocumentPreferences } from '@/domain/models';
import { useAppData } from '@/features/app-data/app-data-provider';
import { nativeWidgetsAvailable } from '@/features/widgets/native-widgets';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { EmptyState } from '@/ui/components/empty-state';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function NowPreferencesScreen() {
  const { selected, documentPreferences, updateDocumentPreferences } = useAppData();
  const { colors } = useMinTheme();
  const [working, setWorking] = useState(false);
  const document = selected?.document;
  const me = document?.people.find((person) => person.id === documentPreferences?.mePersonId);

  if (!document || !documentPreferences) {
    return <Screen><NavigationHeader title="La meva vista" mode="close" /><EmptyState title="Cap esdeveniment obert" body="Obre un esdeveniment abans de configurar la vista." /></Screen>;
  }

  const apply = async (patch: Partial<DocumentPreferences>) => {
    if (working) return;
    setWorking(true);
    try {
      await updateDocumentPreferences(patch);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Torna-ho a provar.';
      Alert.alert('No s’ha pogut actualitzar', message, [
        { text: 'D’acord', style: 'cancel' },
        ...(message.includes('sistema') ? [{ text: 'Obre els ajustos', onPress: () => void Linking.openSettings() }] : []),
      ]);
    } finally {
      setWorking(false);
    }
  };

  const toggleCommon = (includeCommon: boolean) => void apply({
    includeCommon,
    reminderIncludeCommon: includeCommon,
    liveIncludeCommon: includeCommon,
  });
  const togglePersonal = (enabled: boolean) => {
    if (enabled && !me) {
      router.push({ pathname: '/active-selector', params: { mode: 'person', enable: 'personal' } });
      return;
    }
    void apply({ filter: enabled ? 'mine' : 'all' });
  };
  const toggleReminders = (enabled: boolean) => {
    if (enabled && !me) {
      router.push({ pathname: '/active-selector', params: { mode: 'person', enable: 'reminders' } });
      return;
    }
    void apply({
      reminderMode: enabled ? 'mine' : 'off',
      reminderMinutes: enabled ? documentPreferences.reminderMinutes ?? 10 : null,
      reminderIncludeCommon: documentPreferences.includeCommon,
    });
  };
  const toggleLive = (enabled: boolean) => {
    if (enabled && !me) {
      router.push({ pathname: '/active-selector', params: { mode: 'person', enable: 'live' } });
      return;
    }
    void apply({ liveMode: enabled ? 'mine' : 'off', liveIncludeCommon: documentPreferences.includeCommon });
  };

  return (
    <Screen>
      <NavigationHeader title="La meva vista" mode="close" />
      <MinText style={[styles.lead, { color: colors.secondary }]}>Configura el filtre d’Ara i quina informació vols rebre d’aquest esdeveniment.</MinText>

      <View style={styles.section}>
        <MinText variant="label">Qui soc</MinText>
        <Card style={styles.identity}>
          <View style={styles.identityText}>
            <MinText style={styles.strong}>{me?.name ?? 'Encara no ho has indicat'}</MinText>
            <MinText variant="metadata" style={{ color: colors.secondary }}>{me ? 'Pots filtrar l’agenda per veure només el que et toca.' : 'Tria el teu nom per personalitzar Ara.'}</MinText>
          </View>
          <Button label={me ? 'Canvia' : 'Tria'} accessibilityLabel={me ? 'Canvia qui soc' : 'Tria qui soc'} icon="person" variant="secondary" onPress={() => router.push('/active-selector?mode=person')} style={styles.compactButton} />
        </Card>
      </View>

      <View style={styles.section}>
        <MinText variant="label">Preferències ràpides</MinText>
        <QuickSwitch
          label="Només les meves tasques"
          description="Filtra l’agenda. El que passa ara sempre es mostra."
          value={documentPreferences.filter === 'mine'}
          disabled={working}
          onValueChange={togglePersonal}
        />
        <QuickSwitch
          label="Inclou tasques generals"
          description="A la teva vista, als avisos i a l’Activitat en directe."
          value={documentPreferences.includeCommon}
          disabled={working}
          onValueChange={toggleCommon}
        />
        <QuickSwitch
          label="Avisos de les meves tasques"
          description="T’avisa 10 minuts abans, o amb l’antelació que hagis configurat."
          value={documentPreferences.reminderMode !== 'off'}
          disabled={working}
          onValueChange={toggleReminders}
        />
        {Platform.OS === 'ios' && nativeWidgetsAvailable() ? (
          <QuickSwitch
            label="Activitat en directe"
            description="Mostra què et toca a la pantalla bloquejada i a la Dynamic Island."
            value={documentPreferences.liveMode !== 'off'}
            disabled={working}
            onValueChange={toggleLive}
          />
        ) : null}
      </View>

      <Button label="Més opcions" icon="settings" variant="quiet" onPress={() => router.dismissTo('/(tabs)/settings')} />
    </Screen>
  );
}

function QuickSwitch({ label, description, value, disabled, onValueChange }: { label: string; description: string; value: boolean; disabled: boolean; onValueChange: (value: boolean) => void }) {
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
  lead: { marginBottom: spacing.x6 },
  section: { gap: spacing.x3, marginBottom: spacing.x6 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
  identityText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  compactButton: { paddingHorizontal: spacing.x3 },
  switchCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.x4 },
  switchText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  strong: { fontWeight: '600' },
});
