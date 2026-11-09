import React, { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { C, R, Tint } from '@/constants/theme';
import { Badge, Button, Card, Chip, Row, Screen, Segmented, SectionTitle, T } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { BarChart, GrowthChart, HourDots } from '@/components/Charts';
import { useStore } from '@/lib/store';
import { dayKey, expectedWeightKg, lastNDays, latestWeightKg, logsOn, snapshot, sumKcal, sumMinutes } from '@/lib/dogmath';
import { LOG_META, describeLog } from '@/data/logMeta';
import { relDay, shortTime } from '@/lib/util';
import type { GroomTask, LogType } from '@/lib/types';

const GROOM_DUE: Record<GroomTask, { label: string; every: number }> = {
  teeth: { label: 'Teeth', every: 2 },
  brush: { label: 'Coat', every: 7 },
  nails: { label: 'Nails', every: 21 },
  bath: { label: 'Bath', every: 42 },
  ears: { label: 'Ears', every: 14 },
  eyes: { label: 'Eyes', every: 7 },
};

export default function Track() {
  const { state } = useStore();
  const dog = state.dog!;
  const { width } = useWindowDimensions();
  const chartW = Math.min(width, 520) - 36 - 32;
  const [range, setRange] = useState<'week' | 'month'>('week');
  const [filter, setFilter] = useState<LogType | 'all'>('all');
  const snap = snapshot(dog);
  const nowMs = new Date().getTime();

  const days = lastNDays(range === 'week' ? 7 : 28);
  const perDay = days.map((d) => {
    const l = logsOn(state.logs, d);
    return {
      d,
      kcal: sumKcal(l),
      treat: sumKcal(l.filter((x) => x.type === 'treat')),
      active: sumMinutes(l, ['walk', 'play']),
      train: sumMinutes(l, ['training']),
      potty: l.filter((x) => x.type === 'potty').length,
      accidents: l.filter((x) => x.type === 'potty' && x.accident).length,
    };
  });
  // Month view groups days into 4 weekly bars.
  const group = (key: 'kcal' | 'active' | 'train') =>
    range === 'week'
      ? perDay.map((p, i) => ({ label: p.d.toLocaleDateString(undefined, { weekday: 'narrow' }), value: p[key], highlight: i === perDay.length - 1 }))
      : [0, 1, 2, 3].map((w) => {
          const slice = perDay.slice(w * 7, w * 7 + 7);
          return { label: w === 3 ? 'This wk' : `${3 - w} wk ago`, value: Math.round(slice.reduce((s, p) => s + p[key], 0) / 7), highlight: w === 3 };
        });

  const loggedDays = perDay.filter((p) => p.kcal > 0);
  const avgKcal = loggedDays.length ? Math.round(loggedDays.reduce((s, p) => s + p.kcal, 0) / loggedDays.length) : 0;
  const totalKcal = perDay.reduce((s, p) => s + p.kcal, 0);
  const periodTarget = snap.cal.daily * perDay.length;
  const treatShare = totalKcal ? Math.round((perDay.reduce((s, p) => s + p.treat, 0) / totalKcal) * 100) : 0;
  const avgActive = Math.round(perDay.reduce((s, p) => s + p.active, 0) / perDay.length);
  const trips = perDay.reduce((s, p) => s + p.potty, 0);
  const accidents = perDay.reduce((s, p) => s + p.accidents, 0);
  const successRate = trips ? Math.round(((trips - accidents) / trips) * 100) : 0;

  const latest = latestWeightKg(dog);
  const expected = expectedWeightKg(dog, snap.weeks);
  const weightStatus = !latest ? null : latest < expected * 0.85 ? 'below' : latest > expected * 1.15 ? 'above' : 'on track';

  const pottyDots = state.logs
    .filter((l) => l.type === 'potty' && nowMs - new Date(l.at).getTime() < 7 * 86400000)
    .map((l) => ({ hour: new Date(l.at).getHours() + new Date(l.at).getMinutes() / 60, accident: !!l.accident }));

  const foods = state.foods;
  const loves = foods.filter((f) => f.liking === 'loves');
  const highValue = foods.filter((f) => f.treatValue === 'high');
  const refused = foods.filter((f) => f.liking === 'dislikes');
  const reactions = foods.filter((f) => f.reaction !== 'none');

  const lastGroom = useMemo(() => {
    const out: Partial<Record<GroomTask, string>> = {};
    for (const l of state.logs) if (l.type === 'grooming' && l.groom && !out[l.groom]) out[l.groom] = l.at;
    return out;
  }, [state.logs]);

  const history = state.logs.filter((l) => filter === 'all' || l.type === filter).slice(0, 40);
  const historyByDay: { day: string; items: typeof history }[] = [];
  for (const l of history) {
    const k = dayKey(l.at);
    const last = historyByDay[historyByDay.length - 1];
    if (last && last.day === k) last.items.push(l);
    else historyByDay.push({ day: k, items: [l] });
  }

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <T v="h1">Dashboard</T>
          <T v="small">
            {dog.name} · {snap.stage.name} · target {snap.cal.daily} kcal/day
          </T>
        </View>
      </Row>
      <Segmented options={[{ value: 'week', label: 'This week' }, { value: 'month', label: 'Last 4 weeks' }]} value={range} onChange={setRange} />

      {/* Growth */}
      <Card style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h2">Growth</T>
          {weightStatus && <Badge text={weightStatus === 'on track' ? 'On track' : weightStatus === 'below' ? 'Below range' : 'Above range'} tint={weightStatus === 'on track' ? 'mint' : 'butter'} />}
        </Row>
        <Row gap={18}>
          <View>
            <T v="num">{latest ? `${latest} kg` : 'No weigh-in'}</T>
            <T v="small">latest</T>
          </View>
          <View>
            <T v="num" style={{ color: C.mintDeep }}>
              {(expected * 0.85).toFixed(1)} to {(expected * 1.15).toFixed(1)}
            </T>
            <T v="small">expected kg now</T>
          </View>
        </Row>
        <GrowthChart dog={dog} width={chartW} />
        <Row gap={14}>
          <Legend color={C.peachDeep} label={dog.name} />
          <Legend color={C.mint} label={`Typical ${dog.size} breed`} />
          <Legend color={C.lavenderDeep} label="Today" />
        </Row>
        {weightStatus && weightStatus !== 'on track' && (
          <T v="small">Breeds and individuals vary. If the curve keeps drifting away from the band, check portion sizes and ask your vet about body condition.</T>
        )}
        <Button label="Log weight" icon="scale" kind="soft" onPress={() => router.push({ pathname: '/log/[type]', params: { type: 'weight' } })} />
      </Card>

      {/* Calories */}
      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h2">Calories</T>
          <Badge text={`${snap.cal.daily} kcal/day target`} tint="peach" />
        </Row>
        <BarChart data={group('kcal')} target={snap.cal.daily} color={C.peachDeep} soft={C.peach} unit="kcal" />
        <T v="small">Dashed line is {dog.name}'s daily target. Darker bars hit at least 90% of it.</T>
        <Row gap={10}>
          <Mini label={range === 'week' ? 'This week' : '4 weeks'} value={`${totalKcal.toLocaleString()}`} sub={`of ${periodTarget.toLocaleString()} kcal`} tint="peach" />
          <Mini label="Daily average" value={`${avgKcal}`} sub="kcal on logged days" tint="butter" />
          <Mini label="From treats" value={`${treatShare}%`} sub="aim for 10% or less" tint={treatShare > 12 ? 'rose' : 'mint'} />
        </Row>
        <T v="small">{snap.cal.explain} Monthly target: about {snap.cal.monthly.toLocaleString()} kcal.</T>
      </Card>

      {/* Activity */}
      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h2">Exercise and play</T>
          <Badge text={`${snap.exerciseTarget} min/day`} tint="mint" />
        </Row>
        <BarChart data={group('active')} target={snap.exerciseTarget} color={C.mintDeep} soft={C.mint} unit="min" height={100} />
        <T v="small">Average {avgActive} min a day. Training: {perDay.reduce((s, p) => s + p.train, 0)} min in this period.</T>
      </Card>

      {/* Potty */}
      <Card style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h2">Potty</T>
          <Badge text={`${successRate}% outside`} tint={successRate >= 90 ? 'mint' : 'butter'} />
        </Row>
        <Row gap={10}>
          <Mini label="Trips" value={`${trips}`} sub={`${(trips / perDay.length).toFixed(1)} a day`} tint="butter" />
          <Mini label="Accidents" value={`${accidents}`} sub={range === 'week' ? 'this week' : 'in 4 weeks'} tint={accidents ? 'rose' : 'mint'} />
        </Row>
        <T v="label">When {dog.name} goes (last 7 days)</T>
        <HourDots entries={pottyDots} width={chartW} />
        <T v="small">Yellow is outside and pink is an accident. Clusters show the best times to head out.</T>
      </Card>

      {/* Food insights */}
      <Card style={{ gap: 10 }} onPress={() => router.push('/foods')}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h2">Food insights</T>
          <Icon name="chevron" size={20} color={C.inkSoft} />
        </Row>
        <FoodRow label="Loves" items={loves.map((f) => f.name)} tint="peach" />
        <FoodRow label="High-value treats" items={highValue.map((f) => f.name)} tint="lavender" />
        <FoodRow label="Refuses" items={refused.map((f) => f.name)} tint="sky" />
        <FoodRow label="Reactions" items={reactions.map((f) => `${f.name} (${f.reaction === 'allergy' ? 'allergy' : 'upset'})`)} tint="rose" />
      </Card>

      {/* Grooming */}
      <Card style={{ gap: 10 }}>
        <T v="h2">Grooming</T>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {(Object.keys(GROOM_DUE) as GroomTask[]).map((g) => {
            const last = lastGroom[g];
            const daysAgo = last ? Math.floor((nowMs - new Date(last).getTime()) / 86400000) : null;
            const due = daysAgo === null || daysAgo >= GROOM_DUE[g].every;
            return (
              <View key={g} style={[styles.groom, { backgroundColor: due ? C.rose : C.sky }]}>
                <T v="bodyStrong" style={{ fontSize: 13 }}>
                  {GROOM_DUE[g].label}
                </T>
                <T v="small" style={{ color: C.ink }}>
                  {daysAgo === null ? 'Not yet' : daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                  {due ? ' · due' : ''}
                </T>
              </View>
            );
          })}
        </Row>
      </Card>

      {/* History */}
      <SectionTitle title="History" />
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        {(['meal', 'treat', 'walk', 'potty', 'training', 'grooming', 'health', 'weight'] as LogType[]).map((t) => (
          <Chip key={t} label={LOG_META[t].label} icon={LOG_META[t].icon} tint={LOG_META[t].tint} active={filter === t} onPress={() => setFilter(t)} />
        ))}
      </Row>
      {historyByDay.length === 0 ? (
        <T style={{ color: C.inkSoft }}>Nothing here yet.</T>
      ) : (
        historyByDay.map((g) => (
          <View key={g.day} style={{ gap: 8 }}>
            <T v="label">{relDay(g.items[0].at)}</T>
            <Card style={{ gap: 12 }}>
              {g.items.map((l) => (
                <Row key={l.id} gap={12}>
                  <View style={[styles.logIcon, { backgroundColor: Tint[LOG_META[l.type].tint][0] }]}>
                    <Icon name={LOG_META[l.type].icon} size={17} color={Tint[LOG_META[l.type].tint][1]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="bodyStrong" numberOfLines={1} style={{ fontSize: 14 }}>
                      {describeLog(l)}
                    </T>
                    {l.note ? <T v="small">{l.note}</T> : null}
                  </View>
                  <T v="small">{shortTime(l.at)}</T>
                </Row>
              ))}
            </Card>
          </View>
        ))
      )}
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Row gap={6}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <T v="small">{label}</T>
    </Row>
  );
}

function Mini({ label, value, sub, tint }: { label: string; value: string; sub: string; tint: keyof typeof Tint }) {
  return (
    <View style={[styles.mini, { backgroundColor: Tint[tint][0] }]}>
      <T v="label" style={{ fontSize: 10 }}>
        {label}
      </T>
      <T v="h2" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </T>
      <T v="small" style={{ fontSize: 11 }}>
        {sub}
      </T>
    </View>
  );
}

function FoodRow({ label, items, tint }: { label: string; items: string[]; tint: keyof typeof Tint }) {
  return (
    <View style={{ gap: 6 }}>
      <T v="label">{label}</T>
      {items.length ? (
        <Row gap={6} style={{ flexWrap: 'wrap' }}>
          {items.map((n) => (
            <Badge key={n} text={n} tint={tint} />
          ))}
        </Row>
      ) : (
        <T v="small">Nothing yet</T>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mini: { flex: 1, borderRadius: R.md, padding: 10, gap: 2 },
  groom: { borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 8, minWidth: 92 },
  logIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
