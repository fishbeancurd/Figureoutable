import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { C, R } from '@/constants/theme';
import { Badge, Button, Card, Chip, Field, Press, Row, Screen, Segmented, T, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import type { Food, FoodKind, Liking, Reaction, TreatValue } from '@/lib/types';
import { uid } from '@/lib/util';
import { findFoodFacts } from '@/data/foodSafety';

const LIKING_LABEL: Record<Liking, string> = { loves: 'Loves', likes: 'Likes', meh: 'Meh', dislikes: 'Refuses' };
const KIND_LABEL: Record<FoodKind, string> = { meal: 'Main food', treat: 'Treat', chew: 'Chew', fresh: 'Fresh food' };

const blank = (): Food => ({ id: uid(), name: '', kind: 'treat', kcalPerUnit: 3, unit: 'piece', liking: 'likes', treatValue: 'medium', reaction: 'none' });

export default function Foods() {
  const { state, update } = useStore();
  const [editing, setEditing] = useState<Food | null>(null);
  const [kcalText, setKcalText] = useState('');
  const [filter, setFilter] = useState<FoodKind | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const open = (f: Food) => {
    setEditing(f);
    setKcalText(String(f.kcalPerUnit));
    setConfirmDelete(false);
  };

  const save = () => {
    if (!editing || !editing.name.trim()) return;
    const f = { ...editing, name: editing.name.trim(), kcalPerUnit: Math.max(0, parseFloat(kcalText.replace(',', '.')) || 0) };
    update((s) => ({ ...s, foods: s.foods.some((x) => x.id === f.id) ? s.foods.map((x) => (x.id === f.id ? f : x)) : [...s.foods, f] }));
    setEditing(null);
  };

  const list = state.foods.filter((f) => filter === 'all' || f.kind === filter);
  const warn = editing?.name ? findFoodFacts(editing.name).find((f) => f.verdict !== 'safe') : undefined;

  return (
    <Screen tabs={false} header={<TopBar title="Food library" right={<Button label="Add" icon="plus" kind="soft" onPress={() => open(blank())} style={{ transform: [{ scale: 0.85 }] }} />} />}>
      <T style={{ color: C.inkSoft }}>Everything {state.dog?.name} eats, with how much they like it, how motivating it is, and any reactions. Logging a meal or treat keeps this up to date.</T>

      {editing && (
        <Animated.View entering={FadeInDown} layout={LinearTransition}>
          <Card style={{ gap: 14 }}>
            <T v="h2">{state.foods.some((f) => f.id === editing.id) ? 'Edit food' : 'New food'}</T>
            <Field label="Name" value={editing.name} onChangeText={(t) => setEditing({ ...editing, name: t })} placeholder="e.g. Freeze-dried liver" />
            {warn && (
              <View style={[styles.warn, { backgroundColor: warn.verdict === 'unsafe' ? C.dangerSoft : C.warnSoft }]}>
                <T v="bodyStrong">{warn.verdict === 'unsafe' ? 'Not safe for dogs' : 'Feed with care'}</T>
                <T v="small" style={{ color: C.ink }}>
                  {warn.why}
                </T>
              </View>
            )}
            <View style={{ gap: 6 }}>
              <T v="label">Type</T>
              <Row gap={6} style={{ flexWrap: 'wrap' }}>
                {(Object.keys(KIND_LABEL) as FoodKind[]).map((k) => (
                  <Chip key={k} label={KIND_LABEL[k]} active={editing.kind === k} onPress={() => setEditing({ ...editing, kind: k, unit: k === 'meal' ? 'cup' : editing.unit })} />
                ))}
              </Row>
            </View>
            <Row gap={10}>
              <View style={{ flex: 1 }}>
                <Field label="Calories per unit" value={kcalText} onChangeText={setKcalText} keyboardType="decimal-pad" placeholder="kcal" />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <T v="label">Unit</T>
                <Row gap={6} style={{ flexWrap: 'wrap' }}>
                  {['cup', 'g', 'piece'].map((u) => (
                    <Chip key={u} label={u} active={editing.unit === u} onPress={() => setEditing({ ...editing, unit: u })} />
                  ))}
                </Row>
              </View>
            </Row>
            <T v="small">Find kcal on the bag or packet. Kibble is often 350 to 450 kcal per cup.</T>
            <View style={{ gap: 6 }}>
              <T v="label">How much does {state.dog?.name} like it?</T>
              <Segmented options={(Object.keys(LIKING_LABEL) as Liking[]).map((v) => ({ value: v, label: LIKING_LABEL[v] }))} value={editing.liking} onChange={(v) => setEditing({ ...editing, liking: v })} />
            </View>
            {editing.kind !== 'meal' && (
              <View style={{ gap: 6 }}>
                <T v="label">Motivation value</T>
                <Segmented options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} value={editing.treatValue ?? 'medium'} onChange={(v: TreatValue) => setEditing({ ...editing, treatValue: v })} />
              </View>
            )}
            <View style={{ gap: 6 }}>
              <T v="label">Reactions</T>
              <Segmented options={[{ value: 'none', label: 'None' }, { value: 'upset', label: 'Upset tummy' }, { value: 'allergy', label: 'Allergy' }]} value={editing.reaction} onChange={(v: Reaction) => setEditing({ ...editing, reaction: v })} />
            </View>
            <Field label="Notes" value={editing.notes ?? ''} onChangeText={(t) => setEditing({ ...editing, notes: t })} placeholder="e.g. Best for recall practice" />
            <Row gap={10}>
              <Button label="Cancel" kind="ghost" style={{ flex: 1 }} onPress={() => setEditing(null)} />
              <Button label="Save" icon="check" style={{ flex: 1 }} onPress={save} disabled={!editing.name.trim()} />
            </Row>
            {state.foods.some((f) => f.id === editing.id) &&
              (confirmDelete ? (
                <Button label="Yes, delete this food" kind="danger" onPress={() => { update((s) => ({ ...s, foods: s.foods.filter((f) => f.id !== editing.id) })); setEditing(null); }} />
              ) : (
                <Button label="Delete" icon="trash" kind="ghost" onPress={() => setConfirmDelete(true)} />
              ))}
          </Card>
        </Animated.View>
      )}

      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        {(Object.keys(KIND_LABEL) as FoodKind[]).map((k) => (
          <Chip key={k} label={KIND_LABEL[k]} active={filter === k} onPress={() => setFilter(k)} />
        ))}
      </Row>

      <View style={{ gap: 10 }}>
        {list.map((f) => (
          <Press key={f.id} onPress={() => open(f)} accessibilityLabel={`Edit ${f.name}`}>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: f.kind === 'meal' ? C.peach : f.kind === 'fresh' ? C.mint : C.butter }]}>
                <Icon name={f.kind === 'meal' ? 'bowl' : 'bone'} size={20} color={f.kind === 'meal' ? C.peachDeep : f.kind === 'fresh' ? C.mintDeep : C.butterDeep} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <T v="bodyStrong">{f.name}</T>
                <T v="small">
                  {f.kcalPerUnit} kcal per {f.unit} · {KIND_LABEL[f.kind]}
                </T>
                <Row gap={6} style={{ flexWrap: 'wrap' }}>
                  <Badge text={LIKING_LABEL[f.liking]} tint={f.liking === 'loves' ? 'peach' : f.liking === 'dislikes' ? 'sky' : 'lavender'} />
                  {f.treatValue && f.kind !== 'meal' ? <Badge text={`${f.treatValue[0].toUpperCase()}${f.treatValue.slice(1)} value`} tint="butter" /> : null}
                  {f.reaction !== 'none' ? <Badge text={f.reaction === 'allergy' ? 'Allergy' : 'Upset tummy'} tint="rose" /> : null}
                </Row>
                {f.notes ? <T v="small">{f.notes}</T> : null}
              </View>
              <Icon name="edit" size={18} color={C.inkFaint} />
            </View>
          </Press>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.paper, borderRadius: R.lg, padding: 14 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  warn: { borderRadius: R.md, padding: 12, gap: 2 },
});
