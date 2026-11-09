import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { C, F, R, Tint, shadow } from '@/constants/theme';
import { Badge, Button, Card, Field, Press, Ring, Row, Screen, Segmented, SectionTitle, T } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useCelebrate } from '@/components/Celebrate';
import { useStore } from '@/lib/store';
import type { Owner, RoutineItem } from '@/lib/types';
import { buildRoutine, fmtTime, fromMin, ROUTINE_TYPE_TINT, toMin } from '@/lib/routine';
import { remindersSupported, syncReminders } from '@/lib/reminders';
import { dayKey, snapshot } from '@/lib/dogmath';
import { pottyGuide } from '@/data/stages';
import { uid } from '@/lib/util';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const TYPES: { value: RoutineItem['type']; label: string }[] = [
  { value: 'meal-time', label: 'Meal' },
  { value: 'potty-break', label: 'Potty' },
  { value: 'walk', label: 'Walk' },
  { value: 'training', label: 'Training' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'nap', label: 'Nap' },
  { value: 'health', label: 'Health' },
];

export default function Plan() {
  const { state, update } = useStore();
  const celebrate = useCelebrate();
  const dog = state.dog!;
  const snap = snapshot(dog);
  const today = new Date();
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<RoutineItem | null>(null);
  const [schedOpen, setSchedOpen] = useState(false);

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i - 1);
    return d;
  });
  const selected = week[offset + 1];
  const isToday = offset === 0;
  const key = dayKey(selected);
  const items = state.routine.filter((r) => r.days.includes(selected.getDay())).sort((a, b) => a.time.localeCompare(b.time));
  const done = state.routineDone[key] ?? [];
  const pct = items.length ? items.filter((i) => done.includes(i.id)).length / items.length : 0;
  const nowHHMM = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
  const nextId = isToday ? items.find((i) => !done.includes(i.id) && i.time >= nowHHMM)?.id : undefined;

  const persistRoutine = async (routine: RoutineItem[], remindersOn = state.remindersOn) => {
    update((s) => ({ ...s, routine, remindersOn }));
    const synced = await syncReminders(routine, dog.name, remindersOn).catch(() => routine);
    update((s) => ({ ...s, routine: synced }));
  };

  const toggleDone = (item: RoutineItem) => {
    if (!isToday && offset > 0) return;
    const was = done.includes(item.id);
    update((s) => ({ ...s, routineDone: { ...s.routineDone, [key]: was ? done.filter((x) => x !== item.id) : [...done, item.id] } }));
    if (!was) celebrate({ xp: 5, title: `${item.title.split(' · ')[0]} done` });
  };

  const saveItem = (item: RoutineItem) => {
    const exists = state.routine.some((r) => r.id === item.id);
    persistRoutine(exists ? state.routine.map((r) => (r.id === item.id ? item : r)) : [...state.routine, item]);
    setEditing(null);
  };
  const deleteItem = (id: string) => {
    persistRoutine(state.routine.filter((r) => r.id !== id));
    setEditing(null);
  };

  const potty = pottyGuide(snap.weeks, snap.stage.id);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <T v="h1">Daily plan</T>
          <T v="small">Built around your day and {dog.name}'s needs</T>
        </View>
        <Ring value={pct} size={60} stroke={8} color={C.mintDeep} track={C.mint}>
          <T v="bodyStrong" style={{ fontSize: 13 }}>
            {Math.round(pct * 100)}%
          </T>
        </Ring>
      </Row>

      {/* Day strip */}
      <Row gap={6} style={{ justifyContent: 'space-between' }}>
        {week.map((d, i) => {
          const on = i === offset + 1;
          return (
            <Press key={i} onPress={() => setOffset(i - 1)} style={{ flex: 1 }}>
              <View style={[styles.day, on && { backgroundColor: C.pill }]}>
                <T v="small" style={{ color: on ? '#CFC6E2' : C.inkSoft, fontSize: 11 }}>
                  {i === 1 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })}
                </T>
                <T v="h3" style={{ color: on ? '#fff' : C.ink }}>
                  {d.getDate()}
                </T>
              </View>
            </Press>
          );
        })}
      </Row>

      {/* Timeline */}
      <View style={{ gap: 8 }}>
        {items.length === 0 && <T style={{ color: C.inkSoft }}>Nothing planned for this day.</T>}
        {items.map((item, i) => {
          const tint = ROUTINE_TYPE_TINT[item.type] ?? 'lavender';
          const isDone = done.includes(item.id);
          const isNext = item.id === nextId;
          return (
            <Animated.View key={item.id} entering={FadeInDown.delay(i * 30)} layout={LinearTransition}>
              <Row gap={10} style={{ alignItems: 'stretch' }}>
                <View style={{ width: 62, paddingTop: 14 }}>
                  <T v="small" style={{ fontFamily: F.bodyHeavy, color: isNext ? C.peachDeep : C.inkSoft }}>
                    {fmtTime(item.time)}
                  </T>
                </View>
                <Press style={{ flex: 1 }} onPress={() => setEditing(item)} accessibilityLabel={`Edit ${item.title}`}>
                  <View style={[styles.block, { backgroundColor: isNext ? C.paper : Tint[tint][0], opacity: isDone ? 0.55 : 1 }, isNext && { borderColor: C.peachDeep, ...shadow }]}>
                    <View style={[styles.bar, { backgroundColor: Tint[tint][1] }]} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <T v="bodyStrong" style={{ textDecorationLine: isDone ? 'line-through' : 'none' }}>
                        {item.title}
                      </T>
                      <Row gap={6}>
                        {isNext && <Badge text="Next up" tint="peach" />}
                        {item.remind && <Icon name="bell" size={13} color={C.inkSoft} />}
                        {item.days.length < 7 && <T v="small">{item.days.map((d) => DAYS[d]).join(' ')}</T>}
                      </Row>
                    </View>
                    {offset <= 0 && (
                      <Pressable onPress={() => toggleDone(item)} hitSlop={8} accessibilityLabel={isDone ? 'Mark not done' : 'Mark done'} style={[styles.check, isDone && { backgroundColor: C.mintDeep, borderColor: C.mintDeep }]}>
                        {isDone && <Icon name="check" size={16} color="#fff" strokeWidth={3} />}
                      </Pressable>
                    )}
                  </View>
                </Press>
              </Row>
            </Animated.View>
          );
        })}
      </View>

      <Row gap={10}>
        <Button label="Add task" icon="plus" kind="soft" style={{ flex: 1 }} onPress={() => setEditing({ id: uid(), title: '', type: 'walk', time: fromMin(Math.ceil((today.getHours() * 60 + today.getMinutes()) / 15) * 15 + 30), days: [0, 1, 2, 3, 4, 5, 6], remind: true, minutes: 15 })} />
        <Button label="Fit to my day" icon="refresh" kind="dark" style={{ flex: 1 }} onPress={() => setSchedOpen(true)} />
      </Row>

      {/* Reminders */}
      <Card style={{ gap: 8 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={10}>
            <View style={[styles.bell, { backgroundColor: C.peach }]}>
              <Icon name="bell" size={18} color={C.peachDeep} />
            </View>
            <View>
              <T v="bodyStrong">Reminders</T>
              <T v="small">10 minutes before each task</T>
            </View>
          </Row>
          <Switch value={state.remindersOn} onValueChange={(v) => persistRoutine(state.routine, v)} trackColor={{ true: C.mintDeep, false: C.line }} thumbColor="#fff" />
        </Row>
        {!remindersSupported && <T v="small">Reminders work in the phone app. In a web browser they are turned off.</T>}
      </Card>

      {/* Why */}
      <SectionTitle title="Why this plan" />
      <Card tint="lavender" style={{ gap: 8 }}>
        <Why icon="potty" text={`At ${Math.floor(snap.weeks)} weeks ${dog.name} can hold it about ${potty.hold} hours, so potty breaks are never further apart than that.`} />
        <Why icon="bowl" text={`${snap.cal.meals} meals of about ${snap.cal.perMeal} kcal, with the last one at least 3 hours before bed for an easier night.`} />
        <Why icon="paw" text={`About ${snap.exerciseTarget} minutes of activity split into two sessions, gentle on growing joints.`} />
        <Why icon="moon" text={`${snap.stage.name}s need ${snap.stage.sleep}. Naps are part of the plan.`} />
      </Card>

      <EditSheet key={editing?.id ?? 'none'} item={editing} onClose={() => setEditing(null)} onSave={saveItem} onDelete={deleteItem} />
      <ScheduleSheet
        key={schedOpen ? 'open' : 'closed'}
        open={schedOpen}
        owner={state.owner}
        onClose={() => setSchedOpen(false)}
        onApply={(owner) => {
          update((s) => ({ ...s, owner }));
          persistRoutine(buildRoutine(dog, owner));
          setSchedOpen(false);
        }}
      />
    </Screen>
  );
}

