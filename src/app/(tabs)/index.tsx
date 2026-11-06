import { useCallback, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Temporal } from '@js-temporal/polyfill';

import type { SharedDocument, Task } from '@/domain/models';
import { canEditDocument } from '@/domain/permissions';
import { eventStatus, filterTasks, formatDate, formatDateTime, formatTaskTime, formatTime, isTaskCurrent, orderedTasks, personIdsForTask, taskStartMs } from '@/domain/time';
import { useAppData } from '@/features/app-data/app-data-provider';
import { useNow } from '@/features/time/use-now';
import { IconButton } from '@/ui/components/button';
import { EmptyState } from '@/ui/components/empty-state';
import { AppHeader } from '@/ui/components/header';
import { MinIcon } from '@/ui/components/icon';
import { MinText } from '@/ui/components/min-text';
import { ScheduleBlock } from '@/ui/components/schedule-row';
import { Screen } from '@/ui/components/screen';
import { SegmentedControl } from '@/ui/components/segmented-control';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

type TimelineItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'slot'; key: string; tasks: Task[]; anchor?: boolean }
  | { kind: 'current'; key: string; anchor: true }
  | { kind: 'finished'; key: string; anchor: true };

function groupByStart(tasks: Task[]): Task[][] {
  const groups = new Map<string, Task[]>();
  tasks.forEach((task) => {
    const key = task.kind === 'after' ? `after:${task.afterTaskId}` : task.startsAt;
    groups.set(key, [...(groups.get(key) ?? []), task]);
  });
  return [...groups.values()];
}

function rootTask(task: Task, taskMap: Map<string, Task>): Task {
  let current = task;
  const seen = new Set<string>();
  while (current.kind === 'after' && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = taskMap.get(current.afterTaskId);
    if (!parent) break;
    current = parent;
  }
  return current;
}

function dayKey(instant: string, timeZone: string): string {
  return Temporal.Instant.from(instant).toZonedDateTimeISO(timeZone).toPlainDate().toString();
}

function taskFallsAfterNow(task: Task, taskMap: Map<string, Task>, now: number): boolean {
  const root = rootTask(task, taskMap);
  if (task.kind === 'after' && isTaskCurrent(root, now)) return true;
  const start = taskStartMs(root);
  return start !== null && start > now;
}

