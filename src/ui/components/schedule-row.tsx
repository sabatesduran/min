import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import type { SharedDocument, Task } from '@/domain/models';
import { formatTaskTime, formatTime, isTaskCurrent, personIdsForTask } from '@/domain/time';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

import { MinIcon } from './icon';
import { MinText } from './min-text';

export function ScheduleBlock({
  tasks,
  document,
  now,
  last = false,
}: {
  tasks: Task[];
  document: SharedDocument;
  now: number;
  last?: boolean;
}) {
  const { colors } = useMinTheme();
  const first = tasks[0];
  if (!first) return null;

  const simultaneous = tasks.length > 1;
  const current = tasks.some((task) => isTaskCurrent(task, now));
  const startLabel = first.kind === 'after' ? 'Després' : formatTime(first.startsAt, document.event.timeZone);
  const endLabel = !simultaneous && first.kind === 'interval'
    ? `fins a ${formatTime(first.endsAt, document.event.timeZone)}`
    : null;

  return (
    <View style={styles.block}>
      <View style={styles.rail} importantForAccessibility="no-hide-descendants">
        <View style={[styles.dot, { backgroundColor: current ? colors.brand : colors.canvas, borderColor: current ? colors.brand : colors.secondary }]} />
        {!last ? <View style={[styles.line, { backgroundColor: colors.line }]} /> : null}
      </View>

      <View style={styles.content}>
        <View style={styles.timeHeader}>
          <MinText variant="time" style={{ color: current ? colors.brand : colors.text }}>{startLabel}</MinText>
          {endLabel ? <MinText variant="metadata" style={{ color: colors.secondary }}>{endLabel}</MinText> : null}
          {simultaneous ? (
            <MinText variant="caption" style={[styles.badge, { backgroundColor: colors.surface, color: colors.secondary }]}>
              {tasks.length} alhora
            </MinText>
          ) : null}
          {current ? <MinText variant="caption" style={[styles.badge, { backgroundColor: colors.brand, color: colors.brandInk }]}>Ara</MinText> : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.raised, borderColor: colors.line }]}>
          {tasks.map((task, index) => {
            const taskCurrent = isTaskCurrent(task, now);
            const people = [...personIdsForTask(document, task)]
              .map((id) => document.people.find((person) => person.id === id)?.name)
              .filter(Boolean)
              .join(', ');
            const secondary = [task.place, people || (task.common ? 'Tota la colla' : 'Per assignar')].filter(Boolean).join(' · ');
            const timing = simultaneous
              ? task.kind === 'interval'
                ? `Fins a ${formatTime(task.endsAt, document.event.timeZone)}`
                : task.kind === 'point'
                  ? 'Moment puntual'
                  : formatTaskTime(task, document)
              : task.kind === 'after'
                ? formatTaskTime(task, document)
                : null;
            const eyebrow = [task.category, timing].filter(Boolean).join(' · ');
            const isLast = index === tasks.length - 1;

            return (
              <Pressable
                key={task.id}
                accessibilityRole="button"
                accessibilityLabel={`${formatTaskTime(task, document)}, ${task.title}${secondary ? `, ${secondary}` : ''}`}
                accessibilityHint="Obre els detalls de la tasca"
                onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: task.id } })}
                style={({ pressed }) => [
                  styles.task,
                  !isLast && styles.taskDivider,
                  { borderBottomColor: colors.line },
                  taskCurrent && { backgroundColor: colors.lilac },
                  pressed && styles.pressed,
                ]}>
                <View style={styles.taskBody}>
                  {eyebrow ? <MinText variant="caption" style={{ color: taskCurrent ? colors.brand : colors.secondary }}>{eyebrow}</MinText> : null}
                  <MinText style={styles.title}>{task.title}</MinText>
                  {secondary ? <MinText variant="metadata" style={{ color: colors.secondary }}>{secondary}</MinText> : null}
                </View>
                <MinIcon name="chevronRight" size={18} color={colors.secondary} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.x3 },
  rail: { width: 16, alignItems: 'center' },
  dot: { width: 10, height: 10, marginTop: 8, borderRadius: radius.pill, borderWidth: 2 },
  line: { width: 2, flex: 1, marginTop: spacing.x1 },
  content: { flex: 1, minWidth: 0, gap: spacing.x2, paddingBottom: spacing.x5 },
  timeHeader: { minHeight: 26, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.x2 },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.x2, paddingVertical: 2, overflow: 'hidden' },
  card: { borderWidth: 1, borderRadius: radius.button, overflow: 'hidden' },
  task: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, paddingHorizontal: spacing.x4, paddingVertical: spacing.x3 },
  taskDivider: { borderBottomWidth: 1 },
  taskBody: { flex: 1, minWidth: 0, gap: spacing.x1 },
  title: { fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
