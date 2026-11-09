import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { C, R, Tint } from '@/constants/theme';
import { Badge, Button, Card, CountBadge, ProgressBar, Row, Screen, T, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Mascot } from '@/components/Mascot';
import { useCelebrate } from '@/components/Celebrate';
import { useStore } from '@/lib/store';
import { CATEGORY_INFO, LESSONS, LEVEL_INFO } from '@/data/learn';
import { SKILL_LESSONS, completedIn, levelUnlocked, skillMastery } from '@/lib/skills';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = LESSONS.find((l) => l.id === id) ?? LESSONS[0];
  const { state, update } = useStore();
  const celebrate = useCelebrate();
  const done = state.lessonSteps[lesson.id] ?? [];
  const tint = CATEGORY_INFO[lesson.cat].tint;
  const complete = done.length >= lesson.steps.length;

  const open = levelUnlocked(state, lesson.level);
  const info = LEVEL_INFO[lesson.level];
  const mastery = skillMastery(state.logs, lesson.title);

  const toggle = (i: number) => {
    if (!open) return;
    const has = done.includes(i);
    const next = has ? done.filter((x) => x !== i) : [...done, i];
    update((s) => ({ ...s, lessonSteps: { ...s.lessonSteps, [lesson.id]: next } }));
    if (!has) {
      celebrate(next.length >= lesson.steps.length ? { xp: 10, title: `${lesson.title} complete!`, levelUp: 'Lesson badge earned' } : { xp: 10, title: `Step ${i + 1} done` });
    }
  };

  const isSkill = SKILL_LESSONS.some((l) => l.id === lesson.id);
  const logType = isSkill ? 'training' : lesson.cat === 'potty' ? 'potty' : lesson.cat === 'grooming' ? 'grooming' : 'training';

  return (
    <Screen tabs={false} header={<TopBar title={CATEGORY_INFO[lesson.cat].label} />}>
      <View style={[styles.hero, { backgroundColor: Tint[tint][0] }]}>
        <View style={{ flex: 1, gap: 6 }}>
          <Badge text={lesson.minutes} dark />
          <T v="hero">{lesson.title}</T>
          <T>{lesson.summary}</T>
        </View>
        <Animated.View entering={ZoomIn.delay(150)}>
          <Mascot size={96} fur={state.dog?.furColor} cheerKey={done.length} />
        </Animated.View>
      </View>

      <Row gap={8}>
        <Badge text={info.label} tint={info.tint} />
        <Badge text={`${'★'.repeat(mastery.stars) || '☆'} ${mastery.label} · ${mastery.sessions} sessions`} light />
      </Row>

      {!open && info.needs && (
        <Card tint={info.tint} style={{ gap: 8 }}>
          <T v="h3">This is a {info.label.toLowerCase()} skill</T>
          <T>
            It unlocks after {info.needCount} {LEVEL_INFO[info.needs].label.toLowerCase()} lessons ({Math.min(completedIn(state, info.needs), info.needCount)}/{info.needCount} done). If {state.dog?.name} picks things up quickly, you can unlock it now.
          </T>
          <Button
            label={`Unlock ${info.label.toLowerCase()} skills`}
            kind="dark"
            icon="star"
            onPress={() => {
              update((s) => ({ ...s, unlockedLevels: [...new Set([...s.unlockedLevels, lesson.level])] }));
              celebrate({ xp: 0, title: `${info.label} skills unlocked` });
            }}
          />
        </Card>
      )}

      <Row gap={12} style={{ opacity: open ? 1 : 0.5 }}>
        <View style={{ flex: 1 }}>
          <ProgressBar value={done.length / lesson.steps.length} color={Tint[tint][1]} track={C.paper} />
        </View>
        <CountBadge done={done.length} total={lesson.steps.length} />
      </Row>

      <View style={{ gap: 10 }}>
        {lesson.steps.map((s, i) => {
          const on = done.includes(i);
          return (
            <Animated.View key={i} entering={FadeInDown.delay(i * 50)}>
              <Pressable onPress={() => toggle(i)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                <View style={[styles.step, on && { backgroundColor: Tint[tint][0] }]}>
                  <View style={[styles.num, { backgroundColor: on ? Tint[tint][1] : C.bg }]}>
                    {on ? <Icon name="check" size={16} color="#fff" strokeWidth={3} /> : <T v="bodyStrong">{i + 1}</T>}
                  </View>
                  <T style={{ flex: 1 }}>{s}</T>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <Card tint="butter" style={{ gap: 4 }}>
        <Row gap={8}>
          <Icon name="bulb" size={18} color={C.butterDeep} />
          <T v="h3">Pro tip</T>
        </Row>
        <T>{lesson.pro}</T>
      </Card>

      {complete && (
        <Card tint="mint" style={{ alignItems: 'center', gap: 4 }}>
          <T v="h2">Lesson complete</T>
          <T style={{ textAlign: 'center' }}>Keep practicing a few minutes a day. Short and frequent beats long and rare.</T>
        </Card>
      )}

      {open && (
        <Button
          label="Log a practice session"
          icon="medal"
          onPress={() => router.push({ pathname: '/log/[type]', params: isSkill ? { type: logType, skill: lesson.title } : { type: logType } })}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: R.xl, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 8 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.paper, borderRadius: R.md, padding: 14 },
  num: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
