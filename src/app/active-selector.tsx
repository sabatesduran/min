import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { eventStatus, formatDateTime } from '@/domain/time';
import { useAppData } from '@/features/app-data/app-data-provider';
import { useNow } from '@/features/time/use-now';
import { Button } from '@/ui/components/button';
import { PressableCard } from '@/ui/components/card';
import { EmptyState } from '@/ui/components/empty-state';
import { FormField } from '@/ui/components/form-field';
import { MinIcon } from '@/ui/components/icon';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function ActiveSelectorScreen() {
  const { mode, required, suggested, after, enable } = useLocalSearchParams<{ mode?: string; required?: string; suggested?: string; after?: string; enable?: string }>();
  const { documents, selected, selectedDocumentId, selectDocument, documentPreferences, updateDocumentPreferences } = useAppData();
  const { colors } = useMinTheme();
  const now = useNow();
  const selectableDocuments = useMemo(() => documents.filter((item) => item.origin !== 'demo'), [documents]);
  const ordered = useMemo(() => [...selectableDocuments].sort((left, right) => {
    const rank = { active: 0, upcoming: 1, finished: 2 } as const;
    const statusDifference = rank[eventStatus(left.document.event, now)] - rank[eventStatus(right.document.event, now)];
    return statusDifference || Date.parse(left.document.event.startsAt) - Date.parse(right.document.event.startsAt);
  }), [now, selectableDocuments]);
  const repeatedPersonNames = useMemo(() => {
    const counts = new Map<string, number>();
    selected?.document.people.forEach((person) => {
      const name = person.name.trim().toLocaleLowerCase('ca');
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([name]) => name));
  }, [selected]);
  const [candidateId, setCandidateId] = useState(() => suggested ?? selectedDocumentId ?? ordered[0]?.document.documentId ?? null);
  const [personQuery, setPersonQuery] = useState('');
  const visiblePeople = useMemo(() => {
    const normalized = personQuery.trim().toLocaleLowerCase('ca').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!normalized) return selected?.document.people ?? [];
    return selected?.document.people.filter((person) => {
      const searchable = `${person.name} ${person.disambiguation ?? ''}`.toLocaleLowerCase('ca').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return searchable.includes(normalized);
    }) ?? [];
  }, [personQuery, selected]);

  const savePerson = async (mePersonId: string | null) => {
    try {
      await updateDocumentPreferences({
        mePersonId,
        filter: mePersonId ? (enable === 'personal' ? 'mine' : documentPreferences?.filter ?? 'all') : 'all',
        ...(mePersonId && enable === 'reminders'
          ? { reminderMode: 'mine' as const, reminderMinutes: documentPreferences?.reminderMinutes ?? 10 }
          : {}),
        ...(mePersonId && enable === 'live' ? { liveMode: 'mine' as const } : {}),
      });
      if (after === 'now') router.replace('/(tabs)');
      else router.back();
    } catch (error) {
      Alert.alert('No s’ha pogut canviar la identitat', error instanceof Error ? error.message : 'Revisa la configuració dels avisos i torna-ho a provar.');
    }
  };

  if (mode === 'person') {
    if (!selected || !documentPreferences) return <Screen><NavigationHeader title="Qui ets?" mode="close" /><EmptyState title="Cap esdeveniment obert" body="Obre un esdeveniment abans de triar qui ets." /></Screen>;
    return (
      <Screen>
        <NavigationHeader title="Qui ets?" mode="close" />
        <MinText style={[styles.lead, { color: colors.secondary }]}>Tria el teu nom. No cal indicar cap càrrec. La selecció només es desa en aquest dispositiu.</MinText>
        <View style={styles.search}>
          <FormField
            label="Cerca el teu nom"
            value={personQuery}
            onChangeText={setPersonQuery}
            placeholder="Nom o cognoms"
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
            reserveErrorSpace={false}
          />
        </View>
        {!visiblePeople.length ? (
          <EmptyState
            title="Cap coincidència"
            body={personQuery.trim() ? 'Prova amb una altra part del nom.' : 'Aquest esdeveniment no té cap persona.'}
          />
        ) : null}
        <View style={styles.list} accessibilityRole="radiogroup" accessibilityLabel="Tria qui ets">
          {visiblePeople.map((person) => {
            const isMe = person.id === documentPreferences.mePersonId;
            const showDisambiguation = repeatedPersonNames.has(person.name.trim().toLocaleLowerCase('ca')) && person.disambiguation;
            return (
              <PressableCard
                key={person.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: isMe }}
                accessibilityLabel={`Aquesta persona soc jo: ${person.name}${showDisambiguation ? `, ${person.disambiguation}` : ''}`}
                onPress={() => void savePerson(person.id)}>
                <View style={styles.row}>
                  <View style={styles.text}>
                    <MinText variant="label">{person.name}</MinText>
                    {showDisambiguation ? <MinText variant="metadata" style={{ color: colors.secondary }}>{person.disambiguation}</MinText> : null}
                  </View>
                  <MinIcon name={isMe ? 'radioOn' : 'radioOff'} size={24} color={isMe ? colors.brand : colors.secondary} />
                </View>
              </PressableCard>
            );
          })}
          <PressableCard
            accessibilityRole="radio"
            accessibilityState={{ checked: documentPreferences.mePersonId === null }}
            onPress={() => void savePerson(null)}>
            <View style={styles.row}><MinText style={styles.text}>Encara no ho sé</MinText><MinIcon name={documentPreferences.mePersonId === null ? 'radioOn' : 'radioOff'} size={24} color={documentPreferences.mePersonId === null ? colors.brand : colors.secondary} /></View>
          </PressableCard>
        </View>
      </Screen>
    );
  }

  const activeCount = selectableDocuments.filter((item) => eventStatus(item.document.event, now) === 'active').length;
  const openCandidate = async () => {
    if (!candidateId) return;
    await selectDocument(candidateId);
    if (required === '1') router.replace('/(tabs)');
    else router.back();
  };
  return (
    <Screen>
      {required !== '1' ? <NavigationHeader title="Canvia d’esdeveniment" mode="close" /> : null}
      <MinText variant="hero">{activeCount > 1 ? 'Tria l’esdeveniment en curs' : 'Canvia d’esdeveniment'}</MinText>
      <MinText style={[styles.lead, { color: colors.secondary }]}>Selecciona el document i confirma quin vols tenir obert.</MinText>
      <View style={styles.list} accessibilityRole="radiogroup" accessibilityLabel="Min obert">
        {ordered.map((item) => {
          const document = item.document;
          const status = eventStatus(document.event, now);
          const candidate = document.documentId === candidateId;
          const opened = document.documentId === selectedDocumentId;
          return (
            <PressableCard
              key={document.documentId}
              accessibilityRole="radio"
              accessibilityState={{ checked: candidate }}
              onPress={() => setCandidateId(document.documentId)}>
              <View style={styles.row}>
                <View style={styles.text}>
                  <View style={styles.eyebrowRow}>
                    <MinText variant="caption" style={[styles.status, { backgroundColor: status === 'active' ? colors.successSoft : colors.surface, color: status === 'active' ? colors.success : colors.secondary }]}>{status === 'active' ? 'En curs segons l’horari' : status === 'upcoming' ? 'Pròxim' : 'Finalitzat'}</MinText>
                    {opened ? <MinText variant="caption" style={{ color: colors.brand }}>Obert ara</MinText> : null}
                  </View>
                  <MinText variant="metadata" style={{ color: colors.secondary }}>{document.event.organization}</MinText>
                  <MinText variant="label">{document.event.title}</MinText>
                  <MinText variant="metadata" style={{ color: colors.secondary }}>{formatDateTime(document.event.startsAt, document.event.timeZone)} fins a {formatDateTime(document.event.endsAt, document.event.timeZone)} · V{document.revision}</MinText>
                </View>
                <MinIcon name={candidate ? 'radioOn' : 'radioOff'} size={26} color={candidate ? colors.brand : colors.secondary} />
              </View>
            </PressableCard>
          );
        })}
      </View>
      <Button label="Obre aquest esdeveniment" icon="check" disabled={!candidateId} onPress={openCandidate} style={styles.openButton} />
      <Button label="Veure tots els esdeveniments" variant="quiet" onPress={() => router.dismissTo('/events')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginTop: spacing.x2, marginBottom: spacing.x5 },
  search: { marginBottom: spacing.x4 },
  list: { gap: spacing.x3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.x4 },
  text: { flex: 1, minWidth: 0, gap: spacing.x1 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
  status: { paddingHorizontal: spacing.x2, paddingVertical: spacing.x1, borderRadius: radius.pill },
  openButton: { marginTop: spacing.x5 },
});
