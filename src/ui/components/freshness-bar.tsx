import { StyleSheet, View } from 'react-native';

import type { StoredDocument } from '@/domain/models';
import { documentOriginLabel } from '@/domain/permissions';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

import { MinIcon } from './icon';
import { MinText } from './min-text';

function formatMoment(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat('ca-ES', {
    timeZone,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function FreshnessBar({ stored, compact = false }: { stored: StoredDocument; compact?: boolean }) {
  const { colors } = useMinTheme();
  const document = stored.document;
  if (stored.origin === 'demo') {
    return (
      <View style={[styles.bar, compact && styles.compact, { backgroundColor: colors.surface }]}>
        <MinIcon name="now" size={18} color={colors.secondary} />
        <MinText variant="caption" style={[styles.text, { color: colors.secondary }]}>Demostració temporal · no apareix als teus esdeveniments</MinText>
      </View>
    );
  }
  const moment = stored.origin === 'received' ? stored.importedAt : document.publishedAt;
  const label = stored.origin === 'received' ? 'Importada' : 'Revisió creada';
  return (
    <View style={[styles.bar, compact && styles.compact, { backgroundColor: colors.surface }]}>
      <MinIcon name={stored.origin === 'received' ? 'download' : 'complete'} size={18} color={colors.secondary} />
      <MinText variant="caption" style={[styles.text, { color: colors.secondary }]}>
        V{document.revision} · {documentOriginLabel(stored)}{moment ? ` · ${label} ${formatMoment(moment, document.event.timeZone)}` : ''}
        {stored.origin === 'received' ? ' · Sense actualització automàtica' : ''}
      </MinText>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 48,
    borderRadius: radius.input,
    paddingHorizontal: spacing.x3,
    paddingVertical: spacing.x2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x2,
  },
  compact: { minHeight: 40 },
  text: { flex: 1 },
});
