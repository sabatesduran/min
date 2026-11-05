import { useRef, useState } from 'react';
import { StyleSheet, Switch, useWindowDimensions, View, type ScrollViewInstance, type ViewInstance } from 'react-native';
import { router } from 'expo-router';

import type { Task } from '@/domain/models';
import { canEditDocument } from '@/domain/permissions';
import { currentTasks, eventStatus, filterTasks, formatDate, nextTaskGroup, personIdsForTask } from '@/domain/time';
import { useAppData } from '@/features/app-data/app-data-provider';
import { useNow } from '@/features/time/use-now';
import { Button } from '@/ui/components/button';
import { EmptyState } from '@/ui/components/empty-state';
import { FormField } from '@/ui/components/form-field';
import { AppHeader } from '@/ui/components/header';
import { MinText } from '@/ui/components/min-text';
import { ScheduleBlock } from '@/ui/components/schedule-row';
import { Screen } from '@/ui/components/screen';
import { SegmentedControl } from '@/ui/components/segmented-control';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

function groupByStart(tasks: Task[]): Task[][] {
  const groups = new Map<string, Task[]>();
  tasks.forEach((task) => {
    const key = task.kind === 'after' ? `after:${task.afterTaskId}` : task.startsAt;
    groups.set(key, [...(groups.get(key) ?? []), task]);
  });
  return [...groups.values()];
}

