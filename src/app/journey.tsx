import React, { useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { C, Tint, shadow } from '@/constants/theme';
import { Badge, Card, DogAvatar, Row, Screen, T, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useCelebrate } from '@/components/Celebrate';
import { useStore } from '@/lib/store';
import { ageLabel, snapshot } from '@/lib/dogmath';
import { STAGES } from '@/data/stages';
import { MILESTONES, type Milestone } from '@/data/learn';
import { isoDate } from '@/lib/util';

function Sticker({ m, earned, onPress }: { m: Milestone; earned?: string; onPress: () => void }) {
  const wiggle = useSharedValue(0);
  useEffect(() => {
    if (earned) wiggle.set(withRepeat(withSequence(withTiming(1, { duration: 1800 }), withTiming(0, { duration: 1800 })), -1, true));
  }, [earned, wiggle]);
  const a = useAnimatedStyle(() => ({ transform: [{ rotate: `${-6 + wiggle.value * 8}deg` }] }));
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${m.label}${earned ? ', earned' : ''}`} style={{ alignItems: 'center', width: 84, gap: 4 }}>
      <Animated.View style={[styles.sticker, { backgroundColor: earned ? Tint[m.tint][0] : C.line }, earned && shadow, a]}>
        <T v="h3" style={{ color: earned ? Tint[m.tint][1] : C.inkFaint, fontSize: 14 }}>
          {earned ? m.sticker : '?'}
        </T>
      </Animated.View>
      <T v="small" style={{ textAlign: 'center', fontSize: 11, color: earned ? C.ink : C.inkSoft }} numberOfLines={2}>
        {m.label}
      </T>
    </Pressable>
  );
}

export default function Journey() {
  const { state, update } = useStore();
  const celebrate = useCelebrate();
  const dog = state.dog!;
  const snap = snapshot(dog);
  const { width } = useWindowDimensions();
  const w = Math.min(width, 520) - 36;
  const current = STAGES.findIndex((s) => s.id === snap.stage.id);
  const rowH = 120;
  const h = rowH * STAGES.length;

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 1600 }), -1, false));
  }, [pulse]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - pulse.value), transform: [{ scale: 1 + pulse.value * 0.5 }] }));

  // Winding path: nodes alternate left and right, from the bottom (start) up to the top.
  const nodes = STAGES.map((s, i) => ({ x: i % 2 === 0 ? w * 0.22 : w * 0.78, y: h - rowH / 2 - i * rowH }));
  let d = `M${nodes[0].x} ${nodes[0].y}`;
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1];
    const b = nodes[i];
    d += ` C ${a.x} ${a.y - rowH * 0.6}, ${b.x} ${b.y + rowH * 0.6}, ${b.x} ${b.y}`;
  }

  const toggle = (m: Milestone) => {
    const has = !!state.milestones[m.id];
    update((s) => {
      const ms = { ...s.milestones };
      if (has) delete ms[m.id];
      else ms[m.id] = isoDate(new Date());
      return { ...s, milestones: ms };
    });
    if (!has) celebrate({ xp: 50, title: `Sticker: ${m.label}` });
  };

  const earnedCount = Object.keys(state.milestones).length;

  return (
    <Screen tabs={false} header={<TopBar title={`${dog.name}'s journey`} />}>
      <Card tint="lavender" style={{ gap: 4 }}>
        <T v="h2">
          {ageLabel(snap.weeks)} · {snap.stage.name}
        </T>
        <T>Collect a sticker for each milestone. Tap a sticker to mark it, and tap again to undo.</T>
        <Badge text={`${earnedCount} of ${MILESTONES.length} stickers`} dark />
      </Card>

      <View style={{ width: w, height: h }}>
        <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
          <Path d={d} stroke="#D9CFEF" strokeWidth={14} fill="none" strokeLinecap="round" />
          <Path d={d} stroke="#fff" strokeWidth={3} fill="none" strokeDasharray="2 12" strokeLinecap="round" />
        </Svg>
        {STAGES.map((s, i) => {
          const n = nodes[i];
          const past = i < current;
          const here = i === current;
          const left = i % 2 === 0;
          return (
            <Animated.View key={s.id} entering={FadeInDown.delay((STAGES.length - i) * 80)} style={[styles.node, { top: n.y - 32, left: left ? n.x - 32 : undefined, right: left ? undefined : w - n.x - 32, flexDirection: left ? 'row' : 'row-reverse' }]}>
              <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
                {here && <Animated.View style={[styles.pulse, { backgroundColor: Tint[s.tint][1] }, ring]} />}
                <View style={[styles.circle, { backgroundColor: past || here ? Tint[s.tint][0] : C.paper }, here && { borderColor: Tint[s.tint][1] }]}>
                  {here ? <DogAvatar dog={dog} size={50} /> : past ? <Icon name="check" size={22} color={Tint[s.tint][1]} strokeWidth={3} /> : <Icon name="lock" size={18} color={C.inkFaint} />}
                </View>
              </View>
              <View style={{ maxWidth: w * 0.5, alignItems: left ? 'flex-start' : 'flex-end' }}>
                <T v="h3" style={{ color: past || here ? C.ink : C.inkSoft }}>
                  {s.name}
                </T>
                <T v="small" style={{ textAlign: left ? 'left' : 'right' }}>
                  {here ? 'You are here' : s.nickname}
                </T>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {STAGES.map((s) => {
        const ms = MILESTONES.filter((m) => m.stage === s.id);
        if (!ms.length) return null;
        return (
          <Card key={s.id} style={{ gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="h3">{s.name} milestones</T>
              <Badge text={`${ms.filter((m) => state.milestones[m.id]).length}/${ms.length}`} tint={s.tint} />
            </Row>
            <Row gap={4} style={{ flexWrap: 'wrap' }}>
              {ms.map((m) => (
                <Animated.View key={m.id} entering={ZoomIn}>
                  <Sticker m={m} earned={state.milestones[m.id]} onPress={() => toggle(m)} />
                </Animated.View>
              ))}
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  node: { position: 'absolute', alignItems: 'center', gap: 10 },
  circle: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', overflow: 'hidden' },
  pulse: { position: 'absolute', width: 64, height: 64, borderRadius: 32 },
  sticker: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
