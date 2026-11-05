import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';

import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  const { colors } = useMinTheme();
  return <View style={[styles.card, { backgroundColor: colors.raised, borderColor: colors.line }, style]}>{children}</View>;
}

export function PressableCard({ children, style, ...props }: PressableProps & { children: ReactNode }) {
  const { colors } = useMinTheme();
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.raised, borderColor: colors.line }, pressed && styles.pressed, style as never]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.x5,
  },
  pressed: { opacity: 0.82, transform: [{ translateY: 1 }] },
});
