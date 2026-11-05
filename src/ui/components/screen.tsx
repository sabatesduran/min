import type { ReactNode, RefObject } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ScrollViewInstance, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export function Screen({ children, scroll = true, footer, contentContainerStyle, scrollRef, ...props }: ScrollViewProps & { children: ReactNode; scroll?: boolean; footer?: ReactNode; scrollRef?: RefObject<ScrollViewInstance | null> }) {
  const { colors } = useMinTheme();
  const content = <View style={[styles.content, contentContainerStyle]}>{children}</View>;
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.canvas }]}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            {...props}>
            {content}
          </ScrollView>
        ) : (
          content
        )}
        {footer ? <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.canvas }}>{footer}</SafeAreaView> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    ...layout.screen,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingTop: spacing.x3,
    paddingBottom: spacing.x10,
  },
});
