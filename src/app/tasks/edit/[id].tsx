import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';

import type { ChecklistItem, RoleAssignment, Task } from '@/domain/models';
import { canEditDocument } from '@/domain/permissions';
import { parseSharedDocument } from '@/domain/schema';
import { useAppData } from '@/features/app-data/app-data-provider';
import { BottomActionBar } from '@/ui/components/bottom-action-bar';
import { Button, IconButton } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { DateTimeField } from '@/ui/components/date-time-field';
import { EmptyState } from '@/ui/components/empty-state';
import { FormField } from '@/ui/components/form-field';
import { MinIcon } from '@/ui/components/icon';
import { MinText } from '@/ui/components/min-text';
import { NavigationHeader } from '@/ui/components/navigation-header';
import { Screen } from '@/ui/components/screen';
import { SegmentedControl } from '@/ui/components/segmented-control';
import { spacing } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

type Kind = Task['kind'];

function toggleId(values: string[], id: string): string[] {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
}

export default function EditTaskScreen() {
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const { selected, saveDraft } = useAppData();
  const { colors } = useMinTheme();
  const base = selected?.draft ?? selected?.document;
  const existing = id === 'new' ? undefined : base?.tasks.find((task) => task.id === id);
  const [fallbackStart] = useState(() => new Date());
  const defaultStart = new Date(base?.event.startsAt ?? fallbackStart);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [kind, setKind] = useState<Kind>(existing?.kind ?? 'point');
  const [startsAt, setStartsAt] = useState(() => new Date(existing?.kind !== 'after' ? existing?.startsAt ?? defaultStart : defaultStart));
  const [endsAt, setEndsAt] = useState(() => new Date(existing?.kind === 'interval' ? existing.endsAt : defaultStart.getTime() + 60 * 60 * 1_000));
  const [afterTaskId, setAfterTaskId] = useState(existing?.kind === 'after' ? existing.afterTaskId : base?.tasks.find((task) => task.id !== id)?.id ?? '');
  const [place, setPlace] = useState(existing?.place ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [common, setCommon] = useState(existing?.common ?? false);
  const [personIds, setPersonIds] = useState(existing?.personIds ?? []);
  const [teamIds, setTeamIds] = useState(existing?.teamIds ?? []);
  const [roles, setRoles] = useState<RoleAssignment[]>(() => existing?.roles.map((role) => ({ ...role, personIds: [...role.personIds], teamIds: [...role.teamIds] })) ?? []);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => existing?.checklist.map((item) => ({ ...item })) ?? []);
  const [saving, setSaving] = useState(false);
  const dependencies = useMemo(() => base?.tasks.filter((task) => task.id !== id) ?? [], [base?.tasks, id]);

  if (!selected || !base) return <Screen><EmptyState title="Cap esdeveniment obert" body="Obre un esdeveniment abans de gestionar tasques." /></Screen>;
  if (!canEditDocument(selected)) return <Screen><NavigationHeader title="Tasca" /><EmptyState title="Còpia de consulta" body="Duplica l’esdeveniment abans de modificar-ne les tasques." /></Screen>;

  const updateRole = (roleId: string, patch: Partial<RoleAssignment>) => setRoles((current) => current.map((role) => role.id === roleId ? { ...role, ...patch } : role));
  const addRole = () => setRoles((current) => [...current, { id: Crypto.randomUUID(), name: '', personIds: [], teamIds: [] }]);
  const addChecklistItem = () => setChecklist((current) => [...current, { id: Crypto.randomUUID(), text: '' }]);

  const submit = async () => {
    if (!title.trim()) { Alert.alert('Falta el títol', 'Escriu què s’ha de fer.'); return; }
    if (kind === 'interval' && endsAt <= startsAt) { Alert.alert('Interval incorrecte', 'El final ha de ser posterior a l’inici.'); return; }
    if (kind === 'after' && !afterTaskId) { Alert.alert('Falta la dependència', 'Tria quina tasca ha d’acabar abans.'); return; }
    if (roles.some((role) => !role.name.trim())) { Alert.alert('Falta una funció', 'Posa nom a totes les funcions o elimina les buides.'); return; }
    if (checklist.some((item) => !item.text.trim())) { Alert.alert('Checklist incomplet', 'Escriu tots els punts o elimina els buits.'); return; }
    setSaving(true);
    try {
      const shared = {
        id: existing?.id ?? Crypto.randomUUID(),
        title: title.trim(),
        ...(category.trim() ? { category: category.trim() } : {}),
        sortOrder: existing?.sortOrder ?? base.tasks.length,
        ...(place.trim() ? { place: place.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        personIds,
        teamIds,
        roles: roles.map((role) => ({ ...role, name: role.name.trim() })),
        common,
        checklist: checklist.map((item) => ({ ...item, text: item.text.trim() })),
      };
      const task: Task = kind === 'point'
        ? { ...shared, kind, startsAt: startsAt.toISOString() }
        : kind === 'interval'
          ? { ...shared, kind, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() }
          : { ...shared, kind, afterTaskId };
      const tasks = existing ? base.tasks.map((candidate) => candidate.id === existing.id ? task : candidate) : [...base.tasks, task];
      await saveDraft(parseSharedDocument({ ...base, tasks }));
      if (returnTo === 'editor') router.replace('/editor');
      else router.back();
    } catch (error) {
      Alert.alert('No s’ha pogut desar', error instanceof Error ? error.message : 'Revisa les dades.');
    } finally { setSaving(false); }
  };

  const remove = () => {
    if (!existing) return;
    const dependents = base.tasks.filter((task) => task.kind === 'after' && task.afterTaskId === existing.id);
    if (dependents.length) { Alert.alert('No es pot eliminar', 'Primer resol les tasques que depenen d’aquesta.'); return; }
    Alert.alert('Elimina la tasca?', 'Només s’eliminarà de l’esborrany local.', [
      { text: 'Cancel·la', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: async () => { await saveDraft(parseSharedDocument({ ...base, tasks: base.tasks.filter((task) => task.id !== existing.id) })); router.replace('/editor'); } },
    ]);
  };

  return (
    <Screen
      keyboardShouldPersistTaps="handled"
      footer={<BottomActionBar><Button label="Desa la tasca" icon="check" loading={saving} onPress={submit} /></BottomActionBar>}>
      <NavigationHeader title={existing ? 'Edita la tasca' : 'Nova tasca'} />
      <View style={styles.formSection}>
        <FormField label="Títol" value={title} onChangeText={setTitle} placeholder="Què s’ha de fer?" autoFocus />
        <FormField label="Categoria o àmbit" value={category} onChangeText={setCategory} placeholder="Opcional" />
        <SegmentedControl label="Tipus temporal" value={kind} options={[{ value: 'point', label: 'Hora puntual' }, { value: 'interval', label: 'Interval' }, { value: 'after', label: 'En acabar' }]} onChange={setKind} />
        {kind !== 'after' ? <DateTimeField label="Comença" value={startsAt} onChange={setStartsAt} /> : (
          <View style={styles.group}>
            <MinText variant="metadata" style={styles.fieldLabel}>Després de</MinText>
            {dependencies.length ? dependencies.map((task) => (
              <Pressable key={task.id} accessibilityRole="radio" accessibilityState={{ checked: task.id === afterTaskId }} onPress={() => setAfterTaskId(task.id)} style={styles.optionRow}>
                <MinIcon name={task.id === afterTaskId ? 'radioOn' : 'radioOff'} size={22} color={task.id === afterTaskId ? colors.brand : colors.secondary} />
                <MinText style={styles.optionText}>{task.title}</MinText>
              </Pressable>
            )) : <MinText style={{ color: colors.secondary }}>Crea primer una altra tasca per poder-hi vincular aquesta.</MinText>}
          </View>
        )}
        {kind === 'interval' ? <DateTimeField label="Acaba" value={endsAt} onChange={setEndsAt} /> : null}
        <FormField label="Lloc" value={place} onChangeText={setPlace} placeholder="Opcional" />
        <FormField label="Instruccions" value={notes} onChangeText={setNotes} placeholder="Opcional" multiline />
      </View>

      <View style={[styles.switchRow, { borderColor: colors.line }]}>
        <View style={styles.optionText}>
          <MinText style={{ fontWeight: '600' }}>Tasca general</MinText>
          <MinText variant="caption" style={{ color: colors.secondary }}>És rellevant per a tota la colla, encara que també tingui responsables.</MinText>
        </View>
        <Switch accessibilityLabel="Tasca general" value={common} onValueChange={setCommon} trackColor={{ false: colors.line, true: colors.brand }} thumbColor={colors.raised} />
      </View>

      <View style={styles.section}>
        <MinText variant="label">Responsables directes</MinText>
        {base.people.length ? base.people.map((person) => {
          const checked = personIds.includes(person.id);
          return <Pressable key={person.id} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => setPersonIds((current) => toggleId(current, person.id))} style={styles.optionRow}><MinIcon name={checked ? 'checked' : 'unchecked'} size={24} color={checked ? colors.brand : colors.secondary} /><MinText style={styles.optionText}>{person.name}</MinText></Pressable>;
        }) : <MinText style={{ color: colors.secondary }}>Encara no hi ha persones al directori.</MinText>}
        {base.teams.length ? <MinText variant="metadata" style={[styles.subheading, { color: colors.secondary }]}>Equips responsables</MinText> : null}
        {base.teams.map((team) => {
          const checked = teamIds.includes(team.id);
          return <Pressable key={team.id} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => setTeamIds((current) => toggleId(current, team.id))} style={styles.optionRow}><MinIcon name={checked ? 'checked' : 'unchecked'} size={24} color={checked ? colors.brand : colors.secondary} /><View style={styles.optionText}><MinText>{team.name}</MinText><MinText variant="caption" style={{ color: colors.secondary }}>{team.personIds.length} persones</MinText></View></Pressable>;
        })}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}><View style={styles.optionText}><MinText variant="label">Funcions concretes</MinText><MinText variant="caption" style={{ color: colors.secondary }}>Ex.: Enceses, carro o coordinació.</MinText></View><Button label="Afegeix" icon="add" variant="secondary" onPress={addRole} style={styles.smallButton} /></View>
        {roles.map((role, roleIndex) => (
          <Card key={role.id} style={styles.roleCard}>
            <View style={styles.sectionHeader}>
              <MinText variant="metadata" style={{ color: colors.secondary }}>Funció {roleIndex + 1}</MinText>
              <IconButton icon="trash" label={`Elimina la funció ${role.name || roleIndex + 1}`} onPress={() => setRoles((current) => current.filter((item) => item.id !== role.id))} />
            </View>
            <FormField label="Nom de la funció" value={role.name} onChangeText={(name) => updateRole(role.id, { name })} placeholder="Què han de fer?" reserveErrorSpace={false} />
            {base.people.map((person) => {
              const checked = role.personIds.includes(person.id);
              return <Pressable key={person.id} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => updateRole(role.id, { personIds: toggleId(role.personIds, person.id) })} style={styles.optionRow}><MinIcon name={checked ? 'checked' : 'unchecked'} size={22} color={checked ? colors.brand : colors.secondary} /><MinText style={styles.optionText}>{person.name}</MinText></Pressable>;
            })}
            {base.teams.map((team) => {
              const checked = role.teamIds.includes(team.id);
              return <Pressable key={team.id} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => updateRole(role.id, { teamIds: toggleId(role.teamIds, team.id) })} style={styles.optionRow}><MinIcon name={checked ? 'checked' : 'unchecked'} size={22} color={checked ? colors.brand : colors.secondary} /><MinText style={styles.optionText}>{team.name} · equip</MinText></Pressable>;
            })}
          </Card>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}><View style={styles.optionText}><MinText variant="label">Checklist personal</MinText><MinText variant="caption" style={{ color: colors.secondary }}>Cada persona marca la seva còpia; no es comparteix.</MinText></View><Button label="Afegeix" icon="add" variant="secondary" onPress={addChecklistItem} style={styles.smallButton} /></View>
        {checklist.map((item, index) => (
          <View key={item.id} style={styles.checklistRow}>
            <View style={styles.optionText}><FormField label={`Punt ${index + 1}`} value={item.text} onChangeText={(text) => setChecklist((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, text } : candidate))} reserveErrorSpace={false} /></View>
            <IconButton icon="trash" label={`Elimina el punt ${index + 1}`} onPress={() => setChecklist((current) => current.filter((candidate) => candidate.id !== item.id))} />
          </View>
        ))}
      </View>

      {existing ? <Button label="Elimina la tasca" icon="trash" variant="danger" onPress={remove} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  formSection: { gap: spacing.x4 },
  section: { gap: spacing.x3, marginTop: spacing.x8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
  group: { gap: spacing.x2, marginVertical: spacing.x2 },
  fieldLabel: { fontWeight: '600' },
  optionRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
  optionText: { flex: 1, minWidth: 0 },
  switchRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, marginTop: spacing.x6, paddingVertical: spacing.x3, borderTopWidth: 1, borderBottomWidth: 1 },
  subheading: { marginTop: spacing.x3, fontWeight: '600' },
  smallButton: { paddingHorizontal: spacing.x3 },
  roleCard: { gap: spacing.x3 },
  checklistRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.x2 },
});
