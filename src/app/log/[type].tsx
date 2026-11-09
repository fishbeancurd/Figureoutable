import React, { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C, F, Tint } from '@/constants/theme';
import { Badge, Button, Card, Chip, Field, Row, Segmented, Stepper, T } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useCelebrate } from '@/components/Celebrate';
import { allDogs, totalXp, useStore } from '@/lib/store';
import type { Food, GroomTask, Liking, LogEntry, LogType, Reaction, TrainingRating, TreatValue } from '@/lib/types';
import { allSkills, levelUnlocked, skillLevelOf, skillMastery } from '@/lib/skills';
import { LOG_META } from '@/data/logMeta';
import { GROOM_XP, computeXp, ageWeeks, expectedWeightKg, latestWeightKg, levelFromXp, logsOn, snapshot, sumKcal } from '@/lib/dogmath';
import { pottyGuide } from '@/data/stages';
import { GROOM_BY_COAT, LEVEL_INFO } from '@/data/learn';
import { findBreed } from '@/data/breeds';
import { findFoodFacts } from '@/data/foodSafety';

const WHEN = [
  { label: 'Now', min: 0 },
  { label: '30 min ago', min: 30 },
  { label: '1 h ago', min: 60 },
  { label: '2 h ago', min: 120 },
];
const LIKING: { value: Liking; label: string }[] = [
  { value: 'loves', label: 'Loved it' },
  { value: 'likes', label: 'Liked' },
  { value: 'meh', label: 'Meh' },
  { value: 'dislikes', label: 'Refused' },
];
const SYMPTOMS = ['Vomiting', 'Soft stool', 'Diarrhea', 'Itchy skin', 'Scratching ears', 'Sneezing', 'Limping', 'Low energy', 'Not eating', 'Coughing'];
const GROOM: { value: GroomTask; label: string }[] = [
  { value: 'brush', label: 'Brush coat' },
  { value: 'teeth', label: 'Teeth' },
  { value: 'nails', label: 'Nails' },
  { value: 'bath', label: 'Bath' },
  { value: 'ears', label: 'Ears' },
  { value: 'eyes', label: 'Eyes' },
];

