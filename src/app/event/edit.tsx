import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { getCalendars } from 'expo-localization';

import type { Accent } from '@/domain/models';
import { canEditDocument } from '@/domain/permissions';
import { parseSharedDocument } from '@/domain/schema';
import { useAppData } from '@/features/app-data/app-data-provider';
import { BottomActionBar } from '@/ui/components/bottom-action-bar';
import { Button } from '@/ui/components/button';
import { EmptyState } from '@/ui/components/empty-state';
import { DateTimeField } from '@/ui/components/date-time-field';
import { FormField } from '@/ui/components/form-field';
import { MinIcon } from '@/ui/components/icon';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { accentLabels, accents, colorForAccent, inkForAccent } from '@/ui/accent';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function EditEventScreen() {
  const { selected, saveDraft } = useAppData();
  const { colors } = useMinTheme();
  const base = selected?.draft ?? selected?.document;
  const [title, setTitle] = useState(base?.event.title ?? '');
  const [organization, setOrganization] = useState(base?.event.organization ?? '');
  const [startsAt, setStartsAt] = useState(() => new Date(base?.event.startsAt ?? Date.now()));
  const [endsAt, setEndsAt] = useState(() => new Date(base?.event.endsAt ?? Date.now() + 60 * 60 * 1_000));
  const [timeZone] = useState(() => getCalendars()[0]?.timeZone ?? base?.event.timeZone ?? 'Europe/Madrid');
  const [notes, setNotes] = useState(base?.event.notes ?? '');
  const [accent, setAccent] = useState<Accent>(base?.event.accent ?? 'blue');
  const [saving, setSaving] = useState(false);
  if (!base) return <Screen><MinText>No hi ha cap min seleccionat.</MinText></Screen>;
  if (!canEditDocument(selected)) return <Screen><NavigationHeader title="Dades del dia" /><EmptyState title="Còpia de consulta" body="Duplica l’esdeveniment abans de modificar-ne les dades." /></Screen>;
  const submit = async () => {
    if (!title.trim() || !organization.trim()) { Alert.alert('Falten dades', 'El nom i l’entitat són obligatoris.'); return; }
    if (endsAt <= startsAt) { Alert.alert('Finestra incorrecta', 'El final ha de ser posterior a l’inici.'); return; }
    setSaving(true);
    try {
      const event = { title: title.trim(), organization: organization.trim(), startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), timeZone, accent, ...(notes.trim() ? { notes: notes.trim() } : {}) };
      await saveDraft(parseSharedDocument({ ...base, event }));
      router.back();
    } catch (error) {
      Alert.alert('No s’ha pogut desar', error instanceof Error ? error.message : 'Comprova que totes les tasques quedin dins de la nova finestra.');
    } finally { setSaving(false); }
  };
  return (
    <Screen keyboardShouldPersistTaps="handled" footer={<BottomActionBar><Button label="Desa els canvis" icon="check" loading={saving} onPress={submit} /></BottomActionBar>}>
      <NavigationHeader title="Dades del dia" />
      <View style={styles.form}>
        <FormField label="Nom de l’esdeveniment" value={title} onChangeText={setTitle} />
        <FormField label="Entitat" value={organization} onChangeText={setOrganization} />
        <DateTimeField label="Comença" value={startsAt} onChange={setStartsAt} />
        <DateTimeField label="Acaba" value={endsAt} onChange={setEndsAt} />
        <FormField label="Notes generals" value={notes} onChangeText={setNotes} multiline />
        <View style={styles.accentGroup}><MinText variant="metadata" style={styles.label}>Color del document</MinText><View style={styles.accents}>{accents.map((value) => (
          <Pressable key={value} accessibilityRole="radio" accessibilityLabel={`Color ${accentLabels[value]}`} accessibilityState={{ checked: accent === value }} onPress={() => setAccent(value)} style={[styles.accent, { backgroundColor: colorForAccent(value, colors), borderColor: accent === value ? colors.text : colors.line }]}>
            {accent === value ? <MinIcon name="check" size={20} color={inkForAccent(value, colors)} /> : null}
          </Pressable>
        ))}</View><MinText variant="caption" style={{ color: colors.secondary }}>Seleccionat: {accentLabels[accent]}</MinText></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.x4, marginBottom: spacing.x6 },
  accentGroup: { gap: spacing.x2 },
  label: { fontWeight: '600' },
  accents: { flexDirection: 'row', gap: spacing.x3 },
  accent: { width: 48, height: 48, borderRadius: radius.pill, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
