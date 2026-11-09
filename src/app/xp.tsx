import React from 'react';
import { StyleSheet, View } from 'react-native';
import { C, R, Tint, type TintName } from '@/constants/theme';
import { Badge, Card, ProgressBar, Row, Screen, T, TopBar } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { useGame } from '@/lib/store';
import { GROOM_XP, LEVEL_TITLES, levelTitle } from '@/lib/dogmath';

const RULES: { icon: IconName; tint: TintName; title: string; how: string }[] = [
  { icon: 'paw', tint: 'mint', title: 'Walks and play', how: '5 XP, plus 1 XP for every 2 minutes (up to 40 extra). A 30 min walk earns 20 XP.' },
  { icon: 'medal', tint: 'lavender', title: 'Training', how: '10 XP, plus 2 XP per minute (up to 30 extra). Intermediate skills earn 25% more and advanced skills 50% more. "Nailed it" adds 10.' },
  { icon: 'bowl', tint: 'peach', title: 'Meals', how: '10 XP, plus 5 when the portion is within 20% of the target for this stage.' },
  { icon: 'bone', tint: 'butter', title: 'Treats', how: '3 XP, plus 2 while you stay inside the daily treat budget.' },
  { icon: 'potty', tint: 'butter', title: 'Potty', how: '15 XP for going outside. Accidents still earn 5 XP for logging honestly.' },
  { icon: 'brush', tint: 'sky', title: 'Grooming', how: `Nails ${GROOM_XP.nails}, bath ${GROOM_XP.bath}, brushing ${GROOM_XP.brush}, teeth ${GROOM_XP.teeth}, ears ${GROOM_XP.ears} and eyes ${GROOM_XP.eyes} XP. Tougher jobs earn more.` },
  { icon: 'scale', tint: 'mint', title: 'Weigh-ins and health notes', how: 'Weigh-ins 15 XP, health notes 10 XP and sleep 5 XP.' },
  { icon: 'calendar', tint: 'lavender', title: 'Daily plan', how: '5 XP for each routine task you tick off.' },
  { icon: 'book', tint: 'rose', title: 'Lessons, checklists and milestones', how: '10 XP per lesson step, 5 per checklist item and 50 per milestone sticker.' },
];

export default function XpScreen() {
  const game = useGame();
  return (
    <Screen tabs={false} header={<TopBar title="How XP works" />}>
      <Card tint="lavender" style={{ gap: 8 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h2">
            Level {game.level} · {levelTitle(game.level)}
          </T>
          <Badge text={`${game.streak} day streak`} dark />
        </Row>
        <ProgressBar value={game.into / game.need} color={C.lavenderDeep} />
        <T v="small" style={{ color: C.ink }}>
          {game.into} / {game.need} XP to level {game.level + 1} · {game.xp.toLocaleString()} XP in total
        </T>
      </Card>
      <T>XP rewards effort and good habits. Longer walks, longer training sessions, harder skills, right-sized meals and tough grooming jobs earn more. The exact XP shows on the Save button before you log.</T>
      <View style={{ gap: 10 }}>
        {RULES.map((r) => (
          <View key={r.title} style={styles.rule}>
            <View style={[styles.icon, { backgroundColor: Tint[r.tint][0] }]}>
              <Icon name={r.icon} size={20} color={Tint[r.tint][1]} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <T v="bodyStrong">{r.title}</T>
              <T v="small" style={{ color: C.ink }}>
                {r.how}
              </T>
            </View>
          </View>
        ))}
      </View>
      <Card style={{ gap: 8 }}>
        <T v="h3">Levels</T>
        <T v="small">Each level needs 150 XP more than the last, starting at 250.</T>
        {LEVEL_TITLES.map((t, i) => (
          <Row key={t} gap={10}>
            <View style={[styles.num, i + 1 <= game.level && { backgroundColor: C.lavenderDeep }]}>
              <T v="bodyStrong" style={{ color: i + 1 <= game.level ? '#fff' : C.inkSoft, fontSize: 13 }}>
                {i + 1}
              </T>
            </View>
            <T style={{ color: i + 1 <= game.level ? C.ink : C.inkSoft }}>{t}</T>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rule: { flexDirection: 'row', gap: 12, backgroundColor: C.paper, borderRadius: R.md, padding: 14, alignItems: 'flex-start' },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
});
