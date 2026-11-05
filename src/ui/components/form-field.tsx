import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radius, spacing, typography } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

import { MinText } from './min-text';

export function FormField({ label, error, multiline, reserveErrorSpace = false, style, ...props }: TextInputProps & { label: string; error?: string | undefined; reserveErrorSpace?: boolean }) {
  const { colors } = useMinTheme();
  return (
    <View style={styles.group}>
      <MinText variant="metadata" style={styles.label}>{label}</MinText>
      <TextInput
        accessibilityLabel={label}
        accessibilityState={{ disabled: Boolean(props.editable === false) }}
        aria-invalid={Boolean(error)}
        multiline={multiline}
        placeholderTextColor={colors.secondary}
        {...props}
        style={[
          styles.input,
          multiline && styles.multiline,
          { backgroundColor: colors.raised, borderColor: error ? colors.error : colors.line, color: colors.text },
          style,
        ]}
      />
      {error || reserveErrorSpace ? (
        <MinText variant="caption" style={[styles.helper, { color: error ? colors.error : colors.secondary }]}>
          {error ?? ' '}
        </MinText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.x1 },
  label: { fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: spacing.x4, ...typography.body },
  multiline: { minHeight: 112, paddingTop: spacing.x3, textAlignVertical: 'top' },
  helper: { minHeight: 16 },
});