export default function AgendaScreen() {
  const { selected, documentPreferences, updateDocumentPreferences } = useAppData();
  const { colors } = useMinTheme();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.4;
  const scrollRef = useRef<ScrollViewInstance>(null);
  const targetRef = useRef<ViewInstance>(null);
  const [query, setQuery] = useState('');
  const [targetY, setTargetY] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const now = useNow(selected?.document);
  if (!selected || !documentPreferences) {
    return <Screen><EmptyState title="Cap agenda oberta" body="Obre un esdeveniment per consultar-ne el minut a minut." action="Ves als esdeveniments" onAction={() => router.replace('/events')} /></Screen>;
  }
  const document = selected.document;
  const filteredTasks = filterTasks(document, documentPreferences);
  const normalizedQuery = query.trim().toLocaleLowerCase('ca');
  const tasks = filteredTasks.filter((task) => {
    if (!normalizedQuery) return true;
    const people = [...personIdsForTask(document, task)]
      .map((id) => document.people.find((person) => person.id === id)?.name ?? '')
      .join(' ');
    const teams = task.teamIds.map((id) => document.teams.find((team) => team.id === id)?.name ?? '').join(' ');
    return `${task.title} ${task.place ?? ''} ${task.category ?? ''} ${task.notes ?? ''} ${people} ${teams}`
      .toLocaleLowerCase('ca')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .includes(normalizedQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  });
  const taskMap = new Map(document.tasks.map((task) => [task.id, task]));
  const rootTask = (task: Task): Task => {
    let current = task;
    const seen = new Set<string>();
    while (current.kind === 'after' && !seen.has(current.id)) {
      seen.add(current.id);
      current = taskMap.get(current.afterTaskId) ?? current;
      if (current.kind === 'after' && !taskMap.has(current.afterTaskId)) break;
    }
    return current;
  };
  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    const root = rootTask(task);
    const instant = root.kind === 'after' ? document.event.startsAt : root.startsAt;
    const day = formatDate(instant, document.event.timeZone);
    groups.set(day, [...(groups.get(day) ?? []), task]);
  }
  const editable = canEditDocument(selected);
  const status = eventStatus(document.event, now);
  const current = currentTasks(document, documentPreferences, now);
  const next = nextTaskGroup(document, documentPreferences, now);
  const targetTaskId = status === 'active'
    ? current[0]?.id ?? next[0]?.id
    : status === 'upcoming'
      ? filteredTasks[0]?.id
      : filteredTasks.at(-1)?.id;

  const changeFilter = async (filter: 'all' | 'mine') => {
    if (filter === 'mine' && !documentPreferences.mePersonId) {
      router.push('/active-selector?mode=person');
      return;
    }
    await updateDocumentPreferences({ filter });
  };
  const backToNow = () => {
    setQuery('');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (status === 'finished') {
        scrollRef.current?.scrollTo({ y: contentHeight, animated: true });
        return;
      }
      if (targetRef.current && scrollRef.current) {
        targetRef.current.measureLayout(
          scrollRef.current,
          (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing.x4), animated: true }),
          () => scrollRef.current?.scrollTo({ y: targetY, animated: true }),
        );
      } else {
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
      }
    }));
  };

  return (
    <Screen scrollRef={scrollRef} onContentSizeChange={(_width, height) => setContentHeight(height)}>
      <AppHeader />
      <View style={[styles.titleRow, largeText && styles.titleRowStacked]}>
        <View style={styles.titleText}>
          <MinText variant="hero">Agenda</MinText>
          <MinText style={{ color: colors.secondary }}>Tot el dia, en ordre i sense repetir informació.</MinText>
        </View>
        {editable ? <Button label="Prepara" accessibilityLabel="Edita l’agenda" icon="edit" variant="secondary" onPress={() => router.push('/editor')} style={styles.editAction} /> : null}
      </View>

      <View style={styles.filters}>
        <SegmentedControl
          label="Filtre de l’agenda"
          value={documentPreferences.filter}
          options={[{ value: 'all', label: 'Tot' }, { value: 'mine', label: 'Per a mi' }]}
          onChange={changeFilter}
        />
        {documentPreferences.filter === 'mine' ? (
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <MinText style={styles.strong}>Inclou tasques generals</MinText>
              <MinText variant="caption" style={{ color: colors.secondary }}>També mostra les activitats marcades per a tota la colla.</MinText>
            </View>
            <Switch accessibilityLabel="Inclou tasques generals" value={documentPreferences.includeCommon} onValueChange={(includeCommon) => updateDocumentPreferences({ includeCommon })} trackColor={{ false: colors.line, true: colors.brand }} thumbColor={colors.raised} />
          </View>
        ) : null}
        <FormField label="Cerca a l’agenda" value={query} onChangeText={setQuery} placeholder="Tasca, lloc, persona o equip" reserveErrorSpace={false} />
        {filteredTasks.length ? <Button label={status === 'finished' ? 'Ves al final' : 'Torna a ara'} icon="now" variant="quiet" onPress={backToNow} /> : null}
      </View>

      {!tasks.length ? (
        <EmptyState
          title={documentPreferences.filter === 'mine' ? 'No tens tasques assignades' : 'Agenda buida'}
          body={editable ? 'Afegeix la primera tasca des del mode de preparació.' : 'Aquest esdeveniment encara no té tasques.'}
          {...(editable ? { action: 'Afegeix una tasca', onAction: () => router.push('/tasks/edit/new') } : {})}
        />
      ) : [...groups.entries()].map(([day, dayTasks]) => (
        <View key={day} style={styles.day}>
          <MinText variant="label">{day}</MinText>
          <View style={styles.timeline}>
            {groupByStart(dayTasks).map((slot, index, slots) => (
              <View ref={slot.some((task) => task.id === targetTaskId) ? targetRef : undefined} key={slot.map((task) => task.id).join(':')} onLayout={slot.some((task) => task.id === targetTaskId) ? (event) => setTargetY(event.nativeEvent.layout.y) : undefined}>
                <ScheduleBlock tasks={slot} document={document} now={now} last={index === slots.length - 1} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x3 },
  titleRowStacked: { flexDirection: 'column', alignItems: 'stretch' },
  titleText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  editAction: { paddingHorizontal: spacing.x3 },
  filters: { gap: spacing.x2, marginTop: spacing.x5 },
  switchRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.x4 },
  switchText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  strong: { fontWeight: '600' },
  day: { gap: spacing.x3, marginTop: spacing.x8 },
  timeline: { marginTop: spacing.x1 },
});
