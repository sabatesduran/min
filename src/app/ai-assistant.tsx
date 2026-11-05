import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { buildAiImportPrompt } from '@/features/ai/build-ai-prompt';
import { pickDocumentUri } from '@/features/sharing/pick-document';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function AiAssistantScreen() {
  const { colors } = useMinTheme();
  const prompt = useMemo(() => buildAiImportPrompt(), []);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const copyPrompt = async () => {
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(prompt);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  };

  const importResult = async () => {
    const uri = await pickDocumentUri();
    if (uri) router.push({ pathname: '/import-review', params: { uri } });
  };

  return (
    <Screen>
      <NavigationHeader title="Crea amb IA" mode="close" />

      <MinText variant="hero">Converteix un document amb IA</MinText>
      <MinText style={[styles.lead, { color: colors.secondary }]}>Envia el teu document i les instruccions a ChatGPT o a la IA que vulguis. Et tornarà un fitxer llest per obrir amb min.</MinText>

      <Card style={[styles.privacy, { backgroundColor: colors.peach }]}>
        <MinText variant="label">Tu controles les dades</MinText>
        <MinText>min no envia cap document ni es connecta a cap servei d’IA. Tu decideixes on enganxar les instruccions i què hi adjuntes.</MinText>
      </Card>

      <View style={styles.step}>
        <MinText variant="label">1. Envia-ho a la IA</MinText>
        <MinText style={{ color: colors.secondary }}>Copia les instruccions, enganxa-les al xat i adjunta-hi el PDF, document o text original.</MinText>
        <Button label={copied ? 'Instruccions copiades' : 'Copia les instruccions'} icon={copied ? 'check' : 'copy'} onPress={copyPrompt} />
        <MinText accessibilityLiveRegion="polite" variant="caption" style={{ color: copyError ? colors.error : colors.secondary }}>
          {copyError ? 'No s’han pogut copiar les instruccions.' : copied ? 'Ara enganxa-les al xat i adjunta-hi el document.' : 'La IA rebrà el format exacte i la instrucció de no inventar dades.'}
        </MinText>
      </View>

      <View style={styles.step}>
        <MinText variant="label">2. Importa el fitxer</MinText>
        <MinText style={{ color: colors.secondary }}>Descarrega el fitxer amb un nom com esdeveniment.minut.json que et retorni la IA i obre’l aquí. min el validarà abans de desar res.</MinText>
        <Button label="Importa el fitxer" icon="fileUp" variant="secondary" onPress={importResult} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginTop: spacing.x2, marginBottom: spacing.x6 },
  privacy: { gap: spacing.x2, marginBottom: spacing.x8 },
  step: { gap: spacing.x3, marginBottom: spacing.x8 },
});
