import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { parseSharedDocument } from '@/domain/schema';
import { personRemovalImpact, removePerson } from '@/domain/person-removal';
import { useAppData } from '@/features/app-data/app-data-provider';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { EmptyState } from '@/ui/components/empty-state';
import { MinIcon } from '@/ui/components/icon';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function RemovePersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selected, saveDraft } = useAppData();
  const { colors } = useMinTheme();
  const [replacementId, setReplacementId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const document = selected?.draft ?? selected?.document;
  const person = document?.people.find((candidate) => candidate.id === id);
  if (!document || !person) return <Screen><NavigationHeader title="Elimina una persona" /><EmptyState title="No s’ha trobat la persona" body="Pot ser que ja s’hagi eliminat de l’esborrany." /></Screen>;
  const impact = personRemovalImpact(document, person.id);
  const affected = impact.directTasks.length + impact.roles.length + impact.teams.length;
  const apply = async () => {
    setSaving(true);
    try {
      await saveDraft(parseSharedDocument(removePerson(document, person.id, replacementId)));
      router.replace('/editor');
    } catch (error) {
      Alert.alert('No s’ha pogut eliminar', error instanceof Error ? error.message : 'Torna-ho a provar.');
    } finally { setSaving(false); }
  };
  return (
    <Screen>
      <NavigationHeader title="Elimina una persona" />
      <MinText variant="hero">{person.name}</MinText>
      <MinText style={[styles.lead, { color: colors.secondary }]}>{affected ? `Aquesta persona apareix en ${affected} ${affected === 1 ? 'lloc' : 'llocs'}. Tria si vols reassignar-ho tot o deixar les funcions pendents.` : 'Aquesta persona no té assignacions.'}</MinText>
      {affected ? (
        <Card style={styles.impact}>
          {impact.directTasks.map((title) => <MinText key={`task-${title}`}>Tasca: {title}</MinText>)}
          {impact.roles.map((role) => <MinText key={`role-${role.taskTitle}-${role.roleName}`}>Funció: {role.roleName} · {role.taskTitle}</MinText>)}
          {impact.teams.map((name) => <MinText key={`team-${name}`}>Equip: {name}</MinText>)}
        </Card>
      ) : null}
      {document.people.length > 1 ? (
        <View style={styles.section}>
          <MinText variant="label">Reassigna-ho tot a</MinText>
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: replacementId === null }} onPress={() => setReplacementId(null)} style={styles.option}>
            <MinIcon name={replacementId === null ? 'radioOn' : 'radioOff'} size={22} color={replacementId === null ? colors.brand : colors.secondary} />
            <MinText style={styles.optionText}>Ningú, deixa-ho per assignar</MinText>
          </Pressable>
          {document.people.filter((candidate) => candidate.id !== person.id).map((candidate) => (
            <Pressable key={candidate.id} accessibilityRole="radio" accessibilityState={{ checked: replacementId === candidate.id }} onPress={() => setReplacementId(candidate.id)} style={styles.option}>
              <MinIcon name={replacementId === candidate.id ? 'radioOn' : 'radioOff'} size={22} color={replacementId === candidate.id ? colors.brand : colors.secondary} />
              <MinText style={styles.optionText}>{candidate.name}</MinText>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Button label={replacementId ? 'Reassigna i elimina' : 'Deixa pendent i elimina'} icon="trash" variant="danger" loading={saving} onPress={apply} />
      <Button label="Cancel·la" variant="quiet" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginTop: spacing.x2, marginBottom: spacing.x5 },
  impact: { gap: spacing.x2, marginBottom: spacing.x6 },
  section: { gap: spacing.x2, marginBottom: spacing.x6 },
  option: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
  optionText: { flex: 1, minWidth: 0 },
});
