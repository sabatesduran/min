import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { applyImport, assessImport, getDocumentPreferences, type ImportAssessment } from '@/db/repository';
import { diffDocuments } from '@/domain/diff';
import { formatDateTime } from '@/domain/time';
import { useAppData } from '@/features/app-data/app-data-provider';
import { applyDocumentNotificationPreferences, preferencesValidForDocument } from '@/features/notifications/scheduler';
import { readDocumentFile } from '@/features/sharing/pick-document';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { LoadingView } from '@/ui/components/loading-view';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function ImportReviewScreen() {
  const params = useLocalSearchParams<{ uri?: string | string[] }>();
  const uri = Array.isArray(params.uri) ? params.uri[0] : params.uri;
  const db = useSQLiteContext();
  const { refresh, selectDocument } = useAppData();
  const { colors } = useMinTheme();
  const [assessment, setAssessment] = useState<ImportAssessment | null>(null);
  const [error, setError] = useState<string | null>(() => uri ? null : 'No s’ha rebut cap fitxer.');
  const [working, setWorking] = useState(false);
  useEffect(() => {
    if (!uri) return;
    readDocumentFile(uri).then((input) => assessImport(db, input)).then(setAssessment).catch((reason) => setError(reason instanceof Error ? reason.message : 'El fitxer no és vàlid.'));
  }, [db, uri]);
  const diff = useMemo(() => assessment && assessment.kind !== 'new' ? diffDocuments(assessment.current, assessment.incoming) : null, [assessment]);
  if (!assessment && !error) return <LoadingView />;
  if (error) return <Screen><NavigationHeader title="Importa i revisa" mode="close" /><MinText variant="hero">Fitxer incompatible</MinText><MinText style={[styles.lead, { color: colors.secondary }]}>{error}</MinText><Button label="Tanca" onPress={() => router.back()} /></Screen>;
  if (!assessment) return null;
  const document = assessment.incoming;
  const labels = { new: 'Esdeveniment nou', update: 'Revisió nova', duplicate: 'Ja la tens', conflict: 'Conflicte de revisió', older: 'Revisió antiga' } as const;
  const apply = async () => {
    setWorking(true);
    try {
      await applyImport(db, assessment);
      let reminderError: string | null = null;
      if (assessment.kind === 'new' || assessment.kind === 'update') {
        const storedPreferences = await getDocumentPreferences(db, document.documentId);
        const validPreferences = preferencesValidForDocument(document, storedPreferences);
        try {
          await applyDocumentNotificationPreferences(db, document, validPreferences);
        } catch (reason) {
          reminderError = reason instanceof Error ? reason.message : 'Cal revisar els avisos d’aquest esdeveniment.';
        }
      }
      await refresh();
      if (assessment.kind === 'new' || assessment.kind === 'update') await selectDocument(document.documentId);
      if (assessment.kind === 'conflict' || assessment.kind === 'older') {
        Alert.alert('Còpia conservada', 'S’ha desat com a històric sense substituir la revisió vigent.');
        await selectDocument(document.documentId);
        router.replace('/revisions');
      } else if (assessment.kind === 'new' && document.people.length) {
        router.replace({ pathname: '/active-selector', params: { mode: 'person', after: 'now', required: '1' } });
      } else {
        Alert.alert(
          'Còpia actualitzada',
          `${assessment.kind === 'new' ? 'L’esdeveniment ja és al dispositiu.' : 'La revisió nova ja està disponible.'}${reminderError ? `\n\nNo s’han pogut actualitzar els avisos: ${reminderError}` : ''}`,
        );
        router.replace('/(tabs)');
      }
    } catch (reason) { Alert.alert('No s’ha pogut importar', reason instanceof Error ? reason.message : 'Torna-ho a provar.'); }
    finally { setWorking(false); }
  };
  return (
    <Screen>
      <NavigationHeader title="Importa i revisa" mode="close" />
      <MinText variant="caption" style={{ color: assessment.kind === 'conflict' ? colors.error : colors.brand }}>{labels[assessment.kind]}</MinText>
      <MinText variant="hero" style={styles.title}>{document.event.title}</MinText>
      <MinText>{document.event.organization}</MinText>
      <MinText style={[styles.lead, { color: colors.secondary }]}>{formatDateTime(document.event.startsAt, document.event.timeZone)} fins a {formatDateTime(document.event.endsAt, document.event.timeZone)}</MinText>
      <Card style={styles.summary}>
        <MinText>Revisió {document.revision}</MinText><MinText>{document.people.length} persones</MinText><MinText>{document.tasks.length} tasques</MinText>
      </Card>
      {diff && assessment.kind !== 'duplicate' ? <View style={styles.changes}><MinText variant="label">Què canvia</MinText>{diff.eventChanged ? <MinText>Dades generals modificades</MinText> : null}{diff.tasksAdded.map((title) => <MinText key={`a-${title}`}>Afegida: {title}</MinText>)}{diff.tasksChanged.map((title) => <MinText key={`m-${title}`}>Modificada: {title}</MinText>)}{diff.tasksRemoved.map((title) => <MinText key={`r-${title}`}>Eliminada: {title}</MinText>)}</View> : null}
      {assessment.kind === 'duplicate' ? <Button label="Ja la tens, tanca" variant="secondary" onPress={() => router.back()} /> : <Button label={assessment.kind === 'new' ? 'Desa l’esdeveniment' : assessment.kind === 'update' ? 'Actualitza la meva còpia' : 'Conserva com a històric'} loading={working} onPress={apply} />}
      <Button label="Cancel·la" variant="quiet" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.x2 },
  lead: { marginTop: spacing.x2, marginBottom: spacing.x5 },
  summary: { gap: spacing.x2, marginBottom: spacing.x5 },
  changes: { gap: spacing.x2, marginBottom: spacing.x5 },
});
