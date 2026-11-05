import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { formatTaskTime, personIdsForTask } from '@/domain/time';
import { canEditDocument } from '@/domain/permissions';
import { useAppData } from '@/features/app-data/app-data-provider';
import { Button, IconButton } from '@/ui/components/button';
import { EmptyState } from '@/ui/components/empty-state';
import { MinIcon } from '@/ui/components/icon';
import { MinText } from '@/ui/components/min-text';
import { Screen } from '@/ui/components/screen';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase('ca')).join('');
}

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selected, documentPreferences, updateDocumentPreferences, duplicateDocument } = useAppData();
  const { colors } = useMinTheme();
  const document = selected?.document;
  const person = document?.people.find((candidate) => candidate.id === id);
  if (!selected || !document || !person || !documentPreferences) return <Screen><EmptyState title="Persona no disponible" body="Pot haver desaparegut en una revisió nova." /></Screen>;
  const tasks = document.tasks.filter((task) => personIdsForTask(document, task).has(person.id));
  const teams = document.teams.filter((team) => team.personIds.includes(person.id));
  const isMe = documentPreferences.mePersonId === person.id;
  const chooseMe = async () => {
    await updateDocumentPreferences({ mePersonId: person.id, filter: 'mine' });
  };
  const edit = async () => {
    if (!canEditDocument(selected)) await duplicateDocument(document.documentId);
    router.push({ pathname: '/people/edit/[id]', params: { id: person.id, returnTo: 'editor' } });
  };
  return (
    <Screen>
      <View style={styles.header}><IconButton icon="close" label="Tanca" onPress={() => router.back()} /><Button label={canEditDocument(selected) ? 'Edita' : 'Duplica per editar'} icon={canEditDocument(selected) ? 'edit' : 'copy'} variant="quiet" onPress={edit} /></View>
      <View style={[styles.avatar, { backgroundColor: colors.lilac }]}><MinText variant="hero">{initials(person.name)}</MinText></View>
      <MinText variant="hero" style={styles.name}>{person.name}</MinText>
      {person.disambiguation ? <MinText style={{ color: colors.secondary }}>{person.disambiguation}</MinText> : null}
      {teams.length ? <View style={styles.chips}>{teams.map((team) => <View key={team.id} style={[styles.chip, { backgroundColor: colors.surface }]}><MinText variant="metadata">{team.name}</MinText></View>)}</View> : null}
      <Button label={isMe ? 'Aquesta persona ets tu' : 'Aquesta persona soc jo'} icon={isMe ? 'complete' : 'person'} variant={isMe ? 'secondary' : 'primary'} disabled={isMe} onPress={chooseMe} />
      <View style={styles.section}>
        <MinText variant="label">Tasques assignades</MinText>
        {tasks.length ? tasks.map((task) => (
          <Pressable
            key={task.id}
            accessibilityRole="button"
            accessibilityLabel={`Obre ${task.title}`}
            onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: task.id } })}
            style={({ pressed }) => [styles.task, { borderBottomColor: colors.line }, pressed && styles.pressed]}>
            <MinText variant="time" style={{ color: colors.brand }}>{formatTaskTime(task, document)}</MinText>
            <MinText style={styles.taskTitle}>{task.title}</MinText>
            <MinIcon name="chevronRight" size={18} color={colors.secondary} />
          </Pressable>
        )) : <MinText style={{ color: colors.secondary }}>Encara no té cap tasca assignada.</MinText>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.x4 },
  avatar: { width: 88, height: 88, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  name: { marginTop: spacing.x4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2, marginVertical: spacing.x4 },
  chip: { borderRadius: radius.pill, paddingHorizontal: spacing.x3, paddingVertical: spacing.x2 },
  section: { gap: spacing.x3, marginTop: spacing.x8 },
  task: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, borderBottomWidth: 1 },
  taskTitle: { flex: 1 },
  pressed: { opacity: 0.66 },
});
