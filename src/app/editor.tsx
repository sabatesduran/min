import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';

import type { Person, Task } from '@/domain/models';
import { validateEditorially } from '@/domain/editorial-validation';
import { moveTaskInSlot, taskPositionInSlot } from '@/domain/task-order';
import { canEditDocument } from '@/domain/permissions';
import { parseSharedDocument } from '@/domain/schema';
import { formatTaskTime, orderedTasks, personIdsForTask } from '@/domain/time';
import { useAppData } from '@/features/app-data/app-data-provider';
import { Button, IconButton } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { EmptyState } from '@/ui/components/empty-state';
import { MinIcon } from '@/ui/components/icon';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

function initials(person: Person): string {
  return person.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase('ca')).join('');
}

export default function DocumentEditorScreen() {
  const { exit } = useLocalSearchParams<{ exit?: string }>();
  const { selected, saveDraft, duplicateDocument } = useAppData();
  const { colors } = useMinTheme();
  if (!selected) return <Screen><EmptyState title="Cap esdeveniment obert" body="Obre un esdeveniment abans de preparar-lo." /></Screen>;
  if (!canEditDocument(selected)) {
    return (
      <Screen>
        <NavigationHeader title="Prepara l’esdeveniment" />
        <EmptyState
          icon="copy"
          title="Aquesta és una còpia de consulta"
          body="Per protegir la revisió rebuda, duplica-la abans de fer canvis. La còpia nova serà independent."
          action="Duplica per editar"
          onAction={async () => { await duplicateDocument(selected.document.documentId); router.replace('/editor'); }}
        />
      </Screen>
    );
  }
  const base = selected.draft ?? selected.document;
  const dirty = Boolean(selected.draft && JSON.stringify(selected.draft) !== JSON.stringify(selected.document));
  const tasks = orderedTasks(base.tasks);
  const editorialIssues = validateEditorially(base);

  const duplicateTask = async (task: Task) => {
    try {
      const copy: Task = {
        ...task,
        id: Crypto.randomUUID(),
        title: `${task.title} — còpia`,
        sortOrder: base.tasks.length,
        roles: task.roles.map((role) => ({ ...role, id: Crypto.randomUUID() })),
        checklist: task.checklist.map((item) => ({ ...item, id: Crypto.randomUUID() })),
      };
      await saveDraft(parseSharedDocument({ ...base, tasks: [...base.tasks, copy] }));
    } catch (error) {
      Alert.alert('No s’ha pogut duplicar', error instanceof Error ? error.message : 'Torna-ho a provar.');
    }
  };

  const moveTask = async (taskId: string, direction: 'up' | 'down') => {
    try {
      await saveDraft(parseSharedDocument({ ...base, tasks: moveTaskInSlot(base.tasks, taskId, direction) }));
    } catch (error) {
      Alert.alert('No s’ha pogut reordenar', error instanceof Error ? error.message : 'Torna-ho a provar.');
    }
  };

  return (
    <Screen>
      <NavigationHeader title="Prepara l’esdeveniment" {...(exit === 'agenda' ? { onBack: () => router.replace('/(tabs)') } : {})} />
      <View style={styles.titleBlock}>
        <View style={[styles.status, { backgroundColor: dirty ? colors.peach : colors.surface }]}>
          <MinText variant="caption" style={{ color: dirty ? colors.text : colors.secondary }}>{dirty ? 'Canvis desats en esborrany' : `Revisió actual · V${base.revision}`}</MinText>
        </View>
        <MinText variant="hero">{base.event.title}</MinText>
        <MinText style={{ color: colors.secondary }}>{base.event.organization}</MinText>
      </View>

      <View style={styles.primaryActions}>
        <Button label="Dades del dia" icon="calendar" variant="secondary" onPress={() => router.push('/event/edit')} style={styles.primaryAction} />
        <Button label={dirty ? 'Revisa i crea la revisió' : 'Comparteix la revisió'} icon="share" onPress={() => router.push('/publish')} style={styles.primaryAction} />
      </View>

      <Card style={[styles.reviewCard, { backgroundColor: editorialIssues.length ? colors.peach : colors.successSoft }]}>
        <MinText variant="label" style={{ color: editorialIssues.length ? colors.text : colors.success }}>
          {editorialIssues.length ? `${editorialIssues.length} ${editorialIssues.length === 1 ? 'punt per revisar' : 'punts per revisar'}` : 'Sense incidències editorials'}
        </MinText>
        {editorialIssues.length ? <Button label="Revisa abans de publicar" variant="quiet" onPress={() => router.push('/publish')} /> : null}
      </Card>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitle}>
            <MinText variant="label">Tasques</MinText>
            <MinText variant="caption" style={{ color: colors.secondary }}>{tasks.length ? `${tasks.length} en aquest esdeveniment` : 'Encara no n’hi ha cap'}</MinText>
          </View>
          <Button label="Afegeix" icon="add" variant="secondary" onPress={() => router.push('/tasks/edit/new')} style={styles.addButton} />
        </View>
        <View style={styles.list}>
          {tasks.map((task) => {
            const position = taskPositionInSlot(base.tasks, task.id);
            const people = [...personIdsForTask(base, task)]
              .map((id) => base.people.find((person) => person.id === id)?.name)
              .filter(Boolean)
              .join(', ');
            return (
              <Card key={task.id} style={styles.rowCard}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edita ${task.title}`}
                  onPress={() => router.push({ pathname: '/tasks/edit/[id]', params: { id: task.id } })}
                  style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
                  <MinText variant="time" style={[styles.taskTime, { color: colors.brand }]}>
                    {task.kind === 'after' ? 'En acabar' : formatTaskTime(task, base)}
                  </MinText>
                  <View style={styles.rowText}>
                    <MinText style={styles.rowTitle}>{task.title}</MinText>
                    <MinText variant="caption" style={{ color: colors.secondary }}>{people || 'Per assignar'}</MinText>
                  </View>
                  <MinIcon name="chevronRight" size={18} color={colors.secondary} />
                </Pressable>
                <View style={styles.rowActions}>
                  {position.canMoveUp ? <IconButton icon="arrowUp" label={`Mou ${task.title} amunt dins del mateix moment`} onPress={() => moveTask(task.id, 'up')} /> : null}
                  {position.canMoveDown ? <IconButton icon="chevronDown" label={`Mou ${task.title} avall dins del mateix moment`} onPress={() => moveTask(task.id, 'down')} /> : null}
                  <IconButton icon="copy" label={`Duplica ${task.title}`} onPress={() => duplicateTask(task)} />
                </View>
              </Card>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitle}>
            <MinText variant="label">Equips</MinText>
            <MinText variant="caption" style={{ color: colors.secondary }}>{base.teams.length ? `${base.teams.length} grups de responsabilitat` : 'Cap equip definit'}</MinText>
          </View>
          <Button label="Afegeix" icon="add" variant="secondary" onPress={() => router.push('/teams/edit/new')} style={styles.addButton} />
        </View>
        <View style={styles.list}>
          {base.teams.map((team) => (
            <Pressable
              key={team.id}
              accessibilityRole="button"
              accessibilityLabel={`Edita l’equip ${team.name}`}
              onPress={() => router.push({ pathname: '/teams/edit/[id]', params: { id: team.id } })}
              style={({ pressed }) => [styles.personRow, { borderBottomColor: colors.line }, pressed && styles.pressed]}>
              <View style={[styles.avatar, { backgroundColor: colors.surface }]}><MinIcon name="people" size={20} color={colors.brand} /></View>
              <View style={styles.rowText}><MinText style={styles.rowTitle}>{team.name}</MinText><MinText variant="caption" style={{ color: colors.secondary }}>{team.personIds.length} persones</MinText></View>
              <MinIcon name="chevronRight" size={18} color={colors.secondary} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitle}>
            <MinText variant="label">Persones</MinText>
            <MinText variant="caption" style={{ color: colors.secondary }}>{base.people.length ? `${base.people.length} al directori` : 'Directori buit'}</MinText>
          </View>
          <Button label="Afegeix" icon="personAdd" variant="secondary" onPress={() => router.push('/people/edit/new')} style={styles.addButton} />
        </View>
        <View style={styles.list}>
          {base.people.map((person) => (
            <Pressable
              key={person.id}
              accessibilityRole="button"
              accessibilityLabel={`Edita ${person.name}`}
              onPress={() => router.push({ pathname: '/people/edit/[id]', params: { id: person.id } })}
              style={({ pressed }) => [styles.personRow, { borderBottomColor: colors.line }, pressed && styles.pressed]}>
              <View style={[styles.avatar, { backgroundColor: colors.lilac }]}><MinText variant="metadata" style={styles.avatarText}>{initials(person)}</MinText></View>
              <View style={styles.rowText}><MinText style={styles.rowTitle}>{person.name}</MinText>{person.disambiguation ? <MinText variant="caption" style={{ color: colors.secondary }}>{person.disambiguation}</MinText> : null}</View>
              <MinIcon name="chevronRight" size={18} color={colors.secondary} />
            </Pressable>
          ))}
        </View>
      </View>

      <Button label="Previsualitza la consulta" icon="now" variant="secondary" onPress={() => router.replace('/(tabs)')} />
      <Button label="Gestiona la còpia local" icon="more" variant="quiet" onPress={() => router.push('/document-actions')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleBlock: { gap: spacing.x1, marginBottom: spacing.x5 },
  status: { alignSelf: 'flex-start', paddingHorizontal: spacing.x2, paddingVertical: spacing.x1, borderRadius: radius.pill, marginBottom: spacing.x2 },
  primaryActions: { gap: spacing.x2, marginBottom: spacing.x8 },
  primaryAction: { width: '100%' },
  reviewCard: { gap: spacing.x2, marginBottom: spacing.x8 },
  section: { gap: spacing.x3, marginBottom: spacing.x8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
  sectionTitle: { flex: 1, minWidth: 0, gap: spacing.x1 },
  addButton: { paddingHorizontal: spacing.x3 },
  list: { gap: spacing.x2 },
  rowCard: { padding: spacing.x2, flexDirection: 'row', alignItems: 'center', gap: spacing.x1 },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  rowMain: { flex: 1, minWidth: 0, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, paddingLeft: spacing.x2 },
  rowText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  taskTime: { maxWidth: '38%', flexShrink: 1 },
  rowTitle: { fontWeight: '600' },
  pressed: { opacity: 0.66 },
  personRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, borderBottomWidth: 1, paddingVertical: spacing.x2 },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700' },
});
