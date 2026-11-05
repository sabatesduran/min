import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { canEditDocument, documentOriginLabel } from '@/domain/permissions';
import { useAppData } from '@/features/app-data/app-data-provider';
import { shareDocumentFile } from '@/features/sharing/export-document';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { EmptyState } from '@/ui/components/empty-state';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function DocumentActionsScreen() {
  const { selected, setFavorite, duplicateDocument, deleteDocument } = useAppData();
  const { colors } = useMinTheme();
  if (!selected) return <Screen><EmptyState title="Cap esdeveniment obert" body="Obre un esdeveniment abans de gestionar-lo." /></Screen>;
  const document = selected.document;
  const editable = canEditDocument(selected);
  const demo = selected.origin === 'demo';
  const duplicate = async () => {
    await duplicateDocument(document.documentId);
    router.replace('/editor');
  };
  const remove = () => {
    Alert.alert(demo ? 'Surt de la demo?' : 'Elimina aquest esdeveniment?', demo ? 'Tornaràs a l’inici i la demostració temporal s’eliminarà.' : 'S’eliminaran la còpia local, l’esborrany, les marques personals i els avisos programats.', [
      { text: 'Cancel·la', style: 'cancel' },
      { text: demo ? 'Surt' : 'Elimina', style: 'destructive', onPress: async () => { await deleteDocument(document.documentId); router.replace('/'); } },
    ]);
  };
  return (
    <Screen>
      <NavigationHeader title="Gestiona l’esdeveniment" mode="close" />
      <Card style={styles.card}>
        <MinText variant="label">{document.event.title}</MinText>
        <MinText variant="metadata" style={{ color: colors.secondary }}>{document.event.organization} · {documentOriginLabel(selected)} · V{document.revision}</MinText>
      </Card>
      <View style={styles.actions}>
        {editable ? <Button label="Prepara l’esdeveniment" icon="edit" onPress={() => router.push('/editor')} /> : <Button label="Duplica per editar" icon="copy" onPress={duplicate} />}
        {!demo ? <Button label={selected.favorite ? 'Treu dels preferits' : 'Marca com a preferit'} icon="star" variant="secondary" onPress={() => setFavorite(document.documentId, !selected.favorite)} /> : null}
        {!demo ? <Button label="Exporta una còpia" icon="download" variant="secondary" onPress={() => shareDocumentFile(document)} /> : null}
        {!demo ? <Button label="Historial de revisions" icon="fileText" variant="secondary" onPress={() => router.push('/revisions')} /> : null}
        {editable ? <Button label="Duplica com a nou" icon="copy" variant="secondary" onPress={duplicate} /> : null}
        <Button label={demo ? 'Surt de la demo' : 'Elimina del dispositiu'} icon={demo ? 'back' : 'trash'} variant="danger" onPress={remove} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.x1, marginBottom: spacing.x4 },
  actions: { gap: spacing.x3 },
});