export default function LogScreen() {
  const { type: rawType, groom: groomParam, skill: skillParam } = useLocalSearchParams<{ type: string; groom?: string; skill?: string }>();
  const type = (rawType in LOG_META ? rawType : 'meal') as LogType;
  const meta = LOG_META[type];
  const { state, update, addLog } = useStore();
  const celebrate = useCelebrate();
  const dog = state.dog!;
  const snap = snapshot(dog);

  const foodsForType = state.foods.filter((f) => (type === 'meal' ? f.kind === 'meal' : f.kind !== 'meal'));
  const [foodId, setFoodId] = useState<string | undefined>(foodsForType[0]?.id);
  const food = state.foods.find((f) => f.id === foodId);
  const [amount, setAmount] = useState<number>(type === 'meal' ? 0.5 : 5);
  const [liking, setLiking] = useState<Liking>(food?.liking ?? 'likes');
  const [treatValue, setTreatValue] = useState<TreatValue>(food?.treatValue ?? 'medium');
  const [reaction, setReaction] = useState<Reaction>('none');
  const [minutes, setMinutes] = useState(type === 'training' ? 5 : type === 'sleep' ? 60 : 20);
  const skills = allSkills(state).filter((k) => k.custom || levelUnlocked(state, k.level));
  const [skill, setSkill] = useState(skillParam && skills.some((k) => k.name === skillParam) ? skillParam : (skills[0]?.name ?? 'Practice'));
  const [rating, setRating] = useState<TrainingRating>('okay');
  const [potty, setPotty] = useState<'pee' | 'poo' | 'both'>('pee');
  const [accident, setAccident] = useState(false);
  const [stool, setStool] = useState<'firm' | 'soft' | 'runny'>('firm');
  const [groom, setGroom] = useState<GroomTask>(groomParam && groomParam in GROOM_XP ? (groomParam as GroomTask) : 'brush');
  const [symptom, setSymptom] = useState('');
  const [kg, setKg] = useState(latestWeightKg(dog) ?? +expectedWeightKg(dog, ageWeeks(dog.birthDate)).toFixed(1));
  const [note, setNote] = useState('');
  const [whenMin, setWhenMin] = useState(0);
  // Walks, play, potty trips, grooming and training are often done with several dogs at once.
  const otherDogs = allDogs(state).filter((d) => d.dog.id !== dog.id);
  const shareable = ['walk', 'play', 'sleep', 'grooming', 'training', 'potty'].includes(type) && otherDogs.length > 0;
  const [also, setAlso] = useState<string[]>([]);

  const kcal = food ? Math.round(amount * food.kcalPerUnit) : 0;
  const todayKcal = sumKcal(logsOn(state.logs, new Date()));
  const todayTreat = sumKcal(logsOn(state.logs, new Date()).filter((l) => l.type === 'treat'));
  const allergyHit = food ? dog.allergies.find((a) => food.name.toLowerCase().includes(a.split(' ')[0].toLowerCase())) : undefined;
  const safety = food ? findFoodFacts(food.name).find((f) => f.verdict !== 'safe') : undefined;

  const pickFood = (f: Food) => {
    setFoodId(f.id);
    setLiking(f.liking);
    setTreatValue(f.treatValue ?? 'medium');
    setAmount(f.unit === 'cup' ? 0.5 : f.unit === 'g' ? 20 : 5);
  };

  const xpPreview = computeXp(
    { type, minutes, kcal, accident, groom, rating },
    { perMeal: snap.cal.perMeal, treatBudgetLeft: Math.max(0, snap.cal.treatBudget - todayTreat), skillLevel: skillLevelOf(state, skill) },
  );

  const save = () => {
    const at = new Date(new Date().getTime() - whenMin * 60000).toISOString();
    let entry: Omit<LogEntry, 'id' | 'at'>;
    switch (type) {
      case 'meal':
      case 'treat':
        if (!food) return;
        entry = { type, foodId: food.id, foodName: food.name, amount, kcal, liking, reaction };
        // Remember how the dog felt about this food for next time.
        update((s) => ({
          ...s,
          foods: s.foods.map((f) =>
            f.id === food.id
              ? { ...f, liking, treatValue: type === 'treat' ? treatValue : f.treatValue, reaction: reaction !== 'none' ? reaction : f.reaction }
              : f,
          ),
        }));
        break;
      case 'walk':
      case 'play':
      case 'sleep':
        entry = { type, minutes };
        break;
      case 'training':
        entry = { type, minutes, skill, rating };
        break;
      case 'potty':
        entry = { type, potty, accident, stool: potty !== 'pee' ? stool : undefined };
        break;
      case 'grooming':
        entry = { type, groom };
        break;
      case 'health':
        entry = { type, symptom: symptom || 'Health note' };
        break;
      case 'weight':
        entry = { type, kg };
        break;
    }
    const before = levelFromXp(totalXp(state)).level;
    const alsoFor = shareable ? also : [];
    const { xp, leveledUp } = addLog({ ...entry, xp: xpPreview.xp, note: note.trim() || undefined, at }, alsoFor);
    const names = [dog.name, ...otherDogs.filter((d) => alsoFor.includes(d.dog.id)).map((d) => d.dog.name)];
    celebrate({
      xp,
      title: type === 'potty' && accident ? 'Logged. Accidents happen!' : `${meta.label} logged${names.length > 1 ? ` for ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : ''}`,
      levelUp: leveledUp ? `Level up! You're now level ${before + 1}` : undefined,
    });
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const expected = expectedWeightKg(dog, snap.weeks);
  const guide = pottyGuide(snap.weeks, snap.stage.id);
  const coat = findBreed(dog.breed)?.coat ?? 'short';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={styles.head}>
          <View style={[styles.headIcon, { backgroundColor: Tint[meta.tint][0] }]}>
            <Icon name={meta.icon} size={24} color={Tint[meta.tint][1]} />
          </View>
          <T v="h1" style={{ flex: 1 }}>
            Log {type === 'training' ? 'training' : meta.label.toLowerCase()}
          </T>
          <Button label="Close" kind="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {(type === 'meal' || type === 'treat') && (
            <>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="label">Which food?</T>
                <Button label="Food library" kind="ghost" icon="list" onPress={() => router.push('/foods')} style={{ transform: [{ scale: 0.85 }] }} />
              </Row>
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                {foodsForType.map((f) => (
                  <Chip key={f.id} label={f.name} active={f.id === foodId} onPress={() => pickFood(f)} tint={meta.tint} />
                ))}
              </Row>
              {foodsForType.length === 0 && <T style={{ color: C.inkSoft }}>Add a food in the library first.</T>}
              {food && (
                <Animated.View entering={FadeInDown} style={{ gap: 16 }}>
                  {(allergyHit || food.reaction === 'allergy') && (
                    <Card tint="rose" style={{ gap: 4 }}>
                      <T v="h3">Allergy alert</T>
                      <T>{allergyHit ? `${dog.name}'s profile lists "${allergyHit}".` : `${food.name} caused a reaction before.`} Check before feeding.</T>
                    </Card>
                  )}
                  {safety && (
                    <Card tint={safety.verdict === 'unsafe' ? 'rose' : 'butter'} style={{ gap: 4 }}>
                      <T v="h3">{safety.verdict === 'unsafe' ? 'Not safe for dogs' : 'Feed with care'}</T>
                      <T>{safety.why}</T>
                    </Card>
                  )}
                  <Card style={{ alignItems: 'center', gap: 10 }}>
                    <T v="label">How much?</T>
                    <Stepper value={amount} onChange={setAmount} step={food.unit === 'cup' ? 0.25 : food.unit === 'g' ? 5 : 1} suffix={food.unit} />
                    <T v="h2" style={{ color: Tint[meta.tint][1] }}>
                      {kcal} kcal
                    </T>
                    <T v="small" style={{ textAlign: 'center' }}>
                      {type === 'treat'
                        ? `Treats today: ${todayTreat + kcal} of ${snap.cal.treatBudget} kcal budget`
                        : `Today: ${todayKcal + kcal} of ${snap.cal.daily} kcal · about ${snap.cal.perMeal} per meal`}
                    </T>
                  </Card>
                  <View style={{ gap: 6 }}>
                    <T v="label">Did {dog.name} like it?</T>
                    <Segmented options={LIKING} value={liking} onChange={setLiking} />
                  </View>
                  {type === 'treat' && (
                    <View style={{ gap: 6 }}>
                      <T v="label">Motivation value</T>
                      <Segmented options={[{ value: 'high', label: 'High · jackpot' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low · everyday' }]} value={treatValue} onChange={setTreatValue} />
                    </View>
                  )}
                  <View style={{ gap: 6 }}>
                    <T v="label">Any reaction?</T>
                    <Segmented options={[{ value: 'none', label: 'All good' }, { value: 'upset', label: 'Upset tummy' }, { value: 'allergy', label: 'Allergy signs' }]} value={reaction} onChange={setReaction} />
                  </View>
                </Animated.View>
              )}
            </>
          )}

          {(type === 'walk' || type === 'play' || type === 'sleep' || type === 'training') && (
            <>
              {type === 'training' && (
                <View style={{ gap: 8 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <T v="label">What did you practice?</T>
                    <Button label="My skills" kind="ghost" icon="medal" onPress={() => router.push('/skills')} style={{ transform: [{ scale: 0.85 }] }} />
                  </Row>
                  <Row gap={8} style={{ flexWrap: 'wrap' }}>
                    {skills.map((k) => (
                      <Chip key={k.key} label={k.custom ? `★ ${k.name}` : k.name} active={skill === k.name} onPress={() => setSkill(k.name)} tint={LEVEL_INFO[k.level].tint} />
                    ))}
                  </Row>
                </View>
              )}
              {type === 'training' && (
                <View style={{ gap: 6 }}>
                  <T v="label">How did it go?</T>
                  <Segmented options={[{ value: 'struggled', label: 'Tricky' }, { value: 'okay', label: 'Getting there' }, { value: 'nailed', label: 'Nailed it!' }]} value={rating} onChange={setRating} />
                  <T v="small">
                    {skill}: {LEVEL_INFO[skillLevelOf(state, skill)].label} · {skillMastery(state.logs, skill).label}
                  </T>
                </View>
              )}
              <Card style={{ alignItems: 'center', gap: 12 }}>
                <T v="label">How long?</T>
                <Stepper value={minutes} onChange={setMinutes} step={5} min={1} suffix="min" />
                <Row gap={6} style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                  {(type === 'sleep' ? [30, 60, 90, 120] : type === 'training' ? [3, 5, 10, 15] : [10, 15, 20, 30, 45]).map((m) => (
                    <Chip key={m} label={`${m} min`} active={minutes === m} onPress={() => setMinutes(m)} />
                  ))}
                </Row>
              </Card>
              {(type === 'walk' || type === 'play') && (
                <T v="small" style={{ textAlign: 'center' }}>
                  Target for {dog.name} at this age: about {snap.exerciseTarget} min of activity a day.
                </T>
              )}
            </>
          )}

          {type === 'potty' && (
            <>
              <View style={{ gap: 6 }}>
                <T v="label">What happened?</T>
                <Segmented options={[{ value: 'pee', label: 'Pee' }, { value: 'poo', label: 'Poo' }, { value: 'both', label: 'Both' }]} value={potty} onChange={setPotty} />
              </View>
              <View style={{ gap: 6 }}>
                <T v="label">Where?</T>
                <Segmented options={[{ value: 'out', label: 'Outside, yay!' }, { value: 'in', label: 'Accident inside' }]} value={accident ? 'in' : 'out'} onChange={(v) => setAccident(v === 'in')} />
              </View>
              {potty !== 'pee' && (
                <View style={{ gap: 6 }}>
                  <T v="label">Poo check</T>
                  <Segmented options={[{ value: 'firm', label: 'Firm' }, { value: 'soft', label: 'Soft' }, { value: 'runny', label: 'Runny' }]} value={stool} onChange={setStool} />
                  {stool === 'runny' && <T v="small" style={{ color: C.danger }}>Runny stool for more than a day, or with blood, is a reason to call your vet.</T>}
                </View>
              )}
              <Card tint="butter" style={{ gap: 4 }}>
                <T v="h3">Potty guide for {dog.name} now</T>
                <T>Pee: {guide.pee}.</T>
                <T>Poo: {guide.poo}.</T>
                <T>Night: {guide.night}.</T>
              </Card>
            </>
          )}

          {type === 'grooming' && (
            <>
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                {GROOM.map((g) => (
                  <Chip key={g.value} label={`${g.label} · ${GROOM_XP[g.value]} XP`} active={groom === g.value} onPress={() => setGroom(g.value)} tint="sky" />
                ))}
              </Row>
              <Card tint="sky" style={{ gap: 4 }}>
                <T v="h3">{coat[0].toUpperCase() + coat.slice(1)} coat care</T>
                <T>Brush: {GROOM_BY_COAT[coat].brush}</T>
                <T>Bath: {GROOM_BY_COAT[coat].bath}</T>
                <T>Nails: every 2 to 4 weeks · Teeth: daily</T>
                <T v="small">{GROOM_BY_COAT[coat].extra}</T>
              </Card>
            </>
          )}

          {type === 'health' && (
            <>
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                {SYMPTOMS.map((s) => (
                  <Chip key={s} label={s} active={symptom === s} onPress={() => setSymptom(s)} tint="rose" />
                ))}
              </Row>
              <Card tint="rose" style={{ gap: 4 }}>
                <T v="h3">Call your vet now if you see</T>
                <T>Repeated vomiting, a swollen hard belly, trouble breathing, collapse, blood in vomit or stool, a suspected toxin, or no pee for 12 hours.</T>
              </Card>
            </>
          )}

          {type === 'weight' && (
            <Card style={{ alignItems: 'center', gap: 10 }}>
              <Stepper value={kg} onChange={setKg} step={kg < 10 ? 0.1 : 0.5} min={0.1} suffix="kg" />
              <Badge text={`Expected now: ${(expected * 0.85).toFixed(1)} to ${(expected * 1.15).toFixed(1)} kg`} tint="mint" />
              <T v="small" style={{ textAlign: 'center' }}>
                Weigh at the same time of day, before a meal. Growth curves are averages, so a steady curve matters more than the exact number.
              </T>
            </Card>
          )}

          {shareable && (
            <View style={{ gap: 6 }}>
              <T v="label">Also log for</T>
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                {otherDogs.map((d) => (
                  <Chip
                    key={d.dog.id}
                    label={d.dog.name}
                    icon="paw"
                    tint={meta.tint}
                    active={also.includes(d.dog.id)}
                    onPress={() => setAlso((cur) => (cur.includes(d.dog.id) ? cur.filter((x) => x !== d.dog.id) : [...cur, d.dog.id]))}
                  />
                ))}
              </Row>
              {also.length > 0 && <T v="small">Saved to each dog, and each one earns its own XP.</T>}
            </View>
          )}

          <View style={{ gap: 6 }}>
            <T v="label">When?</T>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {WHEN.map((w) => (
                <Chip key={w.label} label={w.label} active={whenMin === w.min} onPress={() => setWhenMin(w.min)} />
              ))}
            </Row>
          </View>
          <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="Anything worth remembering" />
          <View style={styles.xpBox}>
            <T v="small" style={{ color: C.ink, flex: 1 }}>
              {xpPreview.parts.join('  ·  ')}
            </T>
            <Pressable onPress={() => router.push('/xp')} hitSlop={8} accessibilityRole="link">
              <T v="small" style={{ color: C.lavenderDeep, fontFamily: F.bodyHeavy }}>
                How XP works
              </T>
            </Pressable>
          </View>
          <Button label={`Save · +${xpPreview.xp * (1 + (shareable ? also.length : 0))} XP`} icon="check" onPress={save} disabled={(type === 'meal' || type === 'treat') && !food} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  headIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  xpBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.peach, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
});
