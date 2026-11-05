import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import type { Person } from '@/domain/models';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

import { MinIcon } from './icon';
import { MinText } from './min-text';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('ca'))
    .join('');
}

export function PersonRow({ person, isMe, taskCount }: { person: Person; isMe: boolean; taskCount: number }) {
  const { colors } = useMinTheme();
  const avatarColor = person.initialsColor === 'lime' ? colors.now : person.initialsColor === 'peach' ? colors.peach : person.initialsColor === 'lilac' ? colors.lilac : colors.brand;
  const avatarInk = person.initialsColor === 'blue' || !person.initialsColor ? colors.brandInk : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/people/[id]', params: { id: person.id } })}
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.line }, pressed && styles.pressed]}>
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <MinText variant="metadata" style={{ color: avatarInk, fontWeight: '700' }}>{initials(person.name)}</MinText>
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <MinText style={styles.name}>{person.name}</MinText>
          {isMe ? <MinText variant="caption" style={[styles.me, { backgroundColor: colors.lilac }]}>Soc jo</MinText> : null}
        </View>
        <MinText variant="metadata" style={{ color: colors.secondary }}>
          {person.disambiguation ?? (taskCount === 1 ? '1 tasca' : `${taskCount} tasques`)}
        </MinText>
      </View>
      <MinIcon name="chevronRight" size={20} color={colors.secondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, borderBottomWidth: 1, paddingVertical: spacing.x2 },
  pressed: { opacity: 0.66 },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0, gap: spacing.x1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
  name: { flexShrink: 1, fontWeight: '600' },
  me: { paddingHorizontal: spacing.x2, paddingVertical: spacing.x1, borderRadius: radius.pill },
});
