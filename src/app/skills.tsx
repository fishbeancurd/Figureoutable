import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C, R, Tint } from '@/constants/theme';
import { Badge, Button, Card, Chip, Field, ProgressBar, Row, Screen, T, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useCelebrate } from '@/components/Celebrate';
import { useStore } from '@/lib/store';
import { LEVEL_INFO, LEVELS } from '@/data/learn';
import { allSkills, completedIn, levelUnlocked, MASTERY, skillMastery, type SkillItem } from '@/lib/skills';
import type { SkillLevel } from '@/lib/types';
import { uid } from '@/lib/util';

function Stars({ n }: { n: number }) {
  return (
    <Row gap={2}>
      {[1, 2, 3, 4].map((i) => (
        <Icon key={i} name="star" size={15} color={i <= n ? C.butterDeep : C.inkFaint} fill={i <= n ? C.butterDeep : 'none'} strokeWidth={1.8} />
      ))}
    </Row>
  );
}

export default function Skills() {
  const { state, update } = useStore();
  const celebrate = useCelebrate();
  const dog = state.dog!;
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [cue, setCue] = useState('');
  const [notes, setNotes] = useState('');
  const [level, setLevel] = useState<SkillLevel>('advanced');
  const [confirmUnlock, setConfirmUnlock] = useState<SkillLevel | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const skills = allSkills(state);

  const addSkill = () => {
    const n = name.trim();
    if (!n || skills.some((k) => k.name.toLowerCase() === n.toLowerCase())) return;
    update((s) => ({ ...s, customSkills: [...s.customSkills, { id: uid(), name: n, cue: cue.trim() || undefined, notes: notes.trim() || undefined, level, createdAt: new Date().toISOString() }] }));
    celebrate({ xp: 0, title: `${n} added to ${dog.name}'s skills` });
    setName('');
    setCue('');
    setNotes('');
    setAdding(false);
  };

  const unlock = (lv: SkillLevel) => {
    update((s) => ({ ...s, unlockedLevels: [...new Set([...s.unlockedLevels, lv])] }));
    setConfirmUnlock(null);
    celebrate({ xp: 0, title: `${LEVEL_INFO[lv].label} skills unlocked`, levelUp: `Go ${dog.name}!` });
  };

  const duplicate = !!name.trim() && skills.some((k) => k.name.toLowerCase() === name.trim().toLowerCase());

  const row = (k: SkillItem, open: boolean) => {
    const m = skillMastery(state.logs, k.name);
    return (
      <View key={k.key} style={styles.skill}>
        <Pressable style={{ flex: 1, gap: 4 }} onPress={() => (k.lessonId ? router.push({ pathname: '/lesson/[id]', params: { id: k.lessonId } }) : setRemoveId(removeId === k.key ? null : k.key))} accessibilityRole="button">
          <Row gap={6}>
            <T v="bodyStrong">{k.name}</T>
            {k.custom && <Badge text="Yours" tint="peach" />}
          </Row>
          <Row gap={8}>
            <Stars n={m.stars} />
            <T v="small">
              {m.label} · {m.sessions} session{m.sessions === 1 ? '' : 's'}
            </T>
          </Row>
          {k.cue ? <T v="small">Cue: "{k.cue}"</T> : null}
          {removeId === k.key && (
            <Row gap={8} style={{ marginTop: 6 }}>
              <Button label="Remove skill" kind="danger" icon="trash" onPress={() => update((s) => ({ ...s, customSkills: s.customSkills.filter((c) => c.id !== k.key) }))} />
              <Button label="Keep" kind="ghost" onPress={() => setRemoveId(null)} />
            </Row>
          )}
        </Pressable>
        {open ? (
          <Button label="Practice" kind="soft" onPress={() => router.push({ pathname: '/log/[type]', params: { type: 'training', skill: k.name } })} />
        ) : (
          <Icon name="lock" size={18} color={C.inkFaint} />
        )}
      </View>
    );
  };

  return (
    <Screen tabs={false} header={<TopBar title={`${dog.name}'s skills`} />}>
      <Card tint="butter" style={{ gap: 8 }}>
        <T v="h3">How skills grow</T>
        <T>Every practice session you log adds to a skill. "Nailed it" counts 3 points, "Getting there" 2 and "Tricky" 1.</T>
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {MASTERY.slice(1).map((m) => (
            <Badge key={m.label} text={`${'★'.repeat(m.stars)} ${m.label} · ${m.min}+`} light />
          ))}
        </Row>
      </Card>

      {!adding ? (
        <Button label="Add your own skill" icon="plus" kind="dark" onPress={() => setAdding(true)} />
      ) : (
        <Animated.View entering={FadeInDown}>
          <Card style={{ gap: 12 }}>
            <T v="h2">New skill</T>
            <T v="small">Teaching something not on the list, like "ring the bell to go out" or "fetch my slippers"? Add it here and track it like any other skill.</T>
            <Field label="Skill name" value={name} onChangeText={setName} placeholder="e.g. Ring the bell" />
            {duplicate && <T v="small" style={{ color: C.danger }}>That skill is already on the list.</T>}
            <Field label="Cue word (optional)" value={cue} onChangeText={setCue} placeholder='e.g. "Bell"' />
            <View style={{ gap: 6 }}>
              <T v="label">Difficulty</T>
              <Row gap={6} style={{ flexWrap: 'wrap' }}>
                {LEVELS.map((lv) => (
                  <Chip key={lv} label={LEVEL_INFO[lv].label} tint={LEVEL_INFO[lv].tint} active={level === lv} onPress={() => setLevel(lv)} />
                ))}
              </Row>
              <T v="small">Harder skills earn more XP per session.</T>
            </View>
            <Field label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="How you're teaching it" />
            <Row gap={10}>
              <Button label="Cancel" kind="ghost" style={{ flex: 1 }} onPress={() => setAdding(false)} />
              <Button label="Add skill" icon="check" style={{ flex: 1 }} onPress={addSkill} disabled={!name.trim() || duplicate} />
            </Row>
          </Card>
        </Animated.View>
      )}

      {LEVELS.map((lv) => {
        const info = LEVEL_INFO[lv];
        const open = levelUnlocked(state, lv);
        const list = skills.filter((k) => k.level === lv);
        const done = info.needs ? completedIn(state, info.needs) : 0;
        return (
          <View key={lv} style={{ gap: 10 }}>
            <Card tint={info.tint} style={{ gap: 8 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="h2">{info.label}</T>
                {open ? <Badge text="Unlocked" light /> : <Badge text="Locked" dark />}
              </Row>
              <T>{info.blurb}</T>
              {!open && info.needs && (
                <>
                  <T v="small" style={{ color: C.ink }}>
                    Complete {info.needCount} {LEVEL_INFO[info.needs].label.toLowerCase()} lessons to unlock ({Math.min(done, info.needCount)}/{info.needCount}).
                  </T>
                  <ProgressBar value={done / info.needCount} color={Tint[info.tint][1]} height={8} />
                  {confirmUnlock === lv ? (
                    <Row gap={8}>
                      <Button label="Not yet" kind="ghost" style={{ flex: 1 }} onPress={() => setConfirmUnlock(null)} />
                      <Button label="Unlock now" kind="dark" style={{ flex: 1 }} onPress={() => unlock(lv)} />
                    </Row>
                  ) : (
                    <Pressable onPress={() => setConfirmUnlock(lv)} accessibilityRole="button">
                      <T v="bodyStrong" style={{ textDecorationLine: 'underline' }}>
                        {dog.name} is a fast learner? Unlock early
                      </T>
                    </Pressable>
                  )}
                </>
              )}
            </Card>
            {list.map((k) => row(k, open || k.custom))}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  skill: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.paper, borderRadius: R.md, padding: 14 },
});
