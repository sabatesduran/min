import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { createBackup, restoreBackup } from '@/db/backup';
import { parseBackup, type MinBackup } from '@/domain/backup';
import { useAppData } from '@/features/app-data/app-data-provider';
import { readBackupFile, shareBackupFile } from '@/features/sharing/backup-file';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function DataManagementScreen() {
  const db = useSQLiteContext();
  const { refresh } = useAppData();
  const { colors } = useMinTheme();
  const [pending, setPending] = useState<MinBackup | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const exportBackup = async () => {
    setWorking('export');
    try {
      await shareBackupFile(await createBackup(db));
    } catch (error) {
      Alert.alert('No s’ha pogut exportar', error instanceof Error ? error.message : 'Torna-ho a provar.');
    } finally { setWorking(null); }
  };

  const chooseBackup = async () => {
    setWorking('read');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets[0]?.uri) return;
      setPending(parseBackup(await readBackupFile(result.assets[0].uri)));
    } catch (error) {
      Alert.alert('Còpia incompatible', error instanceof Error ? error.message : 'No s’ha pogut validar el fitxer.');
    } finally { setWorking(null); }
  };

  const restore = (mode: 'merge' | 'replace') => {
    if (!pending) return;
    const destructive = mode === 'replace';
    Alert.alert(
      destructive ? 'Substitueix totes les dades?' : 'Combina les dades?',
      destructive
        ? 'S’eliminaran les dades locals actuals abans de restaurar la còpia.'
        : 'Els documents de la còpia s’afegiran i els que tinguin el mateix identificador s’actualitzaran.',
      [
        { text: 'Cancel·la', style: 'cancel' },
        { text: destructive ? 'Substitueix' : 'Combina', style: destructive ? 'destructive' : 'default', onPress: async () => {
          setWorking(mode);
          try {
            await restoreBackup(db, pending, mode);
            await refresh();
            setPending(null);
            Alert.alert('Dades restaurades', 'S’han recuperat els documents, revisions, preferències i marques personals. Revisa els avisos abans de tornar-los a activar.');
            router.replace('/events');
          } catch (error) {
            Alert.alert('No s’ha pogut restaurar', error instanceof Error ? error.message : 'No s’ha modificat la còpia local.');
          } finally { setWorking(null); }
        } },
      ],
    );
  };

  return (
    <Screen>
      <NavigationHeader title="Dades locals" />
      <MinText variant="hero">La teva còpia, a la teva mà</MinText>
      <MinText style={[styles.lead, { color: colors.secondary }]}>min no té compte ni servidor. Exporta una còpia per poder recuperar els esdeveniments si canvies o perds el dispositiu.</MinText>
      <View style={styles.section}>
        <MinText variant="label">Còpia de seguretat</MinText>
        <Button label="Exporta totes les dades" icon="download" loading={working === 'export'} onPress={exportBackup} />
        <Button label="Tria una còpia per restaurar" icon="fileUp" variant="secondary" loading={working === 'read'} onPress={chooseBackup} />
      </View>
      {pending ? (
        <Card style={styles.preview}>
          <MinText variant="label">Còpia preparada</MinText>
          <MinText>{pending.documents.length} {pending.documents.length === 1 ? 'esdeveniment' : 'esdeveniments'}</MinText>
          <MinText variant="metadata" style={{ color: colors.secondary }}>Exportada el {new Intl.DateTimeFormat('ca-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(pending.exportedAt))}</MinText>
          <Button label="Combina amb les dades actuals" variant="secondary" loading={working === 'merge'} onPress={() => restore('merge')} />
          <Button label="Substitueix les dades actuals" variant="danger" loading={working === 'replace'} onPress={() => restore('replace')} />
          <Button label="Cancel·la" variant="quiet" onPress={() => setPending(null)} />
        </Card>
      ) : null}
      <MinText variant="caption" style={{ color: colors.secondary }}>La còpia conté noms, horaris, notes i preferències. Desa-la en un lloc privat. Els identificadors interns dels avisos i les activitats en directe no s’exporten.</MinText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginTop: spacing.x2, marginBottom: spacing.x8 },
  section: { gap: spacing.x3, marginBottom: spacing.x8 },
  preview: { gap: spacing.x3, marginBottom: spacing.x5 },
});
