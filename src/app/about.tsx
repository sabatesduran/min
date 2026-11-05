import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { useSQLiteContext } from 'expo-sqlite';

import { loadDidacProjects, type DidacProject } from '@/features/about/didac-projects';
import { Button } from '@/ui/components/button';
import { Card, PressableCard } from '@/ui/components/card';
import { MinIcon } from '@/ui/components/icon';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { radius, spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

function appVersion(): string {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const nativeBuild = Platform.OS === 'ios'
    ? Constants.platform?.ios?.buildNumber
    : Platform.OS === 'android'
      ? Constants.platform?.android?.versionCode
      : null;
  const configuredBuild = Platform.OS === 'ios'
    ? Constants.expoConfig?.ios?.buildNumber
    : Platform.OS === 'android'
      ? Constants.expoConfig?.android?.versionCode
      : null;
  const build = nativeBuild ?? configuredBuild;
  return build ? `${version} (${build})` : version;
}

export default function AboutScreen() {
  const db = useSQLiteContext();
  const { colors } = useMinTheme();
  const [projects, setProjects] = useState<DidacProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stale, setStale] = useState(false);

  const load = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(false);
    try {
      const result = await loadDidacProjects(db, { forceRefresh });
      setProjects(result.projects);
      setStale(result.source === 'stale-cache');
    } catch {
      setError(true);
      setStale(false);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    let active = true;
    void loadDidacProjects(db).then((result) => {
      if (!active) return;
      setProjects(result.projects);
      setStale(result.source === 'stale-cache');
    }).catch(() => {
      if (active) setError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [db]);

  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('No s’ha pogut obrir l’enllaç', 'Torna-ho a provar quan tinguis connexió.');
    }
  };

  return (
    <Screen>
      <NavigationHeader title="Sobre min" />
      <Card style={[styles.hero, { backgroundColor: colors.lilac }]}>
        <Image source={require('../../assets/images/logo-transparent.png')} resizeMode="contain" style={styles.logo} accessibilityLabel="min" />
        <MinText variant="hero">Tot al seu moment.</MinText>
        <MinText style={{ color: colors.secondary }}>El minut a minut de la colla, sempre a mà.</MinText>
      </Card>

      <View style={styles.section}>
        <MinText variant="label">L’app</MinText>
        <Card style={styles.infoCard}>
          <InfoRow icon="info" label="Versió" value={appVersion()} />
          <View style={[styles.separator, { backgroundColor: colors.line }]} />
          <InfoRow icon="person" label="Desenvolupador" value="Dídac Sabatés" />
          <View style={[styles.separator, { backgroundColor: colors.line }]} />
          <PressableCard accessibilityLabel="Obre didac.dev" onPress={() => void open('https://didac.dev')} style={styles.linkRow}>
            <View style={[styles.smallIcon, { backgroundColor: colors.surface }]}><MinIcon name="web" size={20} color={colors.brand} /></View>
            <View style={styles.infoText}>
              <MinText variant="metadata" style={{ color: colors.secondary }}>Web</MinText>
              <MinText style={styles.strong}>didac.dev</MinText>
            </View>
            <MinIcon name="external" size={19} color={colors.brand} />
          </PressableCard>
        </Card>
      </View>

      <View style={styles.section}>
        <View style={styles.projectsHeading}>
          <View style={styles.projectsHeadingText}>
            <MinText variant="label">Més projectes de didac.dev</MinText>
            <MinText variant="metadata" style={{ color: colors.secondary }}>Aplicacions i eines fetes amb la mateixa cura.</MinText>
          </View>
          {loading && projects.length ? <ActivityIndicator color={colors.brand} /> : null}
        </View>

        {loading && !projects.length ? (
          <Card style={styles.loadingCard}>
            <ActivityIndicator color={colors.brand} />
            <MinText style={{ color: colors.secondary }}>Carregant projectes…</MinText>
          </Card>
        ) : error ? (
          <Card style={styles.errorCard}>
            <MinIcon name="web" size={24} color={colors.secondary} />
            <MinText style={styles.strong}>No s’han pogut carregar els projectes</MinText>
            <MinText variant="metadata" style={{ color: colors.secondary }}>La resta de l’About continua disponible sense connexió.</MinText>
            <Button label="Torna-ho a provar" variant="secondary" onPress={() => void load(true)} />
          </Card>
        ) : projects.length ? (
          <View style={styles.projects}>
            {projects.map((project) => (
              <PressableCard key={project.url} accessibilityLabel={`Obre ${project.name}`} onPress={() => void open(project.url)}>
                <View style={styles.projectRow}>
                  <View style={[styles.projectImageFrame, { backgroundColor: colors.surface }]}>
                    <Image source={{ uri: project.imageUrl }} resizeMode="cover" style={styles.projectImage} accessibilityElementsHidden />
                  </View>
                  <View style={styles.projectText}>
                    <MinText style={styles.strong}>{project.name}</MinText>
                    <MinText variant="metadata" style={{ color: colors.secondary }}>{project.description}</MinText>
                  </View>
                  <MinIcon name="external" size={19} color={colors.brand} />
                </View>
              </PressableCard>
            ))}
          </View>
        ) : (
          <Card><MinText style={{ color: colors.secondary }}>No hi ha projectes per mostrar ara mateix.</MinText></Card>
        )}
        {stale ? <MinText variant="caption" style={{ color: colors.secondary }}>Mostrant l’última còpia desada perquè ara no hi ha connexió.</MinText> : null}
        <MinText variant="caption" style={{ color: colors.secondary }}>Contingut públic de didac.dev. Els enllaços s’obren al navegador.</MinText>
      </View>
    </Screen>
  );
}

function InfoRow({ icon, label, value }: { icon: 'info' | 'person'; label: string; value: string }) {
  const { colors } = useMinTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.smallIcon, { backgroundColor: colors.surface }]}><MinIcon name={icon} size={20} color={colors.brand} /></View>
      <MinText style={styles.infoLabel}>{label}</MinText>
      <MinText style={[styles.infoValue, { color: colors.secondary }]}>{value}</MinText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.x2, marginBottom: spacing.x8, overflow: 'hidden' },
  logo: { width: 144, height: 72, alignSelf: 'flex-start' },
  section: { gap: spacing.x3, marginBottom: spacing.x8 },
  infoCard: { padding: spacing.x3 },
  infoRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, paddingHorizontal: spacing.x2 },
  infoText: { flex: 1, minWidth: 0 },
  infoLabel: { flex: 1 },
  infoValue: { flexShrink: 1, textAlign: 'right' },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 58 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3, borderWidth: 0, padding: spacing.x2, borderRadius: radius.input, backgroundColor: 'transparent' },
  smallIcon: { width: 40, height: 40, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center' },
  projectsHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
  projectsHeadingText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  projects: { gap: spacing.x3 },
  projectRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
  projectImageFrame: { width: 52, height: 52, borderRadius: radius.input, overflow: 'hidden' },
  projectImage: { width: '100%', height: '100%' },
  projectText: { flex: 1, minWidth: 0, gap: spacing.x1 },
  loadingCard: { minHeight: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.x3 },
  errorCard: { gap: spacing.x3, alignItems: 'flex-start' },
  strong: { fontWeight: '600' },
});
