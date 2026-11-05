import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { duplicateRevision, getRevision, type StoredRevision } from '@/db/repository';
import { diffDocuments } from '@/domain/diff';
import { useAppData } from '@/features/app-data/app-data-provider';
import { shareDocumentFile } from '@/features/sharing/export-document';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { LoadingView } from '@/ui/components/loading-view';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function RevisionDetailScreen() {
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const db = useSQLiteContext();
  const { selected, selectDocument, refresh } = useAppData();
  const { colors } = useMinTheme();
  const [revision, setRevision] = useState<StoredRevision | null | undefined>(undefined);
  const [working, setWorking] = useState(false);
  useEffect(() => {
    if (!selected || !hash) return;
    let active = true;
    void getRevision(db, selected.document.documentId, hash).then((value) => { if (active) setRevision(value); });
    return () => { active = false; };
  }, [db, hash, selected]);
  const diff = useMemo(() => revision && selected ? diffDocuments(revision.document, selected.document) : null, [revision, selected]);
  if (revision === undefined) return <LoadingView />;
  if (!revision || !selected) return <Screen><NavigationHeader title="Revisió" /><MinText>No s’ha trobat aquesta revisió.</MinText></Screen>;
  const current = JSON.stringify(revision.document) === JSON.stringify(selected.document);
  const duplicate = async () => {
    setWorking(true);
    try {
      const id = await duplicateRevision(db, selected.document.documentId, revision.contentHash);
      await refresh();
      await selectDocument(id);
      router.replace('/editor');
    } catch (error) {
      Alert.alert('No s’ha pogut duplicar', error instanceof Error ? error.message : 'Torna-ho a provar.');
    } finally { setWorking(false); }
  };
  return (
    <Screen>
      <NavigationHeader title={`Revisió V${revision.document.revision}`} />
      <MinText variant="hero">{revision.document.event.title}</MinText>
      <MinText style={[styles.lead, { color: colors.secondary }]}>{current ? 'Aquesta és la revisió vigent.' : 'Aquesta còpia es conserva a l’historial i no substitueix la vigent.'}</MinText>
      <Card style={styles.summary}>
        <MinText>{revision.document.people.length} persones</MinText>
        <MinText>{revision.document.tasks.length} tasques</MinText>
        <MinText variant="metadata" style={{ color: colors.secondary }}>Publicada {new Intl.DateTimeFormat('ca-ES', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(revision.document.publishedAt))}</MinText>
      </Card>
      {!current && diff ? (
        <View style={styles.section}>
          <MinText variant="label">Diferències respecte d’aquesta còpia</MinText>
          {diff.eventChanged ? <MinText>Dades generals modificades</MinText> : null}
          {diff.tasksAdded.length ? <MinText>{diff.tasksAdded.length} tasques només a la vigent</MinText> : null}
          {diff.tasksRemoved.length ? <MinText>{diff.tasksRemoved.length} tasques només en aquesta revisió</MinText> : null}
          {diff.tasksChanged.length ? <MinText>{diff.tasksChanged.length} tasques modificades</MinText> : null}
        </View>
      ) : null}
      <View style={styles.actions}>
        <Button label="Exporta aquesta revisió" icon="share" variant="secondary" onPress={() => shareDocumentFile(revision.document)} />
        {!current ? <Button label="Duplica-la per editar" icon="copy" loading={working} onPress={duplicate} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginTop: spacing.x2, marginBottom: spacing.x5 },
  summary: { gap: spacing.x2 },
  section: { gap: spacing.x2, marginTop: spacing.x6 },
  actions: { gap: spacing.x3, marginTop: spacing.x8 },
});
