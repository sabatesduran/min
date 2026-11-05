import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { radius, spacing, typography } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

import { MinIcon, type MinIconName } from './icon';
import { MinText } from './min-text';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet';

export function Button({
  label,
  icon,
  variant = 'primary',
  loading = false,
  disabled,
  accessibilityLabel,
  style,
  ...props
}: PressableProps & {
  label: string;
  icon?: MinIconName;
  variant?: ButtonVariant;
  loading?: boolean;
}) {
  const { colors } = useMinTheme();
  const background = variant === 'primary' ? colors.brand : variant === 'danger' ? colors.errorSoft : variant === 'quiet' ? 'transparent' : colors.surface;
  const foreground = variant === 'primary' ? colors.brandInk : variant === 'danger' ? colors.error : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: loading }}
      disabled={disabled || loading}
      {...props}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background, borderColor: variant === 'quiet' ? colors.line : background, opacity: disabled ? 0.55 : 1 },
        pressed && styles.pressed,
        style as never,
      ]}>
      {loading ? <ActivityIndicator color={foreground} /> : icon ? <MinIcon name={icon} size={20} color={foreground} /> : null}
      <MinText style={[styles.label, { color: foreground }]}>{label}</MinText>
    </Pressable>
  );
}

export function IconButton({ icon, label, ...props }: PressableProps & { icon: MinIconName; label: string }) {
  const { colors } = useMinTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...props}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.surface }, pressed && styles.pressed]}>
      <MinIcon name={icon} size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.x5,
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.x2,
  },
  pressed: { transform: [{ translateY: 1 }], opacity: 0.86 },
  label: { ...typography.body, fontWeight: '600' },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
