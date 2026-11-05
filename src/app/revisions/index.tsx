import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { clearRevisionHistory, listRevisions, type StoredRevision } from '@/db/repository';
import { useAppData } from '@/features/app-data/app-data-provider';
import { Card, PressableCard } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { EmptyState } from '@/ui/components/empty-state';
import { MinIcon } from '@/ui/components/icon';
import { LoadingView } from '@/ui/components/loading-view';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function RevisionsScreen() {
  const db = useSQLiteContext();
  const { selected } = useAppData();
  const { colors } = useMinTheme();
  const [revisions, setRevisions] = useState<StoredRevision[] | null>(null);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    void listRevisions(db, selected.document.documentId).then((value) => { if (active) setRevisions(value); });
    return () => { active = false; };
  }, [db, selected]);
  const reload = async () => {
    if (selected) setRevisions(await listRevisions(db, selected.document.documentId));
  };
  const clearHistory = () => {
    if (!selected) return;
    Alert.alert('Esborra l’historial?', 'Es conservarà la revisió vigent. Exporta abans una còpia de seguretat si vols poder recuperar les revisions anteriors.', [
      { text: 'Cancel·la', style: 'cancel' },
      { text: 'Esborra', style: 'destructive', onPress: async () => { await clearRevisionHistory(db, selected.document.documentId); await reload(); } },
    ]);
  };
  if (!selected) return <Screen><NavigationHeader title="Historial" /><EmptyState title="Cap esdeveniment obert" body="Obre un esdeveniment per consultar-ne les revisions." /></Screen>;
  if (!revisions) return <LoadingView />;
  const hashesPerRevision = new Map<number, number>();
  revisions.forEach((item) => hashesPerRevision.set(item.document.revision, (hashesPerRevision.get(item.document.revision) ?? 0) + 1));
  return (
    <Screen>
      <NavigationHeader title="Historial de revisions" />
      <MinText variant="hero">{selected.document.event.title}</MinText>
      <MinText style={[styles.lead, { color: colors.secondary }]}>Les còpies antigues i conflictives es conserven sense substituir silenciosament la revisió vigent.</MinText>
      <View style={styles.list}>
        {revisions.map((item) => {
          const current = item.document.revision === selected.document.revision
            && JSON.stringify(item.document) === JSON.stringify(selected.document);
          const conflict = (hashesPerRevision.get(item.document.revision) ?? 0) > 1;
          return (
            <PressableCard
              key={`${item.document.revision}-${item.contentHash}`}
              accessibilityLabel={`Revisió ${item.document.revision}${current ? ', vigent' : ''}${conflict ? ', amb conflicte' : ''}`}
              onPress={() => router.push({ pathname: '/revisions/[hash]', params: { hash: item.contentHash } })}>
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <View style={styles.badges}>
                    <MinText variant="label">V{item.document.revision}</MinText>
                    {current ? <MinText variant="caption" style={[styles.badge, { backgroundColor: colors.successSoft, color: colors.success }]}>Vigent</MinText> : null}
                    {conflict ? <MinText variant="caption" style={[styles.badge, { backgroundColor: colors.peach }]}>Conflicte</MinText> : null}
                  </View>
                  <MinText variant="metadata" style={{ color: colors.secondary }}>Publicada {new Intl.DateTimeFormat('ca-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.document.publishedAt))}</MinText>
                  <MinText variant="caption" style={{ color: colors.secondary }}>Desada {new Intl.DateTimeFormat('ca-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.receivedAt))}</MinText>
                </View>
                <MinIcon name="chevronRight" size={20} color={colors.secondary} />
              </View>
            </PressableCard>
          );
        })}
        {!revisions.length ? <Card><MinText>No hi ha revisions desades.</MinText></Card> : null}
      </View>
      {revisions.length > 1 ? <Button label="Esborra les revisions anteriors" icon="trash" variant="danger" onPress={clearHistory} style={styles.clear} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginTop: spacing.x2, marginBottom: spacing.x6 },
  list: { gap: spacing.x3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
  rowText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  badges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.x2 },
  badge: { paddingHorizontal: spacing.x2, paddingVertical: spacing.x1, borderRadius: radius.pill, overflow: 'hidden' },
  clear: { marginTop: spacing.x8 },
});