function buildTimelineItems(document: SharedDocument, preferences: NonNullable<ReturnType<typeof useAppData>['documentPreferences']>, now: number): { items: TimelineItem[]; current: Task[] } {
  const status = eventStatus(document.event, now);
  const allTasks = orderedTasks(document.tasks);
  const current = allTasks.filter((task) => isTaskCurrent(task, now));
  const currentIds = new Set(current.map((task) => task.id));
  const filtered = filterTasks(document, preferences).filter((task) => !currentIds.has(task.id));
  const taskMap = new Map(document.tasks.map((task) => [task.id, task]));
  const currentInstant = new Date(now).toISOString();
  const currentDay = dayKey(currentInstant, document.event.timeZone);
  const days = new Map<string, { labelInstant: string; tasks: Task[] }>();

  for (const task of filtered) {
    const root = rootTask(task, taskMap);
    const instant = root.kind === 'after' ? document.event.startsAt : root.startsAt;
    const key = dayKey(instant, document.event.timeZone);
    const day = days.get(key) ?? { labelInstant: instant, tasks: [] };
    day.tasks.push(task);
    days.set(key, day);
  }
  if (status === 'active' && !days.has(currentDay)) days.set(currentDay, { labelInstant: currentInstant, tasks: [] });

  const items: TimelineItem[] = [];
  for (const [key, day] of [...days.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    items.push({ kind: 'day', key: `day:${key}`, label: formatDate(day.labelInstant, document.event.timeZone) });
    const slots = groupByStart(day.tasks);
    if (status === 'active' && key === currentDay) {
      const past = slots.filter((slot) => !slot.every((task) => taskFallsAfterNow(task, taskMap, now)));
      const future = slots.filter((slot) => slot.every((task) => taskFallsAfterNow(task, taskMap, now)));
      past.forEach((slot) => items.push({ kind: 'slot', key: `slot:${slot.map((task) => task.id).join(':')}`, tasks: slot }));
      items.push({ kind: 'current', key: `current:${preferences.filter}:${preferences.includeCommon}`, anchor: true });
      future.forEach((slot) => items.push({ kind: 'slot', key: `slot:${slot.map((task) => task.id).join(':')}`, tasks: slot }));
    } else {
      slots.forEach((slot) => items.push({ kind: 'slot', key: `slot:${slot.map((task) => task.id).join(':')}`, tasks: slot }));
    }
  }

  if (status === 'upcoming') {
    const first = items.find((item): item is Extract<TimelineItem, { kind: 'slot' }> => item.kind === 'slot');
    if (first) first.anchor = true;
  }
  if (status === 'finished') items.push({ kind: 'finished', key: `finished:${preferences.filter}`, anchor: true });
  return { items, current };
}

export default function NowScreen() {
  const { loading, selected, documentPreferences, updateDocumentPreferences } = useAppData();
  const { colors } = useMinTheme();
  const now = useNow(selected?.document);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const anchorYRef = useRef<number | null>(null);
  const anchorSignatureRef = useRef<string | null>(null);
  const anchorPendingRef = useRef(true);
  const anchorAnimatedRef = useRef(false);
  const scrollToAnchor = useCallback(() => {
    if (!anchorPendingRef.current || anchorYRef.current === null) return;
    const y = anchorYRef.current;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing.x2), animated: anchorAnimatedRef.current });
      anchorPendingRef.current = false;
    });
  }, []);

  const requestAnchor = useCallback((animated: boolean, resetPosition = false) => {
    anchorPendingRef.current = true;
    anchorAnimatedRef.current = animated;
    if (resetPosition) anchorYRef.current = null;
    scrollToAnchor();
  }, [scrollToAnchor]);

  useFocusEffect(useCallback(() => {
    requestAnchor(false);
  }, [requestAnchor]));

  if (loading) return null;
  if (!selected || !documentPreferences) {
    return (
      <Screen>
        <EmptyState title="Cap esdeveniment obert" body="Obre un esdeveniment per veure què toca ara." action="Ves als esdeveniments" onAction={() => router.replace('/events')} />
      </Screen>
    );
  }

  const document = selected.document;
  const status = eventStatus(document.event, now);
  const me = document.people.find((person) => person.id === documentPreferences.mePersonId);
  const editable = canEditDocument(selected);
  const { items, current } = buildTimelineItems(document, documentPreferences, now);
  const anchorSignature = `${document.documentId}:${document.revision}:${status}:${documentPreferences.filter}:${documentPreferences.includeCommon}`;
  const hasSlots = items.some((item) => item.kind === 'slot');
  const title = status === 'upcoming' ? 'Tot a punt' : status === 'active' ? 'Ara' : 'Jornada completada';
  const subtitle = status === 'upcoming'
    ? `Comença ${formatDateTime(document.event.startsAt, document.event.timeZone)}`
    : status === 'active'
      ? `${formatTime(new Date(now).toISOString(), document.event.timeZone)} · ${formatDate(new Date(now).toISOString(), document.event.timeZone)}`
      : `Va acabar ${formatDateTime(document.event.endsAt, document.event.timeZone)}`;

  const changeFilter = async (filter: 'all' | 'mine') => {
    if (filter === 'mine' && !me) {
      router.push('/active-selector?mode=person&enable=personal');
      return;
    }
    requestAnchor(false, true);
    await updateDocumentPreferences({ filter });
  };

  const registerAnchor = (signature: string, y: number) => {
    if (anchorSignatureRef.current !== signature) {
      anchorSignatureRef.current = signature;
      anchorPendingRef.current = true;
      anchorAnimatedRef.current = false;
    }
    anchorYRef.current = y;
    scrollToAnchor();
  };

  return (
    <Screen scroll={false} contentContainerStyle={styles.screen}>
      <AppHeader />
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <MinText variant="hero">{title}</MinText>
          <MinText variant="metadata" style={{ color: colors.secondary }}>{subtitle}</MinText>
        </View>
        <View style={styles.headingActions}>
          {editable ? <IconButton icon="edit" label="Prepara l’agenda" onPress={() => router.push('/editor')} /> : null}
          <IconButton icon="settings" label="Configura la meva vista" onPress={() => router.push('/now-preferences')} />
        </View>
      </View>

      <View style={styles.filterBlock}>
        <SegmentedControl
          label="Tasques de l’agenda"
          value={documentPreferences.filter}
          options={[{ value: 'all', label: 'Totes' }, { value: 'mine', label: 'Les meves' }]}
          onChange={changeFilter}
        />
        {documentPreferences.filter === 'mine' ? (
          <MinText variant="caption" style={{ color: colors.secondary }}>
            {documentPreferences.includeCommon ? 'Les teves tasques i les generals.' : 'Només les teves tasques.'} Ara mateix sempre es mostra complet.
          </MinText>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.timelineScroll}
        contentContainerStyle={styles.timelineContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToAnchor}>
        {!hasSlots && status === 'upcoming' ? (
          <EmptyState
            title={documentPreferences.filter === 'mine' ? 'No tens tasques assignades' : 'Agenda buida'}
            body={editable ? 'Afegeix la primera tasca des del mode de preparació.' : 'Aquest esdeveniment encara no té tasques.'}
            {...(editable ? { action: 'Afegeix una tasca', onAction: () => router.push('/tasks/edit/new') } : {})}
          />
        ) : null}

        {items.map((item, index) => {
          const anchored = 'anchor' in item && item.anchor;
          const anchorProps = anchored ? { onLayout: (event: { nativeEvent: { layout: { y: number } } }) => registerAnchor(anchorSignature, event.nativeEvent.layout.y) } : {};
          const itemKey = anchored ? `${anchorSignature}:${item.key}` : item.key;
          if (item.kind === 'day') {
            return <View key={item.key} style={styles.dayHeading}><MinText variant="label">{item.label}</MinText></View>;
          }
          if (item.kind === 'current') {
            return <View key={itemKey} {...anchorProps}><CurrentMoment tasks={current} document={document} now={now} /></View>;
          }
          if (item.kind === 'finished') {
            return <View key={itemKey} {...anchorProps}><FinishedMoment document={document} /></View>;
          }
          const next = items[index + 1];
          const last = !next || next.kind === 'day' || next.kind === 'finished';
          return (
            <View key={itemKey} {...anchorProps}>
              <ScheduleBlock tasks={item.tasks} document={document} now={now} last={last} />
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

function CurrentMoment({ tasks, document, now }: { tasks: Task[]; document: SharedDocument; now: number }) {
  const { colors } = useMinTheme();
  const nowInstant = new Date(now).toISOString();
  return (
    <View style={styles.moment}>
      <View style={styles.momentRail} importantForAccessibility="no-hide-descendants">
        <View style={[styles.momentDot, { backgroundColor: colors.brand, borderColor: colors.brand }]} />
        <View style={[styles.momentLine, { backgroundColor: colors.line }]} />
      </View>
      <View style={styles.momentContent}>
        <View style={styles.momentHeader}>
          <MinText variant="time" style={{ color: colors.brand }}>{formatTime(nowInstant, document.event.timeZone)}</MinText>
          <MinText variant="caption" style={[styles.nowBadge, { backgroundColor: colors.brand, color: colors.brandInk }]}>Ara mateix</MinText>
        </View>
        {tasks.length ? (
          <View style={[styles.currentCard, { backgroundColor: colors.lilac, borderColor: colors.brand }]}>
            {tasks.map((task, index) => {
              const people = [...personIdsForTask(document, task)]
                .map((id) => document.people.find((person) => person.id === id)?.name)
                .filter(Boolean)
                .join(', ');
              const secondary = [task.place, people || (task.common ? 'Tota la colla' : 'Per assignar')].filter(Boolean).join(' · ');
              return (
                <Pressable
                  key={task.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatTaskTime(task, document)}, ${task.title}${secondary ? `, ${secondary}` : ''}`}
                  accessibilityHint="Obre els detalls de la tasca"
                  onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: task.id } })}
                  style={({ pressed }) => [
                    styles.currentTask,
                    index < tasks.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line },
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.currentTaskText}>
                    <MinText variant="caption" style={{ color: colors.brand }}>{formatTaskTime(task, document)}</MinText>
                    <MinText style={styles.strong}>{task.title}</MinText>
                    {secondary ? <MinText variant="metadata" style={{ color: colors.secondary }}>{secondary}</MinText> : null}
                  </View>
                  <MinIcon name="chevronRight" size={18} color={colors.secondary} />
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={[styles.pauseCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <MinText style={styles.strong}>Pausa prevista</MinText>
            <MinText variant="metadata" style={{ color: colors.secondary }}>No hi ha cap activitat prevista ara mateix.</MinText>
          </View>
        )}
      </View>
    </View>
  );
}

function FinishedMoment({ document }: { document: SharedDocument }) {
  const { colors } = useMinTheme();
  return (
    <View style={styles.moment}>
      <View style={styles.momentRail} importantForAccessibility="no-hide-descendants">
        <View style={[styles.momentDot, { backgroundColor: colors.canvas, borderColor: colors.secondary }]} />
      </View>
      <View style={styles.momentContent}>
        <MinText variant="time">{formatTime(document.event.endsAt, document.event.timeZone)}</MinText>
        <View style={[styles.pauseCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <MinText style={styles.strong}>Fi de l’esdeveniment</MinText>
          <MinText variant="metadata" style={{ color: colors.secondary }}>La jornada ha quedat completada.</MinText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
  headingText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  headingActions: { flexDirection: 'row', gap: spacing.x1 },
  filterBlock: { gap: spacing.x2, marginTop: spacing.x4, marginBottom: spacing.x3 },
  timelineScroll: { flex: 1 },
  timelineContent: { paddingBottom: spacing.x10 },
  dayHeading: { paddingTop: spacing.x5, paddingBottom: spacing.x3 },
  moment: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.x3 },
  momentRail: { width: 16, alignItems: 'center' },
  momentDot: { width: 12, height: 12, marginTop: 8, borderRadius: radius.pill, borderWidth: 2 },
  momentLine: { width: 2, flex: 1, marginTop: spacing.x1 },
  momentContent: { flex: 1, minWidth: 0, gap: spacing.x2, paddingBottom: spacing.x5 },
  momentHeader: { minHeight: 26, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.x2 },
  nowBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.x2, paddingVertical: 2, overflow: 'hidden' },
  currentCard: { borderWidth: 1, borderRadius: radius.button, overflow: 'hidden' },
  currentTask: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, paddingHorizontal: spacing.x4, paddingVertical: spacing.x3 },
  currentTaskText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  pauseCard: { borderWidth: 1, borderRadius: radius.button, gap: spacing.x1, padding: spacing.x4 },
  strong: { fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
