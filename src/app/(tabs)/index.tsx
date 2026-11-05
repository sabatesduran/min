import { StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';

import { currentTasks, eventStatus, formatDate, formatDateTime, formatTime, minutesUntil, nextTaskGroup } from '@/domain/time';
import { useAppData } from '@/features/app-data/app-data-provider';
import { useNow } from '@/features/time/use-now';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { EmptyState } from '@/ui/components/empty-state';
import { FreshnessBar } from '@/ui/components/freshness-bar';
import { AppHeader } from '@/ui/components/header';
import { MinText } from '@/ui/components/min-text';
import { Screen } from '@/ui/components/screen';
import { SegmentedControl } from '@/ui/components/segmented-control';
import { TaskCard } from '@/ui/components/task-card';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function NowScreen() {
  const { loading, selected, documentPreferences, updateDocumentPreferences } = useAppData();
  const { colors } = useMinTheme();
  const now = useNow(selected?.document);
  if (loading) return null;
  if (!selected || !documentPreferences) {
    return (
      <Screen>
        <EmptyState title="Cap esdeveniment obert" body="Obre un esdeveniment per veure què toca ara." action="Ves als esdeveniments" onAction={() => router.replace('/events')} />
      </Screen>
    );
  }

  const document = selected.document;
  const status = eventStatus(document.event, now);
  const me = document.people.find((person) => person.id === documentPreferences.mePersonId);
  const current = currentTasks(document, documentPreferences, now);
  const next = nextTaskGroup(document, documentPreferences, now);
  const firstNext = next[0];
  const nextMinutes = firstNext && firstNext.kind !== 'after' ? minutesUntil(firstNext.startsAt, now) : null;

  const changeFilter = async (filter: 'all' | 'mine') => {
    if (filter === 'mine' && !documentPreferences.mePersonId) {
      router.push('/active-selector?mode=person');
      return;
    }
    await updateDocumentPreferences({ filter });
  };

  return (
    <Screen>
      <AppHeader />

      {status === 'upcoming' ? (
        <>
          <View style={styles.statusHeading}>
            <MinText variant="caption" style={[styles.statusPill, { backgroundColor: colors.lilac, color: colors.text }]}>Pròxim</MinText>
            <MinText variant="hero">Tot a punt</MinText>
            <MinText style={{ color: colors.secondary }}>Comença {formatDateTime(document.event.startsAt, document.event.timeZone)}. Pots consultar tot l’horari des d’ara.</MinText>
          </View>
          {next.length ? (
            <View style={styles.section}>
              <MinText variant="label">Primera tasca</MinText>
              <TaskCard task={next[0]!} document={document} tone="next" />
              {next.length > 1 ? <MinText variant="metadata" style={{ color: colors.secondary }}>{next.length - 1} més al mateix moment</MinText> : null}
            </View>
          ) : <Card><MinText style={{ color: colors.secondary }}>Aquest esdeveniment encara no té tasques.</MinText></Card>}
          <Button label="Consulta l’agenda" icon="agenda" variant="secondary" onPress={() => router.push('/(tabs)/agenda')} style={styles.singleAction} />
        </>
      ) : status === 'finished' ? (
        <>
          <View style={styles.statusHeading}>
            <MinText variant="caption" style={[styles.statusPill, { backgroundColor: colors.surface, color: colors.secondary }]}>Finalitzat</MinText>
            <MinText variant="hero">Jornada completada</MinText>
            <MinText style={{ color: colors.secondary }}>Aquest esdeveniment ha acabat, però l’agenda i les teves marques continuen disponibles.</MinText>
          </View>
          <View style={styles.finishedActions}>
            <Button label="Consulta l’agenda" icon="agenda" onPress={() => router.push('/(tabs)/agenda')} />
            <Button label="Tots els esdeveniments" icon="events" variant="secondary" onPress={() => router.push('/events')} />
          </View>
        </>
      ) : (
        <>
          <View style={styles.liveHeader}>
            <View style={styles.clockBlock}>
              <MinText variant="display">{formatTime(new Date(now).toISOString(), document.event.timeZone)}</MinText>
              <MinText variant="metadata" style={{ color: colors.secondary }}>{formatDate(new Date(now).toISOString(), document.event.timeZone)}</MinText>
            </View>
            <MinText variant="caption" style={[styles.statusPill, { backgroundColor: colors.successSoft, color: colors.success }]}>En curs segons l’horari</MinText>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleText}>
                <MinText variant="label">Què toca ara</MinText>
                {me && documentPreferences.filter === 'mine' ? <MinText variant="caption" style={{ color: colors.secondary }}>Vista de {me.name}</MinText> : null}
              </View>
            </View>
            {current.length ? current.map((task, index) => <TaskCard key={task.id} task={task} document={document} tone={index === 0 ? 'now' : 'plain'} />) : (
              <Card style={{ backgroundColor: colors.raised }}>
                <MinText variant="label">Pausa prevista</MinText>
                <MinText style={{ color: colors.secondary }}>{documentPreferences.filter === 'mine' ? 'No tens cap tasca assignada ara mateix.' : 'No hi ha cap activitat prevista ara mateix.'}</MinText>
              </Card>
            )}
          </View>

          <View style={styles.section}>
            <MinText variant="label">Després</MinText>
            {next.length ? (
              <>
                <TaskCard task={next[0]!} document={document} tone="next" />
                <MinText variant="metadata" style={{ color: colors.secondary }}>
                  {nextMinutes !== null && nextMinutes <= 120 ? `D’aquí a ${nextMinutes} min` : next[0]!.kind !== 'after' ? formatDateTime(next[0]!.startsAt, document.event.timeZone) : ''}
                  {next.length > 1 ? ` · ${next.length - 1} més al mateix moment` : ''}
                </MinText>
              </>
            ) : <MinText style={{ color: colors.secondary }}>No queden més tasques previstes.</MinText>}
          </View>
        </>
      )}

      {status !== 'finished' ? (
        <View style={styles.filters}>
          <MinText variant="label">Què vols veure</MinText>
          <SegmentedControl
            label="Filtre de tasques"
            value={documentPreferences.filter}
            options={[{ value: 'all', label: 'Tot' }, { value: 'mine', label: 'Per a mi' }]}
            onChange={changeFilter}
          />
          {documentPreferences.filter === 'mine' ? (
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <MinText style={{ fontWeight: '600' }}>Inclou tasques generals</MinText>
                <MinText variant="caption" style={{ color: colors.secondary }}>També mostra les activitats marcades per a tota la colla.</MinText>
              </View>
              <Switch
                accessibilityLabel="Inclou tasques generals"
                value={documentPreferences.includeCommon}
                onValueChange={(includeCommon) => updateDocumentPreferences({ includeCommon })}
                trackColor={{ false: colors.line, true: colors.brand }}
                thumbColor={colors.raised}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      <FreshnessBar stored={selected} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusHeading: { gap: spacing.x3, marginBottom: spacing.x6 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: spacing.x3, paddingVertical: spacing.x1, borderRadius: radius.pill, overflow: 'hidden' },
  liveHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.x4, marginBottom: spacing.x3 },
  clockBlock: { flex: 1, gap: spacing.x1 },
  section: { gap: spacing.x3, marginBottom: 28 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x3 },
  sectionTitleText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  filters: { gap: spacing.x3, marginTop: spacing.x4, marginBottom: spacing.x6 },
  switchRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x4 },
  switchText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  finishedActions: { gap: spacing.x2, marginBottom: spacing.x8 },
  singleAction: { marginBottom: spacing.x8 },
});
