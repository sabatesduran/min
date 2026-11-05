import { StyleSheet, View } from 'react-native';

import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

import { Button } from './button';
import { MinIcon, type MinIconName } from './icon';
import { MinText } from './min-text';

export function EmptyState({
  icon = 'calendar',
  title,
  body,
  action,
  onAction,
}: {
  icon?: MinIconName;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  const { colors } = useMinTheme();
  return (
    <View style={styles.container}>
      <MinIcon name={icon} size={34} color={colors.brand} />
      <MinText variant="title" style={styles.center}>{title}</MinText>
      <MinText style={[styles.center, { color: colors.secondary }]}>{body}</MinText>
      {action && onAction ? <Button label={action} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.x4, paddingVertical: spacing.x10, paddingHorizontal: spacing.x6 },
  center: { textAlign: 'center' },
});
