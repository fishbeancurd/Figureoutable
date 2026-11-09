import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C, R, Tint } from '@/constants/theme';
import { Card, CountBadge, ProgressBar, Row, Screen, T, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useCelebrate } from '@/components/Celebrate';
import { useStore } from '@/lib/store';
import { CHECKLISTS } from '@/data/learn';

export default function ChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const list = CHECKLISTS.find((c) => c.id === id) ?? CHECKLISTS[0];
  const { state, update } = useStore();
  const celebrate = useCelebrate();
  const done = state.checklists[list.id] ?? [];

  const toggle = (itemId: string, label: string) => {
    const has = done.includes(itemId);
    const next = has ? done.filter((x) => x !== itemId) : [...done, itemId];
    update((s) => ({ ...s, checklists: { ...s.checklists, [list.id]: next } }));
    if (!has) celebrate(next.length === list.items.length ? { xp: 5, title: `${list.title} complete!`, levelUp: 'Checklist badge earned' } : { xp: 5, title: label });
  };

  return (
    <Screen tabs={false} header={<TopBar title="Checklist" />}>
      <Card tint={list.tint} style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h1" style={{ flex: 1 }}>
            {list.title}
          </T>
          <CountBadge done={done.length} total={list.items.length} />
        </Row>
        <T>{list.summary}</T>
        <ProgressBar value={done.length / list.items.length} color={Tint[list.tint][1]} />
      </Card>
      <View style={{ gap: 8 }}>
        {list.items.map((it, i) => {
          const on = done.includes(it.id);
          return (
            <Animated.View key={it.id} entering={FadeInDown.delay(i * 30)}>
              <Pressable onPress={() => toggle(it.id, it.label)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                <View style={[styles.row, on && { backgroundColor: Tint[list.tint][0] }]}>
                  <View style={[styles.box, on && { backgroundColor: Tint[list.tint][1], borderColor: Tint[list.tint][1] }]}>
                    {on && <Icon name="check" size={15} color="#fff" strokeWidth={3} />}
                  </View>
                  <T style={{ flex: 1, textDecorationLine: on ? 'line-through' : 'none', color: on ? C.inkSoft : C.ink }}>{it.label}</T>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.paper, borderRadius: R.md, padding: 14 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: C.inkFaint, alignItems: 'center', justifyContent: 'center' },
});
