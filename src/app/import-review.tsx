import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { applyImport, assessImport, getDocumentPreferences, type ImportAssessment } from '@/db/repository';
import { diffDocuments } from '@/domain/diff';
import { formatDateTime } from '@/domain/time';
import { useAppData } from '@/features/app-data/app-data-provider';
import { applyDocumentNotificationPreferences, preferencesValidForDocument } from '@/features/notifications/scheduler';
import { DocumentFileError, readDocumentFile } from '@/features/sharing/pick-document';
import { BottomActionBar } from '@/ui/components/bottom-action-bar';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { LoadingView } from '@/ui/components/loading-view';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { colorForAccent } from '@/ui/accent';
import { layout, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

type ImportError = { title: string; message: string };

function importError(reason: unknown): ImportError {
  if (reason instanceof DocumentFileError) {
    const title = reason.code === 'unreadable' ? 'No s’ha pogut obrir' : reason.code === 'too-large' ? 'Fitxer massa gran' : 'Fitxer incompatible';
    return { title, message: reason.message };
  }
  return { title: 'Fitxer incompatible', message: reason instanceof Error ? reason.message : 'El fitxer no és vàlid.' };
}

export default function ImportReviewScreen() {
  const params = useLocalSearchParams<{ uri?: string | string[] }>();
  const uri = Array.isArray(params.uri) ? params.uri[0] : params.uri;
  const db = useSQLiteContext();
  const { refresh, selectDocument } = useAppData();
  const { colors } = useMinTheme();
  const { fontScale } = useWindowDimensions();
  const [assessment, setAssessment] = useState<ImportAssessment | null>(null);
  const [error, setError] = useState<ImportError | null>(() => uri ? null : { title: 'No s’ha pogut obrir', message: 'No s’ha rebut cap fitxer.' });
  const [working, setWorking] = useState(false);
  useEffect(() => {
    if (!uri) return;
    readDocumentFile(uri).then((input) => assessImport(db, input)).then(setAssessment).catch((reason) => setError(importError(reason)));
  }, [db, uri]);
  const diff = useMemo(() => assessment && assessment.kind !== 'new' ? diffDocuments(assessment.current, assessment.incoming) : null, [assessment]);
  if (!assessment && !error) return <LoadingView />;
  if (error) return <Screen><NavigationHeader title="Importa i revisa" mode="close" /><MinText variant="hero">{error.title}</MinText><MinText style={[styles.lead, { color: colors.secondary }]}>{error.message}</MinText><Button label="Tanca" variant="secondary" onPress={() => router.back()} /></Screen>;
  if (!assessment) return null;
  const document = assessment.incoming;
  const eventAccent = colorForAccent(document.event.accent, colors);
  const labels = { new: 'Esdeveniment nou', update: 'Revisió nova', duplicate: 'Ja la tens', conflict: 'Conflicte de revisió', older: 'Revisió antiga' } as const;
  const openExisting = async () => {
    if (assessment.kind !== 'duplicate') return;
    setWorking(true);
    try {
      await selectDocument(assessment.current.documentId);
      router.replace('/(tabs)');
    } finally {
      setWorking(false);
    }
  };
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
  const primaryLabel = assessment.kind === 'new' ? 'Desa' : assessment.kind === 'update' ? 'Actualitza' : assessment.kind === 'duplicate' ? 'Obre’l' : 'Conserva';
  const primaryAccessibilityLabel = assessment.kind === 'new' ? 'Desa l’esdeveniment' : assessment.kind === 'update' ? 'Actualitza la meva còpia' : assessment.kind === 'duplicate' ? 'Obre l’esdeveniment desat' : 'Conserva com a històric';
  const secondaryLabel = assessment.kind === 'new' ? 'No el desis' : assessment.kind === 'duplicate' ? 'Tanca' : 'Cancel·la';
  const footer = (
    <BottomActionBar>
      <View style={[styles.actions, fontScale > 1.3 && styles.actionsStacked]}>
        <Button
          label={primaryLabel}
          accessibilityLabel={primaryAccessibilityLabel}
          icon={assessment.kind === 'duplicate' ? 'events' : assessment.kind === 'conflict' || assessment.kind === 'older' ? 'fileText' : 'check'}
          loading={working}
          onPress={assessment.kind === 'duplicate' ? openExisting : apply}
          style={styles.primaryAction}
        />
        <Button label={secondaryLabel} variant="secondary" disabled={working} onPress={() => router.back()} style={styles.secondaryAction} />
      </View>
    </BottomActionBar>
  );
  return (
    <Screen footer={footer}>
      <NavigationHeader title="Importa i revisa" mode="close" />
      <MinText variant="caption" style={{ color: assessment.kind === 'conflict' ? colors.error : colors.brand }}>{labels[assessment.kind]}</MinText>
      <Card style={[styles.eventCard, { borderLeftColor: eventAccent }]}>
        <MinText variant="metadata" style={{ color: colors.secondary }}>{document.event.organization}</MinText>
        <MinText variant="hero" style={styles.title}>{document.event.title}</MinText>
        <MinText style={[styles.lead, { color: colors.secondary }]}>{formatDateTime(document.event.startsAt, document.event.timeZone)} fins a {formatDateTime(document.event.endsAt, document.event.timeZone)}</MinText>
        <View style={[styles.summary, { borderTopColor: colors.line }]}>
          <MinText variant="caption">Revisió {document.revision}</MinText>
          <MinText variant="caption">{document.people.length} persones</MinText>
          <MinText variant="caption">{document.tasks.length} tasques</MinText>
        </View>
      </Card>
      {assessment.kind === 'duplicate' ? <Card style={[styles.notice, { backgroundColor: colors.surface }]}><MinText variant="label">Aquest fitxer ja està desat</MinText><MinText style={{ color: colors.secondary }}>No es crearà cap còpia ni se substituirà cap revisió.</MinText></Card> : null}
      {diff && assessment.kind !== 'duplicate' ? <View style={styles.changes}><MinText variant="label">Què canvia</MinText>{diff.eventChanged ? <MinText>Dades generals modificades</MinText> : null}{diff.tasksAdded.map((title) => <MinText key={`a-${title}`}>Afegida: {title}</MinText>)}{diff.tasksChanged.map((title) => <MinText key={`m-${title}`}>Modificada: {title}</MinText>)}{diff.tasksRemoved.map((title) => <MinText key={`r-${title}`}>Eliminada: {title}</MinText>)}</View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.x1 },
  lead: { marginTop: spacing.x2 },
  eventCard: { gap: spacing.x1, marginTop: spacing.x3, marginBottom: spacing.x4, borderLeftWidth: 6 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x3, marginTop: spacing.x4, paddingTop: spacing.x3, borderTopWidth: 1 },
  notice: { gap: spacing.x2, marginBottom: spacing.x5 },
  changes: { gap: spacing.x2, marginBottom: spacing.x5 },
  actions: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', flexDirection: 'row-reverse', gap: spacing.x2 },
  actionsStacked: { flexDirection: 'column' },
  primaryAction: { flex: 1.15 },
  secondaryAction: { flex: 1 },
});
