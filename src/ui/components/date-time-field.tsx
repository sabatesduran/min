import { useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

import { MinIcon } from './icon';
import { MinText } from './min-text';

export function DateTimeField({ label, value, onChange }: { label: string; value: Date; onChange: (value: Date) => void }) {
  const { colors } = useMinTheme();
  const { fontScale } = useWindowDimensions();
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const update = (_event: DateTimePickerEvent, next?: Date) => {
    if (Platform.OS !== 'ios') setPicker(null);
    if (next) onChange(next);
  };
  const dateLabel = new Intl.DateTimeFormat('ca-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(value);
  const timeLabel = new Intl.DateTimeFormat('ca-ES', { hour: '2-digit', minute: '2-digit', hour12: false }).format(value);
  return (
    <View style={styles.group}>
      <MinText variant="metadata" style={styles.label}>{label}</MinText>
      <View style={[styles.row, fontScale > 1.35 && styles.rowStacked]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label}, data, ${dateLabel}`} onPress={() => setPicker('date')} style={[styles.control, { backgroundColor: colors.raised, borderColor: colors.line }]}>
          <MinIcon name="calendar" size={19} color={colors.secondary} />
          <MinText variant="metadata" style={styles.controlText}>{dateLabel}</MinText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label}, hora, ${timeLabel}`} onPress={() => setPicker('time')} style={[styles.control, fontScale <= 1.35 && styles.timeControl, { backgroundColor: colors.raised, borderColor: colors.line }]}>
          <MinIcon name="time" size={19} color={colors.secondary} />
          <MinText variant="metadata">{timeLabel}</MinText>
        </Pressable>
      </View>
      {picker ? (
        <DateTimePicker
          value={value}
          mode={picker}
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={update}
          locale="ca-ES"
          is24Hour
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.x2 },
  label: { fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.x2 },
  rowStacked: { flexDirection: 'column' },
  control: { minHeight: 48, flex: 1, minWidth: 0, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: spacing.x3, flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
  timeControl: { flex: 0.62 },
  controlText: { flex: 1 },
});
