import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export function BottomActionBar({ children }: { children: ReactNode }) {
  const { colors } = useMinTheme();
  return <View style={[styles.bar, { backgroundColor: colors.canvas, borderTopColor: colors.line }]}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.x5,
    paddingTop: spacing.x3,
    paddingBottom: spacing.x2,
    gap: spacing.x2,
  },
});
