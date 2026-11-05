import { useState } from 'react';
import { Alert, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';

import { useAppData } from '@/features/app-data/app-data-provider';
import { ca } from '@/locales/ca';
import { pickDocumentUri } from '@/features/sharing/pick-document';
import { Button, IconButton } from '@/ui/components/button';
import { MinText } from '@/ui/components/min-text';
import { Screen } from '@/ui/components/screen';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function WelcomeScreen() {
  const { openDemo } = useAppData();
  const { colors } = useMinTheme();
  const { fontScale } = useWindowDimensions();
  const [openingDemo, setOpeningDemo] = useState(false);
  const importDocument = async () => {
    const uri = await pickDocumentUri();
    if (uri) router.push({ pathname: '/import-review', params: { uri } });
  };
  const tryDemo = async () => {
    setOpeningDemo(true);
    try {
      await openDemo();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('No s’ha pogut obrir la demo', error instanceof Error ? error.message : 'Torna-ho a provar.');
      setOpeningDemo(false);
    }
  };
  return (
    <Screen scroll={fontScale > 1.3} contentContainerStyle={styles.content}>
      <View style={styles.toolbar}><IconButton icon="settings" label="Configuració" onPress={() => router.push('/settings')} /></View>
      <View style={styles.brandBlock}>
        <Image source={require('../../assets/images/logo-transparent.png')} resizeMode="contain" style={styles.logo} accessibilityLabel="min" />
        <MinText variant="display">El minut a minut de la colla, sempre a mà.</MinText>
        <MinText style={{ color: colors.secondary }}>Sap què toca, on i amb qui, fins i tot sense cobertura.</MinText>
      </View>
      <View style={styles.actions}>
        <Button label="Crea un esdeveniment" icon="add" onPress={() => router.push('/create-event')} />
        <Button label="Importa un horari" icon="folderOpen" variant="secondary" onPress={importDocument} />
        <Button label="Prova la demo" icon="now" variant="quiet" loading={openingDemo} onPress={tryDemo} />
        <MinText variant="caption" style={[styles.demoNote, { color: colors.secondary }]}>La demo és temporal i no apareix als teus esdeveniments.</MinText>
      </View>
      <MinText variant="metadata" style={[styles.foot, { color: colors.secondary }]}>{ca.welcome.foot}</MinText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', paddingVertical: spacing.x8 },
  toolbar: { flexDirection: 'row', justifyContent: 'flex-start' },
  brandBlock: { gap: spacing.x4 },
  logo: { width: 176, height: 96, alignSelf: 'flex-start' },
  actions: { gap: spacing.x3 },
  demoNote: { textAlign: 'center' },
  foot: { textAlign: 'center' },
});
