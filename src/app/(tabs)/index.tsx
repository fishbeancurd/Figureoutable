import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C, F, R, Tint, shadow } from '@/constants/theme';
import { Badge, Button, Card, DogAvatar, IconBubble, Press, ProgressBar, Ring, Row, Screen, SectionTitle, T } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useCelebrate } from '@/components/Celebrate';
import { useGame, useStore } from '@/lib/store';
import { ageLabel, dayKey, levelTitle, logsOn, snapshot, sumKcal, sumMinutes } from '@/lib/dogmath';
import { greeting, shortTime } from '@/lib/util';
import { fmtTime, ROUTINE_TYPE_TINT } from '@/lib/routine';
import { tipOfTheDay, CATEGORY_INFO } from '@/data/learn';
import { STAGES, pottyGuide } from '@/data/stages';
import { LOG_META, QUICK_LOGS, describeLog } from '@/data/logMeta';

export default function Home() {
  const { state, update } = useStore();
  const game = useGame();
  const celebrate = useCelebrate();
  const dog = state.dog!;
  const now = new Date();
  const snap = snapshot(dog, now);
  const today = logsOn(state.logs, now);
  const kcal = sumKcal(today);
  const active = sumMinutes(today, ['walk', 'play']);
  const trainMin = sumMinutes(today, ['training']);
  const trainTarget = ['baby', 'puppy', 'junior'].includes(snap.stage.id) ? 10 : 10;
  const pottyCount = today.filter((l) => l.type === 'potty').length;
  const accidents = today.filter((l) => l.type === 'potty' && l.accident).length;
  const treatKcal = sumKcal(today.filter((l) => l.type === 'treat'));
  const tip = tipOfTheDay(snap.stage.id, now);
  const potty = pottyGuide(snap.weeks, snap.stage.id);

  const todayKey = dayKey(now);
  const done = state.routineDone[todayKey] ?? [];
  const dow = now.getDay();
  const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todays = state.routine.filter((r) => r.days.includes(dow));
  const upNext = todays.filter((r) => !done.includes(r.id) && r.time >= fromPast(nowHHMM)).slice(0, 3);
  const routinePct = todays.length ? done.filter((id) => todays.some((r) => r.id === id)).length / todays.length : 0;

  const markDone = (id: string, title: string) => {
    update((s) => ({ ...s, routineDone: { ...s.routineDone, [todayKey]: [...(s.routineDone[todayKey] ?? []), id] } }));
    celebrate({ xp: 5, title: `${title.split(' · ')[0]} done` });
  };

  const stageIdx = STAGES.findIndex((s) => s.id === snap.stage.id);

  return (
    <Screen>
      {/* Greeting */}
      <Row style={{ justifyContent: 'space-between' }}>
        <Press onPress={() => router.push('/profile')} accessibilityLabel="Open profile">
          <Row gap={12}>
            <View style={styles.avatarRing}>
              <DogAvatar dog={dog} size={48} />
            </View>
            <View>
              <T v="h2">
                {greeting(now)}
                {state.owner.name ? `, ${state.owner.name}` : ''}
              </T>
              <T v="small">
                {dog.name} is {ageLabel(snap.weeks)} old
              </T>
            </View>
          </Row>
        </Press>
        <View style={styles.streak}>
          <Icon name="flame" size={18} color={C.peachDeep} fill={C.peach} />
          <T v="bodyStrong" style={{ fontSize: 14 }}>
            {game.streak}
          </T>
        </View>
      </Row>

      {/* Level hero */}
      <Animated.View entering={FadeInDown.duration(500)}>
        <LinearGradient colors={['#B9A8F2', '#9C88EC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={[styles.heroBlob, { right: -40, top: -50, backgroundColor: 'rgba(255,255,255,0.14)' }]} />
          <View style={[styles.heroBlob, { left: -30, bottom: -70, width: 160, height: 160, backgroundColor: 'rgba(255,220,203,0.25)' }]} />
          <View style={{ flex: 1, gap: 8 }}>
            <Badge text={`${snap.stage.name} · ${snap.stage.nickname}`} tint={snap.stage.tint} />
            <T v="h1" style={{ color: '#fff' }}>
              Level {game.level}
            </T>
            <T v="bodyStrong" style={{ color: 'rgba(255,255,255,0.92)', marginTop: -6 }}>
              {levelTitle(game.level)}
            </T>
            <ProgressBar value={game.into / game.need} color={C.peachDeep} track="rgba(255,255,255,0.35)" />
            <T v="small" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {game.into} / {game.need} XP to level {game.level + 1}
            </T>
          </View>
          <DogAvatar dog={dog} size={118} />
        </LinearGradient>
      </Animated.View>

      {/* Quick log */}
      <View style={{ gap: 10 }}>
        <SectionTitle title="Log something" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4, paddingRight: 10 }} style={{ marginHorizontal: -6 }}>
          {QUICK_LOGS.map((t) => (
            <IconBubble key={t} icon={LOG_META[t].icon} tint={LOG_META[t].tint} label={LOG_META[t].label} onPress={() => router.push({ pathname: '/log/[type]', params: { type: t } })} />
          ))}
        </ScrollView>
      </View>

      {/* Today */}
      <Card style={{ gap: 14 }} onPress={() => router.push('/track')}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h2">Today</T>
          <T v="small">Tap for dashboard</T>
        </Row>
        <Row style={{ justifyContent: 'space-around' }}>
          <RingStat label="Food" value={kcal} target={snap.cal.daily} unit="kcal" tint="peach" />
          <RingStat label="Activity" value={active} target={snap.exerciseTarget} unit="min" tint="mint" />
          <RingStat label="Training" value={trainMin} target={trainTarget} unit="min" tint="lavender" />
        </Row>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <Badge text={`${pottyCount} potty trips${accidents ? ` · ${accidents} accident${accidents > 1 ? 's' : ''}` : ''}`} tint="butter" />
          <Badge text={`Treats ${treatKcal}/${snap.cal.treatBudget} kcal`} tint={treatKcal > snap.cal.treatBudget ? 'rose' : 'mint'} />
          <Badge text={`Hold up to ${potty.hold}h`} tint="sky" />
        </Row>
      </Card>

      {/* Up next */}
      <View style={{ gap: 10 }}>
        <SectionTitle title="Up next" action="Full plan" onAction={() => router.push('/plan')} />
        <Card style={{ gap: 12 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="small">Today's routine</T>
            <T v="small" style={{ fontFamily: F.bodyHeavy, color: C.ink }}>
              {Math.round(routinePct * 100)}% done
            </T>
          </Row>
          <ProgressBar value={routinePct} color={C.mintDeep} track={C.mint} height={8} />
          {upNext.length === 0 ? (
            <T style={{ color: C.inkSoft }}>All caught up for today. Nice work!</T>
          ) : (
            upNext.map((r) => {
              const tint = ROUTINE_TYPE_TINT[r.type] ?? 'lavender';
              return (
                <Row key={r.id} gap={12}>
                  <View style={[styles.timePill, { backgroundColor: Tint[tint][0] }]}>
                    <T v="small" style={{ color: C.ink, fontFamily: F.bodyHeavy }}>
                      {fmtTime(r.time)}
                    </T>
                  </View>
                  <T v="bodyStrong" style={{ flex: 1 }} numberOfLines={2}>
                    {r.title}
                  </T>
                  <Press onPress={() => markDone(r.id, r.title)} accessibilityLabel={`Mark ${r.title} done`}>
                    <View style={styles.doneBtn}>
                      <Icon name="check" size={18} color={C.mintDeep} strokeWidth={3} />
                    </View>
                  </Press>
                </Row>
              );
            })
          )}
        </Card>
      </View>

      {/* Tip */}
      <Card tint={CATEGORY_INFO[tip.cat].tint} style={{ gap: 8 }} onPress={() => router.push('/learn')}>
        <Row gap={10}>
          <View style={styles.tipIcon}>
            <Icon name="bulb" size={20} color={Tint[CATEGORY_INFO[tip.cat].tint][1]} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="label">Tip for {snap.stage.name.toLowerCase()}s · {CATEGORY_INFO[tip.cat].label}</T>
            <T v="h3">{tip.title}</T>
          </View>
        </Row>
        <T>{tip.body}</T>
      </Card>

      {/* Journey teaser */}
      <Card style={{ gap: 12 }} onPress={() => router.push('/journey')}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h2">{dog.name}'s journey</T>
          <Icon name="chevron" size={20} color={C.inkSoft} />
        </Row>
        <Row gap={0} style={{ justifyContent: 'space-between' }}>
          {STAGES.map((s, i) => (
            <React.Fragment key={s.id}>
              <View style={{ alignItems: 'center', gap: 4, width: 46 }}>
                <View style={[styles.stageDot, { backgroundColor: i <= stageIdx ? Tint[s.tint][0] : C.bg, borderColor: i === stageIdx ? Tint[s.tint][1] : 'transparent' }]}>
                  {i < stageIdx ? <Icon name="check" size={14} color={Tint[s.tint][1]} strokeWidth={3} /> : i === stageIdx ? <Icon name="paw" size={14} color={Tint[s.tint][1]} /> : <Icon name="lock" size={12} color={C.inkFaint} />}
                </View>
                <T v="small" style={{ fontSize: 10, textAlign: 'center', color: i === stageIdx ? C.ink : C.inkSoft }} numberOfLines={1}>
                  {s.name.replace(' puppy', '')}
                </T>
              </View>
              {i < STAGES.length - 1 && <View style={[styles.stageLine, { backgroundColor: i < stageIdx ? C.lavenderDeep : C.line }]} />}
            </React.Fragment>
          ))}
        </Row>
        <T v="small">{Object.keys(state.milestones).length} milestone stickers collected</T>
      </Card>

      {/* Recent */}
      <View style={{ gap: 10 }}>
        <SectionTitle title="Recent" action="See all" onAction={() => router.push('/track')} />
        {state.logs.length === 0 ? (
          <Card style={{ gap: 10, alignItems: 'flex-start' }}>
            <T>Nothing logged yet. Start with breakfast or a potty trip to earn your first XP.</T>
            <Button label="Log a meal" icon="bowl" kind="soft" onPress={() => router.push({ pathname: '/log/[type]', params: { type: 'meal' } })} />
          </Card>
        ) : (
          <Card style={{ gap: 12 }}>
            {state.logs.slice(0, 5).map((l) => (
              <Row key={l.id} gap={12}>
                <View style={[styles.logIcon, { backgroundColor: Tint[LOG_META[l.type].tint][0] }]}>
                  <Icon name={LOG_META[l.type].icon} size={18} color={Tint[LOG_META[l.type].tint][1]} />
                </View>
                <View style={{ flex: 1 }}>
                  <T v="bodyStrong" numberOfLines={1}>
                    {describeLog(l)}
                  </T>
                  <T v="small">
                    {LOG_META[l.type].label} · {shortTime(l.at)}
                  </T>
                </View>
                {l.reaction && l.reaction !== 'none' ? <Badge text={l.reaction === 'allergy' ? 'Allergy' : 'Upset'} tint="rose" /> : null}
              </Row>
            ))}
          </Card>
        )}
      </View>
    </Screen>
  );
}

/** Include items from the last half hour so a just-missed task still shows up. */
function fromPast(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const t = Math.max(0, h * 60 + m - 30);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

function RingStat({ label, value, target, unit, tint }: { label: string; value: number; target: number; unit: string; tint: 'peach' | 'mint' | 'lavender' }) {
  const [soft, strong] = Tint[tint];
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Ring value={target ? value / target : 0} size={82} stroke={10} color={strong} track={soft}>
        <T v="h3" style={{ fontSize: 17 }}>
          {Math.round((value / Math.max(1, target)) * 100)}%
        </T>
      </Ring>
      <T v="bodyStrong" style={{ fontSize: 13 }}>
        {label}
      </T>
      <T v="small" style={{ marginTop: -6 }}>
        {value}/{target} {unit}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarRing: { borderRadius: 30, padding: 2, backgroundColor: C.paper, ...shadow },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.paper, paddingHorizontal: 12, height: 38, borderRadius: R.pill, ...shadow },
  hero: { borderRadius: R.xl, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 6, overflow: 'hidden', minHeight: 170 },
  heroBlob: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
  timePill: { borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 6, minWidth: 74, alignItems: 'center' },
  doneBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  tipIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  stageDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  stageLine: { flex: 1, height: 3, borderRadius: 2, marginTop: -18 },
  logIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
