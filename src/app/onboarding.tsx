import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { C, F, R, Tint, shadow } from '@/constants/theme';
import { Badge, Button, Card, Chip, DogAvatar, Field, Press, Row, Segmented, Stepper, T } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { FUR_COLORS, Mascot } from '@/components/Mascot';
import { BREEDS, SIZE_INFO, findBreed } from '@/data/breeds';
import { DEFAULT_OWNER, addDogState, allDogs, freshDogData, sampleState, useStore } from '@/lib/store';
import type { Activity, Dog, Owner, Sex, SizeClass } from '@/lib/types';
import { isoDate, uid } from '@/lib/util';
import { ageLabel, snapshot } from '@/lib/dogmath';
import { buildRoutine, fmtTime, fromMin, toMin } from '@/lib/routine';
import { pottyGuide } from '@/data/stages';

const ALLERGY_OPTIONS = ['Chicken', 'Beef', 'Dairy', 'Wheat', 'Soy', 'Egg', 'Lamb', 'Fish', 'Corn'];
const STEPS = ['welcome', 'name', 'breed', 'age', 'body', 'allergies', 'day', 'done'] as const;
type Step = (typeof STEPS)[number];

function TimeStepper({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <T v="bodyStrong">{label}</T>
      <Row gap={8}>
        <Pressable onPress={() => onChange(fromMin(toMin(value) - 15))} style={styles.tbtn} accessibilityLabel={`${label} earlier`}>
          <Icon name="minus" size={16} />
        </Pressable>
        <T v="h3" style={{ width: 82, textAlign: 'center' }}>
          {fmtTime(value)}
        </T>
        <Pressable onPress={() => onChange(fromMin(toMin(value) + 15))} style={styles.tbtn} accessibilityLabel={`${label} later`}>
          <Icon name="plus" size={16} />
        </Pressable>
      </Row>
    </Row>
  );
}