function Why({ icon, text }: { icon: 'potty' | 'bowl' | 'paw' | 'moon'; text: string }) {
  return (
    <Row gap={10} style={{ alignItems: 'flex-start' }}>
      <Icon name={icon} size={18} color={C.lavenderDeep} />
      <T style={{ flex: 1 }}>{text}</T>
    </Row>
  );
}

function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h1">{title}</T>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
            <Icon name="close" size={22} />
          </Pressable>
        </Row>
        <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 30, paddingTop: 12 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

function TimeRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <T v="bodyStrong">{label}</T>
      <Row gap={8}>
        <Pressable onPress={() => onChange(fromMin(toMin(value) - 15))} style={styles.tbtn} accessibilityLabel={`${label} earlier`}>
          <Icon name="minus" size={16} />
        </Pressable>
        <T v="h3" style={{ width: 84, textAlign: 'center' }}>
          {fmtTime(value)}
        </T>
        <Pressable onPress={() => onChange(fromMin(toMin(value) + 15))} style={styles.tbtn} accessibilityLabel={`${label} later`}>
          <Icon name="plus" size={16} />
        </Pressable>
      </Row>
    </Row>
  );
}

function EditSheet({ item, onClose, onSave, onDelete }: { item: RoutineItem | null; onClose: () => void; onSave: (i: RoutineItem) => void; onDelete: (id: string) => void }) {
  const [draft, setDraft] = useState<RoutineItem | null>(item);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!draft) return null;
  const isNew = !item?.title;
  return (
    <Sheet open={!!item} onClose={onClose} title={isNew ? 'New task' : 'Edit task'}>
      <Field label="What" value={draft.title} onChangeText={(t) => setDraft({ ...draft, title: t })} placeholder="e.g. Sniff walk" />
      <View style={{ gap: 6 }}>
        <T v="label">Type</T>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {TYPES.map((t) => (
            <Pressable key={t.value} onPress={() => setDraft({ ...draft, type: t.value })} style={[styles.typeChip, { backgroundColor: draft.type === t.value ? C.pill : Tint[ROUTINE_TYPE_TINT[t.value] ?? 'lavender'][0] }]}>
              <T v="bodyStrong" style={{ fontSize: 13, color: draft.type === t.value ? '#fff' : C.ink }}>
                {t.label}
              </T>
            </Pressable>
          ))}
        </Row>
      </View>
      <TimeRow label="Time" value={draft.time} onChange={(v) => setDraft({ ...draft, time: v })} />
      <View style={{ gap: 6 }}>
        <T v="label">Repeat on</T>
        <Row gap={6}>
          {DAYS.map((d, i) => {
            const on = draft.days.includes(i);
            return (
              <Pressable key={i} onPress={() => setDraft({ ...draft, days: on ? draft.days.filter((x) => x !== i) : [...draft.days, i].sort() })} style={[styles.dayToggle, on && { backgroundColor: C.lavenderDeep }]} accessibilityLabel={`Toggle day ${i}`}>
                <T v="bodyStrong" style={{ color: on ? '#fff' : C.inkSoft }}>
                  {d}
                </T>
              </Pressable>
            );
          })}
        </Row>
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="bodyStrong">Remind me 10 min before</T>
        <Switch value={draft.remind} onValueChange={(v) => setDraft({ ...draft, remind: v })} trackColor={{ true: C.mintDeep, false: C.line }} thumbColor="#fff" />
      </Row>
      <Button label="Save" icon="check" onPress={() => draft.title.trim() && draft.days.length && onSave({ ...draft, title: draft.title.trim() })} disabled={!draft.title.trim() || !draft.days.length} />
      {!isNew &&
        (confirmDelete ? (
          <Row gap={10}>
            <Button label="Keep it" kind="ghost" style={{ flex: 1 }} onPress={() => setConfirmDelete(false)} />
            <Button label="Delete task" kind="danger" style={{ flex: 1 }} onPress={() => onDelete(draft.id)} />
          </Row>
        ) : (
          <Button label="Delete" icon="trash" kind="ghost" onPress={() => setConfirmDelete(true)} />
        ))}
    </Sheet>
  );
}

