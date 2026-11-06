import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import type { SharedDocument, Task } from '@/domain/models';
import { formatTaskTime, personIdsForTask } from '@/domain/time';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

import { MinIcon } from './icon';
import { MinText } from './min-text';

export function TaskCard({ task, document, tone = 'plain', badge }: { task: Task; document: SharedDocument; tone?: 'now' | 'next' | 'plain'; badge?: string }) {
  const { colors } = useMinTheme();
  const backgroundColor = tone === 'now' ? colors.brand : tone === 'next' ? colors.now : colors.raised;
  const foreground = tone === 'now' ? colors.brandInk : tone === 'next' ? colors.nowInk : colors.text;
  const secondary = tone === 'plain' ? colors.secondary : foreground;
  const people = [...personIdsForTask(document, task)]
    .map((id) => document.people.find((person) => person.id === id)?.name)
    .filter(Boolean)
    .join(', ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatTaskTime(task, document)}, ${task.title}${badge ? `, ${badge}` : ''}${task.place ? `, Lloc: ${task.place}` : ''}, Responsables: ${people || 'Per assignar'}${task.common ? ', Tota la colla' : ''}`}
      accessibilityHint="Obre els detalls i la checklist de la tasca"
      onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: task.id } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor, borderColor: tone === 'plain' ? colors.line : backgroundColor },
        pressed && styles.pressed,
      ]}>
      <View style={styles.timeRow}>
        <MinText variant="time" style={{ color: foreground }}>{formatTaskTime(task, document)}</MinText>
        {badge || task.common ? (
          <View style={styles.tags}>
            {badge ? <MinText variant="caption" style={[styles.tag, { color: foreground, borderColor: foreground }]}>{badge}</MinText> : null}
            {task.common ? <MinText variant="caption" style={[styles.tag, { color: foreground, borderColor: foreground }]}>Tota la colla</MinText> : null}
          </View>
        ) : null}
      </View>
      <MinText variant={tone === 'now' ? 'title' : 'label'} style={{ color: foreground }}>{task.title}</MinText>
      {task.place ? (
        <View style={styles.metaRow}>
          <MinIcon name="location" size={17} color={secondary} />
          <MinText variant="metadata" style={{ color: secondary, flex: 1 }}>{task.place}</MinText>
        </View>
      ) : null}
      <View style={styles.metaRow}>
        <MinIcon name="people" size={17} color={secondary} />
        <MinText variant="metadata" style={{ color: secondary, flex: 1 }}>{people || 'Per assignar'}</MinText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, borderWidth: 1, padding: spacing.x5, gap: spacing.x3 },
  pressed: { opacity: 0.84, transform: [{ translateY: 1 }] },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x3 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.x1 },
  tag: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.x2, paddingVertical: spacing.x1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
});
