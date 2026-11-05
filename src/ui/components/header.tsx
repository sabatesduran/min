import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useAppData } from '@/features/app-data/app-data-provider';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

import { MinIcon } from './icon';
import { MinText } from './min-text';

export function AppHeader({ title }: { title?: string }) {
  const { selected, documents } = useAppData();
  const { colors } = useMinTheme();
  const canChangeDocument = documents.filter((item) => item.origin !== 'demo').length > 1;
  const dirty = Boolean(selected?.draft && JSON.stringify(selected.draft) !== JSON.stringify(selected.document));
  const accent = selected?.document.event.accent;
  const accentColor = accent === 'lime' ? colors.now : accent === 'lilac' ? colors.lilac : accent === 'peach' ? colors.peach : colors.brand;
  const context = (
    <>
      <Image source={require('../../../assets/images/logo-transparent.png')} resizeMode="contain" style={styles.logo} accessibilityLabel="min" />
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.titles}>
        <View style={styles.titleRow}>
          <MinText variant="metadata" numberOfLines={2} style={styles.title}>
            {title ?? selected?.document.event.title ?? 'Esdeveniments'}
          </MinText>
          {dirty ? <View style={[styles.draftDot, { backgroundColor: colors.peach }]} accessibilityLabel="Hi ha canvis pendents de revisió" /> : null}
          <MinIcon name={canChangeDocument ? 'chevronDown' : 'events'} size={16} color={colors.secondary} />
        </View>
        <MinText variant="caption" numberOfLines={1} style={{ color: colors.secondary }}>
          {selected ? `${selected.document.event.organization} · V${selected.document.revision}${selected.origin === 'received' ? ' · còpia rebuda' : selected.origin === 'demo' ? ' · demo temporal' : ''}` : 'Els teus esdeveniments'}
        </MinText>
      </View>
    </>
  );
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={canChangeDocument ? 'Canvia d’esdeveniment' : 'Obre els esdeveniments'}
        onPress={() => router.push(canChangeDocument ? '/active-selector' : '/events')}
        style={styles.context}>
        {context}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Preferències" onPress={() => router.push('/settings')} style={styles.settings}>
        <MinIcon name="settings" size={23} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: spacing.x2, marginBottom: spacing.x4 },
  context: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, minHeight: 48 },
  logo: { width: 42, height: 28 },
  accent: { width: 4, height: 30, borderRadius: 2 },
  titles: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x1 },
  title: { flexShrink: 1, fontWeight: '600' },
  draftDot: { width: 9, height: 9, borderRadius: 5 },
  settings: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