function ScheduleSheet({ open, owner, onClose, onApply }: { open: boolean; owner: Owner; onClose: () => void; onApply: (o: Owner) => void }) {
  const [o, setO] = useState(owner);
  return (
    <Sheet open={open} onClose={onClose} title="Fit to my day">
      <T style={{ color: C.inkSoft }}>Update your hours and we'll rebuild the plan. This replaces your current tasks, including ones you edited.</T>
      <Card style={{ gap: 14 }}>
        <TimeRow label="Wake up" value={o.wake} onChange={(v) => setO({ ...o, wake: v })} />
        <TimeRow label="Bedtime" value={o.bed} onChange={(v) => setO({ ...o, bed: v })} />
        <TimeRow label="Work starts" value={o.workStart} onChange={(v) => setO({ ...o, workStart: v })} />
        <TimeRow label="Work ends" value={o.workEnd} onChange={(v) => setO({ ...o, workEnd: v })} />
      </Card>
      <Segmented options={[{ value: 'out', label: 'I go out to work' }, { value: 'home', label: 'I work from home' }]} value={o.worksFromHome ? 'home' : 'out'} onChange={(v) => setO({ ...o, worksFromHome: v === 'home' })} />
      <View style={{ gap: 6 }}>
        <T v="label">Work days</T>
        <Row gap={6}>
          {DAYS.map((d, i) => {
            const on = o.workDays.includes(i);
            return (
              <Pressable key={i} onPress={() => setO({ ...o, workDays: on ? o.workDays.filter((x) => x !== i) : [...o.workDays, i].sort() })} style={[styles.dayToggle, on && { backgroundColor: C.lavenderDeep }]}>
                <T v="bodyStrong" style={{ color: on ? '#fff' : C.inkSoft }}>
                  {d}
                </T>
              </Pressable>
            );
          })}
        </Row>
      </View>
      <Button label="Rebuild my plan" icon="refresh" onPress={() => onApply(o)} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  day: { alignItems: 'center', paddingVertical: 8, borderRadius: R.md, backgroundColor: C.paper, gap: 2 },
  block: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: R.md, padding: 12, paddingLeft: 14, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  check: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: C.inkFaint, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  bell: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(46,37,65,0.35)' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingTop: 10, maxHeight: '88%' },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: C.inkFaint, marginBottom: 12 },
  tbtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.lavender, alignItems: 'center', justifyContent: 'center' },
  typeChip: { borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 8 },
  dayToggle: { flex: 1, height: 40, borderRadius: 20, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
});
