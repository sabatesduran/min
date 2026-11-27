import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

import { MinText } from './min-text';

const pad = (value: number) => String(value).padStart(2, '0');

function toInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The native picker has no web implementation, so the browser's own date and time input is used. */
export function DateTimeField({ label, value, onChange }: { label: string; value: Date; onChange: (value: Date) => void }) {
  const { colors, scheme } = useMinTheme();
  return (
    <View style={styles.group}>
      <MinText variant="metadata" style={styles.label}>{label}</MinText>
      {createElement('input', {
        type: 'datetime-local',
        'aria-label': label,
        value: toInputValue(value),
        onChange: (event: { target: { value: string } }) => {
          const next = new Date(event.target.value);
          if (!Number.isNaN(next.getTime())) onChange(next);
        },
        style: {
          minHeight: 48,
          boxSizing: 'border-box',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: colors.line,
          borderRadius: radius.input,
          backgroundColor: colors.raised,
          color: colors.text,
          colorScheme: scheme,
          padding: `0 ${spacing.x3}px`,
          font: 'inherit',
          fontSize: 16,
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.x2 },
  label: { fontWeight: '600' },
});
