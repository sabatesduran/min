import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { diffDocuments } from '@/domain/diff';
import { validateEditorially } from '@/domain/editorial-validation';
import { canEditDocument } from '@/domain/permissions';
import { useAppData } from '@/features/app-data/app-data-provider';
import { applyDocumentNotificationPreferences, preferencesValidForDocument } from '@/features/notifications/scheduler';
import { shareDocumentFile, shareDocumentPdf } from '@/features/sharing/export-document';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { EmptyState } from '@/ui/components/empty-state';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function PublishScreen() {
  const { selected, documentPreferences, publishDraft, refresh } = useAppData();
  const db = useSQLiteContext();
  const { colors } = useMinTheme();
  const [working, setWorking] = useState<string | null>(null);
  const diff = useMemo(() => selected?.draft ? diffDocuments(selected.document, selected.draft) : null, [selected]);
  if (!selected || !documentPreferences) return <Screen><EmptyState title="Cap esdeveniment obert" body="Obre un esdeveniment abans de crear-ne una revisió." /></Screen>;
  if (!canEditDocument(selected)) return <Screen><NavigationHeader title="Comparteix" mode="close" /><EmptyState title="Còpia de consulta" body="Pots exportar aquesta còpia des del menú de l’esdeveniment. Duplica-la si necessites crear una revisió pròpia." /></Screen>;
  const dirty = selected.draft && JSON.stringify(selected.draft) !== JSON.stringify(selected.document);
  const current = selected.document;
  const candidate = selected.draft ?? selected.document;
  const editorialIssues = validateEditorially(candidate);
  const publishNow = async () => {
    setWorking('publish');
    try {
      const document = await publishDraft();
      const validPreferences = preferencesValidForDocument(document, documentPreferences);
      let reminderError: string | null = null;
      try {
        await applyDocumentNotificationPreferences(db, document, validPreferences);
      } catch (error) {
        reminderError = error instanceof Error ? error.message : 'Revisa els avisos de l’esdeveniment.';
      }
      await refresh();
      Alert.alert(
        'Revisió creada',
        `La revisió ${document.revision} ja està preparada per compartir.${reminderError ? `\n\nNo s’han pogut actualitzar els avisos: ${reminderError}` : ''}`,
      );
    } catch (error) { Alert.alert('No s’ha pogut crear la revisió', error instanceof Error ? error.message : 'Torna-ho a provar.'); }
    finally { setWorking(null); }
  };
  const publish = () => {
    if (!editorialIssues.length) { void publishNow(); return; }
    Alert.alert(
      'Publica amb punts per revisar?',
      `Hi ha ${editorialIssues.length} ${editorialIssues.length === 1 ? 'avís editorial' : 'avisos editorials'}. No són errors estructurals i pots conservar-los si són intencionats.`,
      [{ text: 'Cancel·la', style: 'cancel' }, { text: 'Publica igualment', onPress: () => void publishNow() }],
    );
  };
  const run = async (key: string, action: () => Promise<unknown>) => {
    setWorking(key);
    try { await action(); } catch (error) { Alert.alert('No s’ha pogut completar', error instanceof Error ? error.message : 'Torna-ho a provar.'); }
    finally { setWorking(null); }
  };
  return (
    <Screen>
      <NavigationHeader title="Revisa i comparteix" mode="close" />
      <MinText variant="hero">{current.event.title}</MinText>
      <MinText style={[styles.meta, { color: colors.secondary }]}>Revisió actual V{current.revision} · es desa només en aquest dispositiu fins que la comparteixis</MinText>
      {dirty && diff ? (
        <Card style={[styles.diff, { backgroundColor: colors.peach }]}>
          <MinText variant="label">Canvis pendents de revisió</MinText>
          {diff.eventChanged ? <MinText>Dades generals modificades</MinText> : null}
          {diff.tasksAdded.length ? <MinText>{diff.tasksAdded.length} tasques afegides</MinText> : null}
          {diff.tasksChanged.length ? <MinText>{diff.tasksChanged.length} tasques modificades</MinText> : null}
          {diff.tasksRemoved.length ? <MinText>{diff.tasksRemoved.length} tasques eliminades</MinText> : null}
          {diff.peopleAdded.length || diff.peopleRemoved.length ? <MinText>Directori de persones modificat</MinText> : null}
          <Button label={`Crea la revisió V${current.revision + 1}`} icon="upload" loading={working === 'publish'} onPress={publish} />
        </Card>
      ) : <Card><MinText variant="label">Revisió preparada</MinText><MinText style={{ color: colors.secondary }}>El fitxer compartit correspondrà a la revisió V{current.revision}.</MinText></Card>}
      {editorialIssues.length ? (
        <Card style={styles.warnings}>
          <MinText variant="label">{editorialIssues.length} {editorialIssues.length === 1 ? 'punt per revisar' : 'punts per revisar'}</MinText>
          {editorialIssues.map((issue, index) => <MinText key={`${issue.kind}-${issue.taskId ?? issue.personId ?? issue.teamId ?? index}`} style={{ color: colors.secondary }}>• {issue.message}</MinText>)}
        </Card>
      ) : <Card style={{ backgroundColor: colors.successSoft }}><MinText variant="label" style={{ color: colors.success }}>Sense incidències editorials</MinText></Card>}
      <View style={styles.actions}>
        <Button label="Comparteix el fitxer" icon="share" loading={working === 'file'} onPress={() => run('file', () => shareDocumentFile(current))} />
        <Button label="PDF general" icon="fileText" variant="secondary" loading={working === 'pdf'} onPress={() => run('pdf', () => shareDocumentPdf(current))} />
        {documentPreferences.mePersonId ? <Button label="El meu PDF" icon="person" variant="secondary" loading={working === 'personal'} onPress={() => run('personal', () => shareDocumentPdf(current, documentPreferences.mePersonId!))} /> : null}
      </View>
      <MinText variant="caption" style={[styles.note, { color: colors.secondary }]}>La identitat, els avisos i les marques personals no s’inclouen al fitxer compartit.</MinText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { marginTop: spacing.x2, marginBottom: spacing.x5 },
  diff: { gap: spacing.x2 },
  warnings: { gap: spacing.x2, marginTop: spacing.x4 },
  actions: { gap: spacing.x3, marginTop: spacing.x5 },
  note: { textAlign: 'center', marginTop: spacing.x5 },
});
