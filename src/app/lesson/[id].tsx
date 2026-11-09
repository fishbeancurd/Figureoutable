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
import { CATEGORY_INFO, LESSONS } from '@/data/learn';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = LESSONS.find((l) => l.id === id) ?? LESSONS[0];
  const { state, update } = useStore();
  const celebrate = useCelebrate();
  const done = state.lessonSteps[lesson.id] ?? [];
  const tint = CATEGORY_INFO[lesson.cat].tint;
  const complete = done.length >= lesson.steps.length;

  const toggle = (i: number) => {
    const has = done.includes(i);
    const next = has ? done.filter((x) => x !== i) : [...done, i];
    update((s) => ({ ...s, lessonSteps: { ...s.lessonSteps, [lesson.id]: next } }));
    if (!has) {
      celebrate(next.length >= lesson.steps.length ? { xp: 10, title: `${lesson.title} complete!`, levelUp: 'Lesson badge earned' } : { xp: 10, title: `Step ${i + 1} done` });
    }
  };

  const logType = lesson.cat === 'potty' ? 'potty' : lesson.cat === 'grooming' ? 'grooming' : lesson.cat === 'exercise' ? 'walk' : 'training';

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

      <Row gap={12}>
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

      <Button label="Log a practice session" icon="medal" onPress={() => router.push({ pathname: '/log/[type]', params: { type: logType } })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: R.xl, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 8 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.paper, borderRadius: R.md, padding: 14 },
  num: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
