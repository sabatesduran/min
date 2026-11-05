import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';

import { canEditDocument } from '@/domain/permissions';
import { personIdsForTask } from '@/domain/time';
import { useAppData } from '@/features/app-data/app-data-provider';
import { ca } from '@/locales/ca';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { EmptyState } from '@/ui/components/empty-state';
import { FormField } from '@/ui/components/form-field';
import { AppHeader } from '@/ui/components/header';
import { MinText } from '@/ui/components/min-text';
import { PersonRow } from '@/ui/components/person-row';
import { Screen } from '@/ui/components/screen';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function PeopleScreen() {
  const { selected, documentPreferences } = useAppData();
  const { colors } = useMinTheme();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.4;
  const [query, setQuery] = useState('');
  const people = useMemo(() => {
    if (!selected) return [];
    const normalized = query.trim().toLocaleLowerCase('ca');
    return selected.document.people.filter((person) => {
      const teams = selected.document.teams.filter((team) => team.personIds.includes(person.id)).map((team) => team.name).join(' ');
      return `${person.name} ${person.disambiguation ?? ''} ${teams}`.toLocaleLowerCase('ca').includes(normalized);
    });
  }, [query, selected]);
  if (!selected || !documentPreferences) {
    return <Screen><EmptyState title="Cap equip obert" body="Obre un esdeveniment per veure’n les persones." action="Ves als esdeveniments" onAction={() => router.replace('/events')} /></Screen>;
  }
  const document = selected.document;
  const me = document.people.find((person) => person.id === documentPreferences.mePersonId);
  const editable = canEditDocument(selected);
  return (
    <Screen>
      <AppHeader />
      <View style={[styles.titleRow, largeText && styles.stackedRow]}>
        <MinText variant="hero" style={styles.title}>Equip</MinText>
        {editable ? <Button accessibilityLabel="Afegeix una persona" label="Afegeix" icon="personAdd" variant="secondary" onPress={() => router.push('/people/edit/new')} style={styles.addButton} /> : null}
      </View>
      <MinText style={[styles.organization, { color: colors.secondary }]}>{document.event.organization}</MinText>
      {me ? (
        <Card style={[styles.identity, largeText ? styles.stackedRow : {}, { backgroundColor: colors.lilac }]}>
          <View style={styles.identityText}>
            <MinText variant="label">Tu ets {me.name}</MinText>
            <MinText variant="metadata" style={{ color: colors.secondary }}>Els filtres i avisos personals fan servir aquesta identitat.</MinText>
          </View>
          <Button label="Canvia" variant="quiet" onPress={() => router.push('/active-selector?mode=person')} />
        </Card>
      ) : (
        <Card style={[styles.identity, largeText ? styles.stackedRow : {}, { backgroundColor: colors.lilac }]}>
          <View style={styles.identityText}><MinText variant="label">{ca.people.noIdentity}</MinText></View>
          {document.people.length ? <Button label={ca.people.choose} variant="quiet" onPress={() => router.push('/active-selector?mode=person')} /> : null}
        </Card>
      )}
      {document.teams.length || editable ? (
        <View style={styles.teamsSection}>
          <View style={[styles.sectionHeader, largeText && styles.stackedRow]}>
            <MinText variant="label">Equips</MinText>
            {editable ? <Button label="Nou equip" icon="add" variant="quiet" onPress={() => router.push('/teams/edit/new')} style={styles.addButton} /> : null}
          </View>
          <View style={styles.teamChips}>
            {document.teams.map((team) => (
              <Pressable
                key={team.id}
                accessibilityRole={editable ? 'button' : 'text'}
                accessibilityLabel={`${team.name}, ${team.personIds.length} persones`}
                disabled={!editable}
                onPress={() => router.push({ pathname: '/teams/edit/[id]', params: { id: team.id } })}
                style={({ pressed }) => [styles.teamChip, { backgroundColor: colors.surface }, pressed && styles.pressed]}>
                <MinText variant="metadata" style={{ fontWeight: '600' }}>{team.name}</MinText>
                <MinText variant="caption" style={{ color: colors.secondary }}>{team.personIds.length}</MinText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      <FormField label="Cerca persones" value={query} onChangeText={setQuery} placeholder="Nom, cognoms o equip" returnKeyType="search" reserveErrorSpace={false} />
      {!people.length ? <EmptyState title="Cap persona" body={query ? 'No hi ha coincidències amb aquesta cerca.' : 'Afegeix persones per poder assignar tasques.'} /> : people.map((person) => {
        const count = document.tasks.filter((task) => personIdsForTask(document, task).has(person.id)).length;
        return <PersonRow key={person.id} person={person} isMe={person.id === documentPreferences.mePersonId} taskCount={count} />;
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  organization: { marginTop: spacing.x1, marginBottom: spacing.x5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
  title: { flex: 1, minWidth: 0 },
  addButton: { paddingHorizontal: spacing.x3 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3, marginBottom: spacing.x5 },
  identityText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  teamsSection: { gap: spacing.x3, marginBottom: spacing.x5 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x3 },
  stackedRow: { flexDirection: 'column', alignItems: 'stretch' },
  teamChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2 },
  teamChip: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.x2, borderRadius: 16, paddingHorizontal: spacing.x3 },
  pressed: { opacity: 0.68 },
});
