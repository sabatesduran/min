import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';

import { parseSharedDocument } from '@/domain/schema';
import { canEditDocument } from '@/domain/permissions';
import { useAppData } from '@/features/app-data/app-data-provider';
import { BottomActionBar } from '@/ui/components/bottom-action-bar';
import { Button } from '@/ui/components/button';
import { EmptyState } from '@/ui/components/empty-state';
import { FormField } from '@/ui/components/form-field';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

export default function EditPersonScreen() {
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const { selected, saveDraft } = useAppData();
  const { colors } = useMinTheme();
  const base = selected?.draft ?? selected?.document;
  const existing = id === 'new' ? undefined : base?.people.find((person) => person.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const [disambiguation, setDisambiguation] = useState(existing?.disambiguation ?? '');
  const [saving, setSaving] = useState(false);
  if (!selected || !base) return <Screen><MinText>No hi ha cap min seleccionat.</MinText></Screen>;
  if (!canEditDocument(selected)) return <Screen><NavigationHeader title="Persona" /><EmptyState title="Còpia de consulta" body="Duplica l’esdeveniment abans de modificar-ne les persones." /></Screen>;
  const submit = async () => {
    if (!name.trim()) { Alert.alert('Falta el nom', 'Escriu com s’ha de mostrar aquesta persona.'); return; }
    setSaving(true);
    try {
      const person = { id: existing?.id ?? Crypto.randomUUID(), name: name.trim(), ...(disambiguation.trim() ? { disambiguation: disambiguation.trim() } : {}), initialsColor: existing?.initialsColor ?? 'lilac' as const };
      const people = existing ? base.people.map((candidate) => candidate.id === existing.id ? person : candidate) : [...base.people, person];
      await saveDraft(parseSharedDocument({ ...base, people }));
      if (returnTo === 'editor') router.replace('/editor');
      else router.back();
    } catch (error) { Alert.alert('No s’ha pogut desar', error instanceof Error ? error.message : 'Torna-ho a provar.'); }
    finally { setSaving(false); }
  };
  const remove = () => {
    if (!existing) return;
    router.push({ pathname: '/people/remove/[id]', params: { id: existing.id } });
  };
  return (
    <Screen keyboardShouldPersistTaps="handled" footer={<BottomActionBar><Button label="Desa la persona" icon="check" loading={saving} onPress={submit} /></BottomActionBar>}>
      <NavigationHeader title={existing ? 'Edita la persona' : 'Nova persona'} />
      <View style={styles.form}>
        <FormField label="Nom" value={name} onChangeText={setName} placeholder="Nom i cognoms" autoFocus />
        <View style={styles.optionalField}>
          <FormField label="Etiqueta per distingir-la (opcional)" value={disambiguation} onChangeText={setDisambiguation} placeholder="Només si hi ha noms repetits" />
          <MinText variant="caption" style={{ color: colors.secondary }}>Deixa-la en blanc si el nom ja és suficient. No cal indicar el càrrec ni l’equip.</MinText>
        </View>
      </View>
      {existing ? <Button label="Elimina la persona" icon="trash" variant="danger" onPress={remove} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.x4, marginBottom: spacing.x6 },
  optionalField: { gap: spacing.x1 },
});
