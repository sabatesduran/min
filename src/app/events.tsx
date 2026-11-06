import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';

import { eventStatus, formatDateTime } from '@/domain/time';
import { documentOriginLabel } from '@/domain/permissions';
import { useAppData } from '@/features/app-data/app-data-provider';
import { pickDocumentUri } from '@/features/sharing/pick-document';
import { useNow } from '@/features/time/use-now';
import { Button, IconButton } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { EmptyState } from '@/ui/components/empty-state';
import { FormField } from '@/ui/components/form-field';
import { MinIcon } from '@/ui/components/icon';
import { MinText } from '@/ui/components/min-text';
import { Screen } from '@/ui/components/screen';
import { SegmentedControl } from '@/ui/components/segmented-control';
import { colorForAccent } from '@/ui/accent';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

type Filter = 'all' | 'active' | 'upcoming' | 'finished';

export default function EventsScreen() {
  const { documents, selectedDocumentId, selectDocument } = useAppData();
  const { colors } = useMinTheme();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.4;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const now = useNow();
  const libraryDocuments = useMemo(() => documents.filter((item) => item.origin !== 'demo'), [documents]);
  const visible = useMemo(() => libraryDocuments.filter((item) => {
    const status = eventStatus(item.document.event, now);
    const text = `${item.document.event.title} ${item.document.event.organization}`.toLocaleLowerCase('ca');
    return (filter === 'all' || status === filter) && text.includes(query.trim().toLocaleLowerCase('ca'));
  }), [filter, libraryDocuments, now, query]);

  const importFile = async () => {
    try {
      const uri = await pickDocumentUri();
      if (uri) router.push({ pathname: '/import-review', params: { uri } });
    } catch (error) {
      Alert.alert('No s’ha pogut obrir', error instanceof Error ? error.message : 'Torna-ho a provar.');
    }
  };
  const open = async (documentId: string) => {
    await selectDocument(documentId);
    router.replace('/(tabs)');
  };
  const manage = async (documentId: string) => {
    await selectDocument(documentId);
    router.push('/document-actions');
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <Image source={require('../../assets/images/logo-transparent.png')} resizeMode="contain" style={styles.logo} accessibilityLabel="min" />
        <View style={styles.topActions}>
          {selectedDocumentId ? <Button label={largeText ? 'Torna' : 'Torna a l’esdeveniment'} accessibilityLabel="Torna a l’esdeveniment" icon="back" variant="quiet" onPress={() => router.replace('/(tabs)')} style={styles.returnButton} /> : null}
          {!selectedDocumentId ? <IconButton icon="settings" label="Preferències" onPress={() => router.push('/(tabs)/settings')} /> : null}
        </View>
      </View>
      <MinText variant="hero">Esdeveniments</MinText>
      <MinText style={[styles.lead, { color: colors.secondary }]}>Obre el minut a minut que necessites o prepara’n un de nou.</MinText>

      <View style={[styles.actions, fontScale > 1.3 && styles.actionsLarge]}>
        <Button label="Prepara" accessibilityLabel="Prepara un esdeveniment" icon="add" onPress={() => router.push('/create-event')} style={fontScale <= 1.3 ? styles.action : undefined} />
        <Button label="Obre un fitxer" icon="fileUp" variant="secondary" onPress={importFile} style={fontScale <= 1.3 ? styles.action : undefined} />
      </View>

      {libraryDocuments.length ? (
        <>
          <View style={styles.finder}>
            <FormField label="Cerca" value={query} onChangeText={setQuery} placeholder="Entitat o esdeveniment" reserveErrorSpace={false} />
            <SegmentedControl
              label="Filtra els esdeveniments"
              value={filter}
              options={[{ value: 'all', label: 'Tots' }, { value: 'active', label: 'En curs' }, { value: 'upcoming', label: 'Pròxims' }, { value: 'finished', label: 'Passats' }]}
              onChange={setFilter}
            />
          </View>
          <View style={styles.list}>
            {visible.map((item) => {
              const document = item.document;
              const status = eventStatus(document.event, now);
              const accentColor = colorForAccent(document.event.accent, colors);
              const selected = document.documentId === selectedDocumentId;
              const dirty = Boolean(item.draft && JSON.stringify(item.draft) !== JSON.stringify(item.document));
              return (
                <Card key={document.documentId} style={[styles.card, { borderLeftColor: accentColor }]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Obre ${document.event.title}`}
                    onPress={() => open(document.documentId)}
                    style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}>
                    <View style={styles.cardHead}>
                      <MinText variant="metadata" style={{ color: colors.secondary }}>{document.event.organization}</MinText>
                      <MinText variant="label">{document.event.title}</MinText>
                    </View>
                    <MinText variant="metadata" style={{ color: colors.secondary }}>
                      {formatDateTime(document.event.startsAt, document.event.timeZone)} — {formatDateTime(document.event.endsAt, document.event.timeZone)}
                    </MinText>
                    <View style={[styles.meta, largeText && styles.metaStacked]}>
                      <MinText variant="caption" style={[styles.status, { backgroundColor: status === 'active' ? colors.successSoft : colors.surface, color: status === 'active' ? colors.success : colors.secondary }]}>
                        {status === 'active' ? 'En curs segons l’horari' : status === 'upcoming' ? 'Pròxim' : 'Finalitzat'}
                      </MinText>
                      <View style={styles.metaRight}>
                        {dirty ? <MinText variant="caption" style={[styles.badge, { backgroundColor: colors.peach }]}>Esborrany</MinText> : null}
                        {selected ? <MinText variant="caption" style={[styles.badge, { backgroundColor: colors.lilac }]}>Obert</MinText> : null}
                        {item.favorite ? <MinIcon name="star" size={17} color={colors.brand} /> : null}
                      </View>
                    </View>
                    <MinText variant="caption" style={{ color: colors.secondary }}>{documentOriginLabel(item)} · V{document.revision}</MinText>
                  </Pressable>
                  <View style={styles.manageAction}><IconButton icon="more" label={`Gestiona ${document.event.title}`} onPress={() => manage(document.documentId)} /></View>
                </Card>
              );
            })}
          </View>
          {!visible.length ? <EmptyState title="Cap coincidència" body="Canvia el filtre o la cerca per veure més esdeveniments." /> : null}
        </>
      ) : <EmptyState title="El pròxim gran dia" body="Encara no tens cap esdeveniment desat. Obre un fitxer compartit o prepara el primer." />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x3, marginBottom: spacing.x4 },
  logo: { width: 72, height: 42 },
  topActions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.x2 },
  returnButton: { flexShrink: 1, paddingHorizontal: spacing.x3 },
  lead: { marginTop: spacing.x2 },
  actions: { flexDirection: 'row', gap: spacing.x2, marginTop: spacing.x5 },
  actionsLarge: { flexDirection: 'column' },
  action: { flex: 1, paddingHorizontal: spacing.x3 },
  finder: { gap: spacing.x3, marginTop: spacing.x6 },
  list: { gap: spacing.x3, marginTop: spacing.x4 },
  card: { padding: 0, overflow: 'hidden', borderLeftWidth: 5 },
  cardMain: { padding: spacing.x4, paddingRight: 76, gap: spacing.x2 },
  pressed: { opacity: 0.68 },
  cardHead: { gap: spacing.x1 },
  manageAction: { position: 'absolute', top: spacing.x3, right: spacing.x3 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x2 },
  metaStacked: { flexDirection: 'column', alignItems: 'flex-start' },
  metaRight: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.x2 },
  status: { paddingHorizontal: spacing.x2, paddingVertical: spacing.x1, borderRadius: radius.pill, overflow: 'hidden' },
  badge: { paddingHorizontal: spacing.x2, paddingVertical: spacing.x1, borderRadius: radius.pill, overflow: 'hidden' },
});