export default function Onboarding() {
  const { state, update } = useStore();
  // "?mode=add" adds another dog to an existing household: no welcome screen and no owner schedule step.
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const adding = mode === 'add' && !!state.dog;
  const steps: readonly Step[] = adding ? STEPS.filter((x) => x !== 'welcome' && x !== 'day') : STEPS;
  const [step, setStep] = useState<Step>(adding ? 'name' : 'welcome');
  const idx = steps.indexOf(step);
  const dotSteps: Step[] = steps.filter((x) => x !== 'welcome');
  const dotIdx = dotSteps.indexOf(step);

  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  // Give each new dog a coat color the other dogs aren't using, so their cartoons look different.
  const usedFur = adding ? allDogs(state).map((d) => d.dog.furColor ?? FUR_COLORS[0]) : [];
  const [fur, setFur] = useState(FUR_COLORS.find((c) => !usedFur.includes(c)) ?? FUR_COLORS[0]);
  const [breed, setBreed] = useState('');
  const [query, setQuery] = useState('');
  const [size, setSize] = useState<SizeClass>('medium');
  const [sex, setSex] = useState<Sex>('female');
  const [ageUnit, setAgeUnit] = useState<'weeks' | 'months' | 'years'>('weeks');
  const [ageVal, setAgeVal] = useState(10);
  const [weightKg, setWeightKg] = useState(0);
  const [adultKg, setAdultKg] = useState(18);
  const [neutered, setNeutered] = useState(false);
  const [activity, setActivity] = useState<Activity>('normal');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [owner, setOwner] = useState<Owner>(adding ? state.owner : DEFAULT_OWNER);

  const birthDate = useMemo(() => {
    const d = new Date();
    const days = ageUnit === 'weeks' ? ageVal * 7 : ageUnit === 'months' ? ageVal * 30.44 : ageVal * 365.25;
    d.setDate(d.getDate() - Math.round(days));
    return isoDate(d);
  }, [ageUnit, ageVal]);

  const draftDog: Dog = {
    id: 'draft',
    name: name.trim() || 'Your pup',
    breed: breed || 'Mixed breed / not sure',
    size,
    sex,
    birthDate,
    homecomingDate: isoDate(new Date()),
    photoUri,
    furColor: fur,
    adultWeightKg: adultKg,
    neutered,
    activity,
    allergies,
    weights: weightKg > 0 ? [{ date: isoDate(new Date()), kg: weightKg }] : [],
  };

  const next = () => setStep(steps[Math.min(idx + 1, steps.length - 1)]);
  const back = () => {
    if (adding && idx === 0) {
      if (router.canGoBack()) router.back();
      else router.replace('/');
      return;
    }
    setStep(steps[Math.max(idx - 1, 0)]);
  };

  const pickPhoto = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6 });
    if (!res.canceled && res.assets[0]) setPhotoUri(res.assets[0].uri);
  };

  const chooseBreed = (b: string) => {
    setBreed(b);
    const info = findBreed(b);
    if (info) {
      setSize(info.size);
      setAdultKg(info.adultKg);
    }
  };

  const finish = async () => {
    const dog: Dog = { ...draftDog, id: uid(), name: name.trim() || 'Pup' };
    if (adding) {
      update((s) => addDogState(s, freshDogData(dog, buildRoutine(dog, s.owner))));
      router.replace('/');
      return;
    }
    const routine = buildRoutine(dog, owner);
    update((s) => ({ ...s, onboarded: true, dog, owner, routine, dogOrder: [dog.id] }));
    router.replace('/');
  };

  const useSample = () => {
    const s = sampleState();
    update(() => s);
    router.replace('/');
  };

  const filteredBreeds = BREEDS.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()));
  const snap = snapshot(draftDog);
  const potty = pottyGuide(snap.weeks, snap.stage.id);

  const canNext =
    step === 'name' ? name.trim().length > 0 : step === 'age' ? ageVal > 0 : true;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {step !== 'welcome' && (
          <View style={styles.header}>
            <Pressable onPress={back} hitSlop={12} accessibilityLabel="Back" style={styles.backBtn}>
              <Icon name="back" size={22} />
            </Pressable>
            <View style={styles.dots}>
              {dotSteps.map((s, i) => (
                <View key={s} style={[styles.dot, i <= dotIdx && { backgroundColor: C.peachDeep, width: i === dotIdx ? 22 : 8 }]} />
              ))}
            </View>
            <View style={{ width: 40 }} />
          </View>
        )}

        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40, gap: 18, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <Animated.View key={step} entering={FadeInRight.duration(320)} exiting={FadeOutLeft.duration(200)} style={{ gap: 18, flex: 1 }}>
            {step === 'welcome' && (
              <View style={{ flex: 1, gap: 22, justifyContent: 'center', paddingTop: 30 }}>
                <View style={styles.welcomeArt}>
                  <View style={[styles.blob, { backgroundColor: C.lavender, width: 260, height: 260, left: -30, top: 0 }]} />
                  <View style={[styles.blob, { backgroundColor: C.peach, width: 120, height: 120, right: 0, top: 10 }]} />
                  <View style={[styles.blob, { backgroundColor: C.mint, width: 90, height: 90, left: 10, bottom: 0 }]} />
                  <Animated.View entering={FadeInDown.delay(150).springify()}>
                    <Mascot size={210} />
                  </Animated.View>
                  <Animated.View entering={FadeIn.delay(600)} style={[styles.floatTag, { left: 0, top: 40 }]}>
                    <Badge text="Potty pro" tint="butter" />
                  </Animated.View>
                  <Animated.View entering={FadeIn.delay(800)} style={[styles.floatTag, { right: 0, bottom: 50 }]}>
                    <Badge text="+20 XP" tint="peach" />
                  </Animated.View>
                </View>
                <View style={{ gap: 10 }}>
                  <T v="hero" style={{ fontSize: 36, lineHeight: 40 }}>
                    Let's start your{'\n'}
                    <T v="hero" style={{ fontSize: 36, lineHeight: 40, color: C.lavenderDeep }}>
                      dog journey
                    </T>
                  </T>
                  <T style={{ color: C.inkSoft }}>
                    Pawgress guides you through every stage, from homecoming to golden years. Track food, growth and habits, get tips for today, and ask anything with a photo.
                  </T>
                </View>
                <View style={{ gap: 10 }}>
                  <Button label="Add my dog" icon="paw" onPress={next} />
                  <Button label="Explore with a sample pup" kind="ghost" onPress={useSample} />
                </View>
              </View>
            )}

            {step === 'name' && (
              <>
                <T v="h1">Who's the good dog?</T>
                <View style={{ alignItems: 'center', gap: 12 }}>
                  <DogAvatar dog={draftDog} size={150} />
                  <Row gap={10}>
                    <Button label="Take photo" icon="camera" kind="soft" onPress={() => pickPhoto(true)} />
                    <Button label="Choose" icon="image" kind="soft" onPress={() => pickPhoto(false)} />
                  </Row>
                  {!photoUri && (
                    <View style={{ gap: 8, alignItems: 'center' }}>
                      <T v="small">No photo yet? Pick a coat color for the cartoon.</T>
                      <Row gap={8}>
                        {FUR_COLORS.map((c) => (
                          <Pressable key={c} onPress={() => setFur(c)} accessibilityLabel="Coat color" style={[styles.swatch, { backgroundColor: c }, fur === c && { borderColor: C.pill }]} />
                        ))}
                      </Row>
                    </View>
                  )}
                </View>
                <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Mochi" autoFocus returnKeyType="next" onSubmitEditing={() => canNext && next()} />
                <View style={{ gap: 6 }}>
                  <T v="label">Sex</T>
                  <Segmented options={[{ value: 'female', label: 'Girl' }, { value: 'male', label: 'Boy' }]} value={sex} onChange={setSex} />
                </View>
              </>
            )}

            {step === 'breed' && (
              <>
                <T v="h1">What breed is {draftDog.name}?</T>
                <T style={{ color: C.inkSoft }}>Breed sets the expected adult size, which shapes growth and calorie targets.</T>
                <TextInput value={query} onChangeText={setQuery} placeholder="Search breeds" placeholderTextColor={C.inkFaint} style={styles.search} />
                <View style={{ gap: 8 }}>
                  {filteredBreeds.slice(0, 12).map((b) => (
                    <Press key={b.name} onPress={() => chooseBreed(b.name)}>
                      <View style={[styles.listRow, breed === b.name && { borderColor: C.lavenderDeep, backgroundColor: C.lavender }]}>
                        <T v="bodyStrong" style={{ flex: 1 }}>
                          {b.name}
                        </T>
                        <T v="small">{SIZE_INFO[b.size].label}</T>
                        {breed === b.name && <Icon name="check" size={18} color={C.lavenderDeep} strokeWidth={3} />}
                      </View>
                    </Press>
                  ))}
                </View>
                {(breed === 'Mixed breed / not sure' || !findBreed(breed)) && (
                  <View style={{ gap: 8 }}>
                    <T v="label">Expected adult size</T>
                    <Row gap={8} style={{ flexWrap: 'wrap' }}>
                      {(Object.keys(SIZE_INFO) as SizeClass[]).map((s) => (
                        <Chip key={s} label={`${SIZE_INFO[s].label} · ${SIZE_INFO[s].range}`} active={size === s} onPress={() => { setSize(s); setAdultKg(SIZE_INFO[s].defaultKg); }} />
                      ))}
                    </Row>
                  </View>
                )}
              </>
            )}

            {step === 'age' && (
              <>
                <T v="h1">How old is {draftDog.name}?</T>
                <T style={{ color: C.inkSoft }}>An estimate is fine. You can set the exact birthday later in the profile.</T>
                <Segmented options={[{ value: 'weeks', label: 'Weeks' }, { value: 'months', label: 'Months' }, { value: 'years', label: 'Years' }]} value={ageUnit} onChange={(u) => { setAgeUnit(u); setAgeVal(u === 'weeks' ? 10 : u === 'months' ? 6 : 2); }} />
                <Card style={{ alignItems: 'center', gap: 12 }}>
                  <Stepper value={ageVal} onChange={setAgeVal} min={1} suffix={ageUnit} />
                  <Badge text={`${snap.stage.name} · ${snap.stage.nickname}`} tint={snap.stage.tint} />
                </Card>
                <Card tint={snap.stage.tint} style={{ gap: 6 }}>
                  <T v="h3">{snap.stage.name} stage</T>
                  <T>{snap.stage.summary}</T>
                </Card>
              </>
            )}

            {step === 'body' && (
              <>
                <T v="h1">Size and energy</T>
                <Card style={{ gap: 14 }}>
                  <T v="label">Weight today (skip if unknown)</T>
                  <Stepper value={weightKg} onChange={setWeightKg} step={weightKg < 10 ? 0.1 : 0.5} suffix="kg" />
                  <T v="label">Expected adult weight</T>
                  <Stepper value={adultKg} onChange={setAdultKg} step={adultKg < 10 ? 0.5 : 1} min={1} suffix="kg" />
                  <T v="small">Prefilled from the breed. Your vet or breeder can give a better estimate.</T>
                </Card>
                <View style={{ gap: 6 }}>
                  <T v="label">Energy level</T>
                  <Segmented options={[{ value: 'low', label: 'Chill' }, { value: 'normal', label: 'Average' }, { value: 'high', label: 'Zoomies' }]} value={activity} onChange={setActivity} />
                </View>
                <View style={{ gap: 6 }}>
                  <T v="label">Spayed or neutered?</T>
                  <Segmented options={[{ value: 'no', label: 'Not yet' }, { value: 'yes', label: 'Yes' }]} value={neutered ? 'yes' : 'no'} onChange={(v) => setNeutered(v === 'yes')} />
                </View>
              </>
            )}

            {step === 'allergies' && (
              <>
                <T v="h1">Any allergies or tummy troubles?</T>
                <T style={{ color: C.inkSoft }}>Pawgress warns you when a logged food or chat question matches one of these.</T>
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  {ALLERGY_OPTIONS.concat(allergies.filter((a) => !ALLERGY_OPTIONS.includes(a))).map((a) => (
                    <Chip key={a} label={a} tint="rose" active={allergies.includes(a)} onPress={() => setAllergies((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]))} />
                  ))}
                </Row>
                <Row gap={8}>
                  <View style={{ flex: 1 }}>
                    <Field label="Something else" value={customAllergy} onChangeText={setCustomAllergy} placeholder="e.g. Pork" />
                  </View>
                  <View style={{ paddingTop: 22 }}>
                    <Button label="Add" kind="soft" onPress={() => { const v = customAllergy.trim(); if (v) setAllergies((c) => [...c, v]); setCustomAllergy(''); }} />
                  </View>
                </Row>
                <T v="small">None known? Just tap Next. You can log reactions to foods at any time.</T>
              </>
            )}

            {step === 'day' && (
              <>
                <T v="h1">What does your day look like?</T>
                <T style={{ color: C.inkSoft }}>We'll build a routine around your schedule and {draftDog.name}'s needs. You can tweak every item after.</T>
                <Field label="Your name" value={owner.name} onChangeText={(v) => setOwner({ ...owner, name: v })} placeholder="e.g. Sam" />
                <Card style={{ gap: 14 }}>
                  <TimeStepper label="Wake up" value={owner.wake} onChange={(v) => setOwner({ ...owner, wake: v })} />
                  <TimeStepper label="Bedtime" value={owner.bed} onChange={(v) => setOwner({ ...owner, bed: v })} />
                  <View style={{ height: 1, backgroundColor: C.line }} />
                  <TimeStepper label="Work starts" value={owner.workStart} onChange={(v) => setOwner({ ...owner, workStart: v })} />
                  <TimeStepper label="Work ends" value={owner.workEnd} onChange={(v) => setOwner({ ...owner, workEnd: v })} />
                  <Segmented options={[{ value: 'out', label: 'I go out to work' }, { value: 'home', label: 'I work from home' }]} value={owner.worksFromHome ? 'home' : 'out'} onChange={(v) => setOwner({ ...owner, worksFromHome: v === 'home' })} />
                </Card>
              </>
            )}

            {step === 'done' && (
              <>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <DogAvatar dog={draftDog} size={140} />
                  <T v="h1" style={{ textAlign: 'center' }}>
                    {draftDog.name}'s plan is ready
                  </T>
                  <Badge text={`${ageLabel(snap.weeks)} · ${snap.stage.name}`} tint={snap.stage.tint} />
                </View>
                <Row gap={10}>
                  <Card tint="peach" style={{ flex: 1, gap: 2 }}>
                    <T v="label">Daily food</T>
                    <T v="num">{snap.cal.daily}</T>
                    <T v="small">kcal over {snap.cal.meals} meals</T>
                  </Card>
                  <Card tint="mint" style={{ flex: 1, gap: 2 }}>
                    <T v="label">Activity</T>
                    <T v="num">{snap.exerciseTarget}</T>
                    <T v="small">minutes a day</T>
                  </Card>
                  <Card tint="butter" style={{ flex: 1, gap: 2 }}>
                    <T v="label">Potty</T>
                    <T v="num">{potty.hold}h</T>
                    <T v="small">max between trips</T>
                  </Card>
                </Row>
                <Card style={{ gap: 6 }}>
                  <T v="h3">Focus for this stage</T>
                  {snap.stage.focus.map((f) => (
                    <Row key={f} gap={8}>
                      <Icon name="paw" size={14} color={Tint[snap.stage.tint][1]} />
                      <T>{f}</T>
                    </Row>
                  ))}
                </Card>
                <T v="small" style={{ textAlign: 'center' }}>
                  Targets are estimates based on common veterinary guidance. Your vet knows your dog best.
                </T>
              </>
            )}
          </Animated.View>

          {step !== 'welcome' && (
            <Button label={step === 'done' ? `Start ${draftDog.name}'s journey` : 'Next'} icon={step === 'done' ? 'paw' : undefined} onPress={step === 'done' ? finish : next} disabled={!canNext} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.line },
  welcomeArt: { height: 280, alignItems: 'center', justifyContent: 'center' },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.9 },
  floatTag: { position: 'absolute' },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderColor: '#fff' },
  search: { backgroundColor: C.paper, borderRadius: R.pill, height: 50, paddingHorizontal: 20, fontFamily: F.bodySemi, fontSize: 15, color: C.ink, ...shadow },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.paper, borderRadius: R.md, paddingHorizontal: 16, height: 54, borderWidth: 1.5, borderColor: 'transparent' },
  tbtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.lavender, alignItems: 'center', justifyContent: 'center' },
});
