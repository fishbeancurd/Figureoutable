import React, { useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C, R, Tint } from '@/constants/theme';
import { Badge, Card, Chip, CountBadge, Press, ProgressBar, Row, Screen, SectionTitle, T } from '@/components/ui';
import { DogSwitcher } from '@/components/DogSwitcher';
import { Icon } from '@/components/Icon';
import { Mascot } from '@/components/Mascot';
import { useStore } from '@/lib/store';
import { snapshot } from '@/lib/dogmath';
import { CATEGORY_INFO, CHECKLISTS, LESSONS, LEVEL_INFO, LEVELS, tipsFor, type TipCategory } from '@/data/learn';
import { allSkills, completedIn, lessonComplete, levelUnlocked, nextLockedLevel, skillMastery } from '@/lib/skills';
import { pottyGuide } from '@/data/stages';

const FILTERS: (TipCategory | 'all')[] = ['all', 'training', 'potty', 'feeding', 'grooming', 'health', 'social', 'exercise', 'behavior', 'sleep'];

export default function Learn() {
  const { state } = useStore();
  const dog = state.dog!;
  const snap = snapshot(dog);
  const [cat, setCat] = useState<TipCategory | 'all'>('all');
  const [open, setOpen] = useState<string | null>(null);

  const lessons = LESSONS.filter((l) => cat === 'all' || l.cat === cat);
  const skillList = allSkills(state);
  const nextLocked = nextLockedLevel(state);
  const tips = tipsFor(snap.stage.id, cat === 'all' ? undefined : cat);
  const potty = pottyGuide(snap.weeks, snap.stage.id);

  return (
    <Screen>
      <View>
        <T v="h1">Learn and grow</T>
        <T v="small">Guides picked for {dog.name}'s stage</T>
      </View>

      <DogSwitcher />

      {/* Stage card */}
      <Card tint={snap.stage.tint} style={{ gap: 10 }} onPress={() => router.push('/journey')}>
        <Row gap={12}>
          <View style={{ flex: 1, gap: 4 }}>
            <Badge text={`Now: ${snap.stage.name}`} dark />
            <T v="h2">{snap.stage.nickname}</T>
            <T>{snap.stage.summary}</T>
          </View>
          <Mascot size={86} mood={snap.stage.id === 'baby' ? 'sleepy' : 'happy'} fur={dog.furColor} />
        </Row>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <Badge text={snap.stage.mealsPerDay} light />
          <Badge text={`Sleeps ${snap.stage.sleep}`} light />
          <Badge text={`Potty every ${potty.hold}h max`} light />
        </Row>
        <Row gap={6}>
          <T v="bodyStrong">See the full journey</T>
          <Icon name="chevron" size={16} color={C.ink} />
        </Row>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -18 }} contentInset={{ left: 18, right: 18 }} contentOffset={{ x: -18, y: 0 }}>
        <View style={{ width: 10 }} />
        {FILTERS.map((f) => (
          <Chip key={f} label={f === 'all' ? 'All' : CATEGORY_INFO[f].label} active={cat === f} tint={f === 'all' ? 'lavender' : CATEGORY_INFO[f].tint} onPress={() => setCat(f)} />
        ))}
        <View style={{ width: 10 }} />
      </ScrollView>

      {/* Skills */}
      <Card style={{ gap: 10 }} onPress={() => router.push('/skills')}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={10}>
            <View style={[styles.tipDot, { backgroundColor: C.butter, width: 42, height: 42, borderRadius: 21 }]}>
              <Icon name="star" size={20} color={C.butterDeep} fill={C.butterDeep} />
            </View>
            <View>
              <T v="h3">{dog.name}'s skills</T>
              <T v="small">
                {skillList.filter((k) => skillMastery(state.logs, k.name).stars >= 3).length} reliable · {skillList.length} on the list
              </T>
            </View>
          </Row>
          <Icon name="chevron" size={20} color={C.inkSoft} />
        </Row>
        {nextLocked ? (
          <>
            <T v="small" style={{ color: C.ink }}>
              Finish {LEVEL_INFO[nextLocked].needCount} {LEVEL_INFO[LEVEL_INFO[nextLocked].needs!].label.toLowerCase()} lessons to unlock {LEVEL_INFO[nextLocked].label.toLowerCase()} skills, or unlock them early for a fast learner.
            </T>
            <ProgressBar value={completedIn(state, LEVEL_INFO[nextLocked].needs!) / LEVEL_INFO[nextLocked].needCount} color={Tint[LEVEL_INFO[nextLocked].tint][1]} track={C.bg} height={8} />
          </>
        ) : (
          <T v="small" style={{ color: C.ink }}>All levels unlocked. Add your own skills for anything not on the list.</T>
        )}
      </Card>

      {/* Lessons by level */}
      {LEVELS.map((lv) => {
        const list = lessons.filter((l) => l.level === lv);
        if (!list.length) return null;
        const open = levelUnlocked(state, lv);
        return (
          <View key={lv} style={{ gap: 12 }}>
            <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
              <Row gap={8}>
                <T v="h2">{LEVEL_INFO[lv].label}</T>
                {!open && <Icon name="lock" size={16} color={C.inkSoft} />}
              </Row>
              <T v="small">
                {list.filter((l) => lessonComplete(state, l.id)).length}/{list.length} done
              </T>
            </Row>
            {list.map((l, i) => {
              const tint = CATEGORY_INFO[l.cat].tint;
              const done = (state.lessonSteps[l.id] ?? []).length;
              const young = l.minWeeks > snap.weeks;
              return (
                <Animated.View key={l.id} entering={FadeInDown.delay(i * 40)} style={{ opacity: open ? 1 : 0.6 }}>
                  <Press onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: l.id } })} accessibilityLabel={l.title}>
                    <View style={[styles.lesson, { backgroundColor: Tint[tint][0] }]}>
                      <View style={[styles.blob, { backgroundColor: 'rgba(255,255,255,0.35)' }]} />
                      <View style={{ flex: 1, gap: 4 }}>
                        <T v="label" style={{ color: C.inkSoft }}>
                          {CATEGORY_INFO[l.cat].label} · {l.minutes}
                        </T>
                        <T v="h2">{l.title}</T>
                        <T v="small" style={{ color: C.ink }} numberOfLines={2}>
                          {l.summary}
                        </T>
                        {!open ? (
                          <Row gap={6} style={{ marginTop: 4 }}>
                            <Icon name="lock" size={14} color={C.inkSoft} />
                            <T v="small">Unlocks with the {LEVEL_INFO[lv].label.toLowerCase()} level</T>
                          </Row>
                        ) : young ? (
                          <Row gap={6} style={{ marginTop: 4 }}>
                            <Icon name="clock" size={14} color={C.inkSoft} />
                            <T v="small">Best from {l.minWeeks} weeks</T>
                          </Row>
                        ) : (
                          <View style={[styles.startPill, { backgroundColor: done ? C.paper : C.pill }]}>
                            <T v="bodyStrong" style={{ fontSize: 13, color: done ? C.ink : '#fff' }}>
                              {done === 0 ? 'Start' : done >= l.steps.length ? 'Review' : 'Continue'}
                            </T>
                          </View>
                        )}
                      </View>
                      <CountBadge done={done} total={l.steps.length} />
                    </View>
                  </Press>
                </Animated.View>
              );
            })}
          </View>
        );
      })}

      {/* Checklists */}
      {cat === 'all' && (
        <>
          <SectionTitle title="Checklists for new owners" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 18 }} style={{ marginRight: -18 }}>
            {CHECKLISTS.map((c) => {
              const done = (state.checklists[c.id] ?? []).length;
              return (
                <Press key={c.id} onPress={() => router.push({ pathname: '/checklist/[id]', params: { id: c.id } })}>
                  <View style={[styles.checklist, { backgroundColor: Tint[c.tint][0] }]}>
                    <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Icon name="list" size={22} color={Tint[c.tint][1]} />
                      <CountBadge done={done} total={c.items.length} />
                    </Row>
                    <T v="h3">{c.title}</T>
                    <T v="small" numberOfLines={2} style={{ color: C.ink }}>
                      {c.summary}
                    </T>
                    <ProgressBar value={done / c.items.length} color={Tint[c.tint][1]} height={8} />
                  </View>
                </Press>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* Tips */}
      <SectionTitle title={`Tips for ${snap.stage.name.toLowerCase()}s`} />
      <Card style={{ paddingVertical: 4 }}>
        {tips.length === 0 && <T style={{ paddingVertical: 12, color: C.inkSoft }}>No tips in this category for this stage.</T>}
        {tips.map((t, i) => {
          const isOpen = open === t.id;
          const tint = CATEGORY_INFO[t.cat].tint;
          return (
            <Pressable
              key={t.id}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setOpen(isOpen ? null : t.id);
              }}
              style={[styles.tip, i > 0 && { borderTopWidth: 1, borderColor: C.line }]}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}>
              <Row gap={12}>
                <View style={[styles.tipDot, { backgroundColor: Tint[tint][0] }]}>
                  <Icon name="bulb" size={16} color={Tint[tint][1]} />
                </View>
                <T v="bodyStrong" style={{ flex: 1 }}>
                  {t.title}
                </T>
                <View style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}>
                  <Icon name="chevron" size={18} color={C.inkSoft} />
                </View>
              </Row>
              {isOpen && <T style={{ marginTop: 8, marginLeft: 46 }}>{t.body}</T>}
            </Pressable>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lesson: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: R.lg, padding: 16, overflow: 'hidden' },
  blob: { position: 'absolute', right: -30, bottom: -40, width: 130, height: 130, borderRadius: 65 },
  startPill: { alignSelf: 'flex-start', borderRadius: R.pill, paddingHorizontal: 16, paddingVertical: 7, marginTop: 6 },
  checklist: { width: 200, borderRadius: R.lg, padding: 14, gap: 8 },
  tip: { paddingVertical: 14 },
  tipDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
