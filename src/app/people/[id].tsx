import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { canEditDocument } from '@/domain/permissions';
import { formatTaskTime, isTaskCurrent, orderedTasks, personIdsForTask } from '@/domain/time';
import { useAppData } from '@/features/app-data/app-data-provider';
import { useNow } from '@/features/time/use-now';
import { colorForAccent, inkForAccent } from '@/ui/accent';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { EmptyState } from '@/ui/components/empty-state';
import { MinIcon } from '@/ui/components/icon';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
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
  const { fontScale } = useWindowDimensions();
  const document = selected?.document;
  const now = useNow(document);
  const person = document?.people.find((candidate) => candidate.id === id);
  if (!selected || !document || !person || !documentPreferences) return <Screen><EmptyState title="Persona no disponible" body="Pot haver desaparegut en una revisió nova." /></Screen>;
  const tasks = orderedTasks(document.tasks).filter((task) => personIdsForTask(document, task).has(person.id));
  const teams = document.teams.filter((team) => team.personIds.includes(person.id));
  const isMe = documentPreferences.mePersonId === person.id;
  const editable = canEditDocument(selected);
  const avatarColor = colorForAccent(person.initialsColor, colors);
  const avatarInk = inkForAccent(person.initialsColor, colors);
  const chooseMe = async () => {
    await updateDocumentPreferences({ mePersonId: person.id, filter: 'mine' });
  };
  const edit = async () => {
    if (!editable) await duplicateDocument(document.documentId);
    router.push({ pathname: '/people/edit/[id]', params: { id: person.id, returnTo: 'editor' } });
  };
  return (
    <Screen>
      <NavigationHeader title="Persona" mode="close" />
      <Card style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}><MinText variant="title" style={{ color: avatarInk }}>{initials(person.name)}</MinText></View>
        <View style={styles.profileBody}>
          <View style={styles.nameRow}>
            <MinText variant="hero" style={styles.name}>{person.name}</MinText>
            {isMe ? <MinText variant="caption" style={[styles.meBadge, { backgroundColor: colors.lilac, color: colors.text }]}>Soc jo</MinText> : null}
          </View>
          {person.disambiguation ? <MinText variant="metadata" style={{ color: colors.secondary }}>{person.disambiguation}</MinText> : null}
          {teams.length ? <View style={styles.chips}>{teams.map((team) => <View key={team.id} style={[styles.chip, { backgroundColor: colors.surface }]}><MinText variant="caption">{team.name}</MinText></View>)}</View> : null}
          <MinText variant="caption" style={{ color: colors.secondary }}>{tasks.length === 1 ? '1 tasca assignada' : `${tasks.length} tasques assignades`}</MinText>
        </View>
      </Card>
      <View style={[styles.actions, fontScale > 1.3 && styles.actionsStacked]}>
        {!isMe ? <Button label="Soc jo" accessibilityLabel="Aquesta persona soc jo" icon="person" onPress={chooseMe} style={styles.action} /> : null}
        <Button label={editable ? 'Edita' : 'Duplica i edita'} accessibilityLabel={editable ? 'Edita la persona' : 'Duplica l’esdeveniment per editar la persona'} icon={editable ? 'edit' : 'copy'} variant="secondary" onPress={edit} style={styles.action} />
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <MinText variant="label">Tasques assignades</MinText>
          {tasks.length ? <MinText variant="caption" style={{ color: colors.secondary }}>{tasks.length}</MinText> : null}
        </View>
        {tasks.length ? tasks.map((task) => (
          <Pressable
            key={task.id}
            accessibilityRole="button"
            accessibilityLabel={`${formatTaskTime(task, document)}, ${task.title}`}
            accessibilityHint="Obre els detalls de la tasca"
            onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: task.id } })}
            style={({ pressed }) => [styles.task, { backgroundColor: isTaskCurrent(task, now) ? colors.lilac : colors.raised, borderColor: isTaskCurrent(task, now) ? colors.brand : colors.line }, pressed && styles.pressed]}>
            <View style={styles.taskBody}>
              <View style={styles.taskEyebrow}>
                <MinText variant="time" style={{ color: colors.brand }}>{formatTaskTime(task, document)}</MinText>
                {isTaskCurrent(task, now) ? <MinText variant="caption" style={[styles.nowBadge, { backgroundColor: colors.brand, color: colors.brandInk }]}>Ara</MinText> : null}
              </View>
              <MinText style={styles.taskTitle}>{task.title}</MinText>
              {task.place || task.category || task.common ? <MinText variant="metadata" style={{ color: colors.secondary }}>{[task.category, task.place, task.common ? 'Tota la colla' : null].filter(Boolean).join(' · ')}</MinText> : null}
            </View>
            <MinIcon name="chevronRight" size={18} color={colors.secondary} />
          </Pressable>
        )) : <MinText style={{ color: colors.secondary }}>Encara no té cap tasca assignada.</MinText>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x4 },
  avatar: { width: 64, height: 64, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  profileBody: { flex: 1, minWidth: 0, gap: spacing.x2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.x2 },
  name: { flexShrink: 1 },
  meBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.x2, paddingVertical: spacing.x1, overflow: 'hidden' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2 },
  chip: { borderRadius: radius.pill, paddingHorizontal: spacing.x2, paddingVertical: spacing.x1 },
  actions: { flexDirection: 'row', gap: spacing.x2, marginTop: spacing.x3 },
  actionsStacked: { flexDirection: 'column' },
  action: { flex: 1 },
  section: { gap: spacing.x3, marginTop: spacing.x8 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x3 },
  task: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, borderWidth: 1, borderRadius: radius.button, padding: spacing.x4 },
  taskBody: { flex: 1, minWidth: 0, gap: spacing.x1 },
  taskEyebrow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.x2 },
  taskTitle: { fontWeight: '600' },
  nowBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.x2, paddingVertical: 2, overflow: 'hidden' },
  pressed: { opacity: 0.66 },
});
