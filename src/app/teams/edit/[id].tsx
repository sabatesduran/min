import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';

import { canEditDocument } from '@/domain/permissions';
import { parseSharedDocument } from '@/domain/schema';
import { useAppData } from '@/features/app-data/app-data-provider';
import { BottomActionBar } from '@/ui/components/bottom-action-bar';
import { Button } from '@/ui/components/button';
import { EmptyState } from '@/ui/components/empty-state';
import { FormField } from '@/ui/components/form-field';
import { MinIcon } from '@/ui/components/icon';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function EditTeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selected, saveDraft } = useAppData();
  const { colors } = useMinTheme();
  const base = selected?.draft ?? selected?.document;
  const existing = id === 'new' ? undefined : base?.teams.find((team) => team.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const [personIds, setPersonIds] = useState(existing?.personIds ?? []);
  const [saving, setSaving] = useState(false);

  if (!selected || !base) return <Screen><EmptyState title="Cap esdeveniment obert" body="Obre un esdeveniment abans de gestionar equips." /></Screen>;
  if (!canEditDocument(selected)) return <Screen><NavigationHeader title="Equip" /><EmptyState title="Còpia de consulta" body="Duplica aquest esdeveniment si necessites modificar-ne els equips." /></Screen>;

  const togglePerson = (personId: string) => setPersonIds((current) => current.includes(personId) ? current.filter((value) => value !== personId) : [...current, personId]);
  const submit = async () => {
    if (!name.trim()) { Alert.alert('Falta el nom', 'Escriu com s’ha d’anomenar l’equip.'); return; }
    setSaving(true);
    try {
      const team = { id: existing?.id ?? Crypto.randomUUID(), name: name.trim(), personIds };
      const teams = existing ? base.teams.map((candidate) => candidate.id === existing.id ? team : candidate) : [...base.teams, team];
      await saveDraft(parseSharedDocument({ ...base, teams }));
      router.back();
    } catch (error) {
      Alert.alert('No s’ha pogut desar', error instanceof Error ? error.message : 'Revisa les dades.');
    } finally { setSaving(false); }
  };
  const remove = () => {
    if (!existing) return;
    Alert.alert('Elimina aquest equip?', 'Les tasques conservaran les persones assignades directament, però perdran aquesta assignació d’equip.', [
      { text: 'Cancel·la', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: async () => {
        const tasks = base.tasks.map((task) => ({
          ...task,
          teamIds: task.teamIds.filter((teamId) => teamId !== existing.id),
          roles: task.roles.map((role) => ({ ...role, teamIds: role.teamIds.filter((teamId) => teamId !== existing.id) })),
        }));
        await saveDraft(parseSharedDocument({ ...base, teams: base.teams.filter((team) => team.id !== existing.id), tasks }));
        router.back();
      } },
    ]);
  };

  return (
    <Screen
      keyboardShouldPersistTaps="handled"
      footer={<BottomActionBar><Button label="Desa l’equip" icon="check" loading={saving} onPress={submit} /></BottomActionBar>}>
      <NavigationHeader title={existing ? 'Edita l’equip' : 'Nou equip'} />
      <FormField label="Nom de l’equip" value={name} onChangeText={setName} placeholder="Pirotècnia, barra, coordinació…" autoFocus />
      <View style={styles.section}>
        <MinText variant="label">Persones</MinText>
        <MinText style={{ color: colors.secondary }}>Selecciona qui forma part de l’equip. Les tasques assignades a l’equip arribaran a totes aquestes persones.</MinText>
        {base.people.length ? base.people.map((person) => {
          const checked = personIds.includes(person.id);
          return (
            <Pressable key={person.id} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => togglePerson(person.id)} style={styles.optionRow}>
              <MinIcon name={checked ? 'checked' : 'unchecked'} size={24} color={checked ? colors.brand : colors.secondary} />
              <MinText style={styles.optionText}>{person.name}</MinText>
            </Pressable>
          );
        }) : <MinText style={{ color: colors.secondary }}>Afegeix persones abans de crear un equip.</MinText>}
      </View>
      {existing ? <Button label="Elimina l’equip" icon="trash" variant="danger" onPress={remove} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.x3, marginTop: spacing.x5, marginBottom: spacing.x8 },
  optionRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
  optionText: { flex: 1 },
});
