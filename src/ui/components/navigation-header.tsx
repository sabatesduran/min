import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { spacing } from '@/ui/tokens';

import { IconButton } from './button';
import { MinText } from './min-text';

export function NavigationHeader({
  title,
  mode = 'back',
  right,
  onBack,
}: {
  title: string;
  mode?: 'back' | 'close';
  right?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <View style={styles.header}>
      <IconButton icon={mode === 'close' ? 'close' : 'back'} label={mode === 'close' ? 'Tanca' : 'Enrere'} onPress={onBack ?? (() => router.back())} />
      <MinText variant="label" numberOfLines={2} style={styles.title}>{title}</MinText>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, marginBottom: spacing.x5 },
  title: { flex: 1, textAlign: 'center' },
  right: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
