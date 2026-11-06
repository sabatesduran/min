import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { getPersonalTaskState, savePersonalTaskState } from '@/db/repository';
import type { PersonalTaskState } from '@/domain/models';
import { canEditDocument } from '@/domain/permissions';
import { formatTaskTime, personIdsForTask } from '@/domain/time';
import { useAppData } from '@/features/app-data/app-data-provider';
import { Button, IconButton } from '@/ui/components/button';
import { EmptyState } from '@/ui/components/empty-state';
import { MinIcon } from '@/ui/components/icon';
import { MinText } from '@/ui/components/min-text';
import { Screen } from '@/ui/components/screen';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selected, duplicateDocument } = useAppData();
  const db = useSQLiteContext();
  const { colors } = useMinTheme();
  const [personal, setPersonal] = useState<PersonalTaskState | null>(null);
  const document = selected?.document;
  const task = document?.tasks.find((candidate) => candidate.id === id);

  useEffect(() => {
    if (document && task) getPersonalTaskState(db, document.documentId, task.id).then(setPersonal);
  }, [db, document, task]);

  if (!selected || !document || !task) {
    return <Screen><EmptyState title="La tasca ja no hi és" body="Pot haver desaparegut en una revisió nova." action="Torna a Ara" onAction={() => router.replace('/(tabs)')} /></Screen>;
  }

  const editable = canEditDocument(selected);
  const people = [...personIdsForTask(document, task)]
    .map((personId) => document.people.find((person) => person.id === personId))
    .filter(Boolean);
  const completedItems = personal ? task.checklist.filter((item) => personal.checkedItemIds.includes(item.id)).length : 0;

  const updatePersonal = async (next: PersonalTaskState) => {
    setPersonal(next);
    await savePersonalTaskState(db, next);
  };

  const edit = async () => {
    if (!editable) await duplicateDocument(document.documentId);
    router.push({ pathname: '/tasks/edit/[id]', params: { id: task.id, returnTo: 'editor' } });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton icon="close" label="Tanca" onPress={() => router.back()} />
        <Button
          label={editable ? 'Edita' : 'Duplica'}
          accessibilityLabel={editable ? 'Edita la tasca' : 'Duplica l’esdeveniment per editar la tasca'}
          icon={editable ? 'edit' : 'copy'}
          variant="secondary"
          onPress={edit}
          style={styles.headerAction}
        />
      </View>

      <View style={[styles.summary, { backgroundColor: colors.raised, borderColor: colors.line }]}>
        <View style={styles.kickerRow}>
          <View style={[styles.timeBadge, { backgroundColor: colors.lilac }]}>
            <MinIcon name="time" size={17} color={colors.brand} />
            <MinText variant="metadata" style={[styles.timeText, { color: colors.brand }]}>{formatTaskTime(task, document)}</MinText>
          </View>
          {task.category ? <MinText variant="caption" style={[styles.chip, { backgroundColor: colors.surface }]}>{task.category}</MinText> : null}
          {task.common ? <MinText variant="caption" style={[styles.chip, { backgroundColor: colors.now, color: colors.nowInk }]}>Tota la colla</MinText> : null}
        </View>
        <MinText variant="title">{task.title}</MinText>
        {task.place ? (
          <View style={styles.metaRow}>
            <MinIcon name="location" size={19} color={colors.secondary} />
            <MinText style={[styles.metaText, { color: colors.secondary }]}>{task.place}</MinText>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <MinText variant="label">Responsables</MinText>
          {people.length ? <MinText variant="caption" style={{ color: colors.secondary }}>{people.length === 1 ? '1 persona implicada' : `${people.length} persones implicades`}</MinText> : null}
        </View>
        <View style={[styles.sectionCard, { backgroundColor: colors.raised, borderColor: colors.line }]}>
          {people.length ? (
            <View style={styles.people}>
              {people.map((person) => person ? (
                <View key={person.id} style={[styles.personChip, { backgroundColor: colors.lilac }]}>
                  <MinIcon name="person" size={16} color={colors.brand} />
                  <MinText variant="metadata" style={styles.personName}>{person.name}</MinText>
                </View>
              ) : null)}
            </View>
          ) : <MinText style={{ color: colors.secondary }}>Encara per assignar</MinText>}

          {task.roles.length ? <View style={[styles.divider, { backgroundColor: colors.line }]} /> : null}
          {task.roles.map((role, index) => {
            const assignedPeople = role.personIds.map((personId) => document.people.find((person) => person.id === personId)?.name).filter(Boolean);
            const assignedTeams = role.teamIds.map((teamId) => document.teams.find((team) => team.id === teamId)?.name).filter(Boolean).map((name) => `${name} · equip`);
            return (
              <View key={role.id} style={[styles.role, index > 0 && styles.roleSpacing]}>
                <MinText variant="caption" style={{ color: colors.secondary }}>Funció</MinText>
                <MinText style={styles.roleName}>{role.name}</MinText>
                <MinText variant="metadata" style={{ color: colors.secondary }}>{[...assignedPeople, ...assignedTeams].join(', ') || 'Per assignar'}</MinText>
              </View>
            );
          })}
        </View>
      </View>

      {task.notes ? (
        <View style={styles.section}>
          <MinText variant="label">Instruccions</MinText>
          <View style={[styles.noteCard, { backgroundColor: colors.raised, borderColor: colors.line }]}>
            <MinIcon name="fileText" size={20} color={colors.secondary} />
            <MinText selectable style={styles.noteText}>{task.notes}</MinText>
          </View>
        </View>
      ) : null}

      {personal ? (
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <MinText variant="label">El teu seguiment</MinText>
            {task.checklist.length ? <MinText variant="caption" style={{ color: colors.secondary }}>{completedItems} de {task.checklist.length} passos</MinText> : null}
          </View>

          {task.checklist.length ? (
            <View style={[styles.checklist, { backgroundColor: colors.raised, borderColor: colors.line }]}>
              {task.checklist.map((item, index) => {
                const checked = personal.checkedItemIds.includes(item.id);
                const last = index === task.checklist.length - 1;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    onPress={() => updatePersonal({ ...personal, checkedItemIds: checked ? personal.checkedItemIds.filter((checkId) => checkId !== item.id) : [...personal.checkedItemIds, item.id] })}
                    style={({ pressed }) => [styles.checkRow, !last && styles.checkDivider, { borderBottomColor: colors.line }, pressed && styles.pressed]}>
                    <MinIcon name={checked ? 'checked' : 'unchecked'} size={24} color={checked ? colors.brand : colors.secondary} />
                    <MinText style={[styles.checkText, checked && { color: colors.secondary, textDecorationLine: 'line-through' }]}>{item.text}</MinText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: personal.done }}
            onPress={() => updatePersonal({ ...personal, done: !personal.done })}
            style={({ pressed }) => [styles.done, { backgroundColor: personal.done ? colors.successSoft : colors.surface, borderColor: personal.done ? colors.success : colors.line }, pressed && styles.pressed]}>
            <MinIcon name={personal.done ? 'complete' : 'incomplete'} size={26} color={personal.done ? colors.success : colors.secondary} />
            <View style={styles.doneText}>
              <MinText style={{ fontWeight: '600' }}>{personal.done ? 'Feta' : 'Marca-la com a feta'}</MinText>
              <MinText variant="caption" style={{ color: colors.secondary }}>Aquesta marca només es desa per a tu.</MinText>
            </View>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x3, marginBottom: spacing.x4 },
  headerAction: { paddingHorizontal: spacing.x4 },
  summary: { borderWidth: 1, borderRadius: radius.card, padding: spacing.x5, gap: spacing.x4 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.x2 },
  timeBadge: { minHeight: 32, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.x2, paddingHorizontal: spacing.x3, paddingVertical: spacing.x1, borderRadius: radius.pill },
  timeText: { flexShrink: 1, fontWeight: '600' },
  chip: { paddingHorizontal: spacing.x3, paddingVertical: spacing.x2, borderRadius: radius.pill, overflow: 'hidden' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
  metaText: { flex: 1, minWidth: 0 },
  section: { gap: spacing.x3, marginTop: spacing.x6 },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.x2 },
  sectionCard: { borderWidth: 1, borderRadius: radius.button, padding: spacing.x4 },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2 },
  personChip: { minHeight: 36, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.x2, paddingHorizontal: spacing.x3, paddingVertical: spacing.x2, borderRadius: radius.pill },
  personName: { flexShrink: 1 },
  divider: { height: 1, marginVertical: spacing.x4 },
  role: { gap: spacing.x1 },
  roleSpacing: { marginTop: spacing.x4 },
  roleName: { fontWeight: '600' },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x3, borderWidth: 1, borderRadius: radius.button, padding: spacing.x4 },
  noteText: { flex: 1, minWidth: 0 },
  checklist: { borderWidth: 1, borderRadius: radius.button, overflow: 'hidden' },
  checkRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, paddingHorizontal: spacing.x4, paddingVertical: spacing.x3 },
  checkDivider: { borderBottomWidth: 1 },
  checkText: { flex: 1, minWidth: 0 },
  done: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, padding: spacing.x4, borderRadius: radius.button, borderWidth: 1 },
  doneText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  pressed: { opacity: 0.7 },
});
