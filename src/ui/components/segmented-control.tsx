import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

import { MinText } from './min-text';

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  const { colors } = useMinTheme();
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale > 1.25 && options.length > 2;
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.container, stacked && styles.containerStacked, { backgroundColor: colors.surface }]}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={[styles.option, stacked && styles.optionStacked, selected && { backgroundColor: colors.text }]}>
            <MinText variant="metadata" numberOfLines={stacked ? 2 : 1} style={{ color: selected ? colors.canvas : colors.text, fontWeight: '600', textAlign: 'center' }}>
              {option.label}
            </MinText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: spacing.x1, borderRadius: radius.button },
  containerStacked: { flexWrap: 'wrap' },
  option: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.input, paddingHorizontal: spacing.x3 },
  optionStacked: { flexBasis: '48%', flexGrow: 1 },
});
