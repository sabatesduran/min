import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useMinTheme } from '@/ui/use-min-theme';

export function LoadingView() {
  const { colors } = useMinTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]} accessibilityLabel="Carregant">
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
