import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { getCalendars } from 'expo-localization';
import { router } from 'expo-router';

import { createDocument } from '@/domain/factory';
import { useAppData } from '@/features/app-data/app-data-provider';
import { BottomActionBar } from '@/ui/components/bottom-action-bar';
import { Button } from '@/ui/components/button';
import { DateTimeField } from '@/ui/components/date-time-field';
import { FormField } from '@/ui/components/form-field';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

function roundedFutureDate(hours: number): Date {
  const date = new Date(Date.now() + hours * 60 * 60 * 1_000);
  date.setMinutes(0, 0, 0);
  return date;
}

export default function CreateEventScreen() {
  const { addDocument } = useAppData();
  const { colors } = useMinTheme();
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [startsAt, setStartsAt] = useState(() => roundedFutureDate(1));
  const [endsAt, setEndsAt] = useState(() => roundedFutureDate(9));
  const [timeZone] = useState(() => getCalendars()[0]?.timeZone ?? 'Europe/Madrid');
  const [saving, setSaving] = useState(false);
  const errors = useMemo(() => ({
    title: title.trim() ? undefined : 'Escriu el nom de l’esdeveniment.',
    organization: organization.trim() ? undefined : 'Escriu el nom de l’entitat.',
    dates: endsAt.getTime() > startsAt.getTime() ? undefined : 'El final ha de ser posterior a l’inici.',
  }), [endsAt, organization, startsAt, title]);
  const submit = async () => {
    if (errors.title || errors.organization || errors.dates) {
      Alert.alert('Revisa les dades', errors.title ?? errors.organization ?? errors.dates);
      return;
    }
    setSaving(true);
    try {
      const document = createDocument({ title: title.trim(), organization: organization.trim(), startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), timeZone });
      await addDocument(document);
      router.replace({ pathname: '/editor', params: { exit: 'agenda' } });
    } catch (error) {
      Alert.alert('No s’ha pogut crear', error instanceof Error ? error.message : 'Torna-ho a provar.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Screen keyboardShouldPersistTaps="handled" footer={<BottomActionBar><Button label="Crea l’esdeveniment" icon="check" loading={saving} onPress={submit} /></BottomActionBar>}>
      <NavigationHeader title="Un dia per fer" mode="close" />
      <MinText variant="hero">Crea el teu min</MinText>
      <MinText style={[styles.lead, { color: colors.secondary }]}>Defineix quan passa. Després podràs afegir l’horari, les persones i compartir-ne una revisió.</MinText>
      <Button label="Ja tens un document? Converteix-lo amb IA" icon="sparkles" variant="quiet" onPress={() => router.push('/ai-assistant')} style={styles.aiEntry} />
      <View style={styles.form}>
        <FormField label="Nom de l’esdeveniment" value={title} onChangeText={setTitle} error={title.length ? errors.title : undefined} placeholder="Correfoc de Festa Major" autoFocus />
        <FormField label="Entitat" value={organization} onChangeText={setOrganization} error={organization.length ? errors.organization : undefined} placeholder="Nom de la colla o entitat" />
        <DateTimeField label="Comença" value={startsAt} onChange={setStartsAt} />
        <DateTimeField label="Acaba" value={endsAt} onChange={setEndsAt} />
        {errors.dates ? <MinText variant="caption" style={{ color: colors.error }}>{errors.dates}</MinText> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginTop: spacing.x2 },
  aiEntry: { marginTop: spacing.x4 },
  form: { gap: spacing.x4, marginVertical: spacing.x6 },
});
