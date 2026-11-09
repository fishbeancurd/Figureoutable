import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { C, F, R } from '@/constants/theme';
import { Badge, Button, Card, Chip, DogAvatar, Field, Row, Screen, Segmented, SectionTitle, Stepper, T, TopBar } from '@/components/ui';
import { FUR_COLORS } from '@/components/Mascot';
import { useGame, useStore } from '@/lib/store';
import { ageLabel, levelTitle, snapshot } from '@/lib/dogmath';
import { BREEDS, findBreed } from '@/data/breeds';
import { Icon } from '@/components/Icon';
import type { AppState, Dog } from '@/lib/types';

export default function Profile() {
  const { state, update, reset } = useStore();
  const game = useGame();
  const dog = state.dog!;
  const snap = snapshot(dog);
  const [draft, setDraft] = useState<Dog>(dog);
  const [birthText, setBirthText] = useState(dog.birthDate);
  const [breedQuery, setBreedQuery] = useState('');
  const [allergy, setAllergy] = useState('');
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(dog) || birthText !== dog.birthDate;
  const validBirth = /^\d{4}-\d{2}-\d{2}$/.test(birthText) && !isNaN(new Date(birthText).getTime()) && new Date(birthText) <= new Date();

  const saveDog = () => {
    if (!validBirth || !draft.name.trim()) return;
    update((s) => ({ ...s, dog: { ...draft, name: draft.name.trim(), birthDate: birthText } }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6 });
    if (!res.canceled && res.assets[0]) setDraft({ ...draft, photoUri: res.assets[0].uri });
  };

  const exportData = async () => {
    const json = JSON.stringify(state);
    try {
      await Share.share({ message: json, title: `${dog.name} Pawgress backup` });
    } catch {
      setImportMsg('Sharing is not available here.');
    }
  };

  const importData = () => {
    try {
      const parsed = JSON.parse(importText) as AppState;
      if (!parsed.dog || !Array.isArray(parsed.logs)) throw new Error();
      update(() => ({ ...parsed, onboarded: true }));
      setImportMsg(`Restored ${parsed.dog.name} with ${parsed.logs.length} log entries.`);
      setImportText('');
    } catch {
      setImportMsg('That does not look like a Pawgress backup. Paste the full text you exported.');
    }
  };

  const breeds = BREEDS.filter((b) => breedQuery && b.name.toLowerCase().includes(breedQuery.toLowerCase())).slice(0, 6);

  return (
    <Screen tabs={false} header={<TopBar title="Profile" />}>
      {/* Header */}
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Pressable onPress={pickPhoto} accessibilityLabel="Change photo">
          <DogAvatar dog={draft} size={130} />
        </Pressable>
        <T v="h1">{dog.name}</T>
        <Row gap={6}>
          <Badge text={`${ageLabel(snap.weeks)} · ${snap.stage.name}`} tint={snap.stage.tint} />
          <Badge text={`Level ${game.level} · ${levelTitle(game.level)}`} tint="lavender" />
        </Row>
        <Row gap={8}>
          <Button label="Change photo" kind="soft" icon="image" onPress={pickPhoto} />
          {draft.photoUri && <Button label="Use cartoon" kind="ghost" onPress={() => setDraft({ ...draft, photoUri: undefined })} />}
        </Row>
        {!draft.photoUri && (
          <Row gap={8}>
            {FUR_COLORS.map((c) => (
              <Pressable key={c} onPress={() => setDraft({ ...draft, furColor: c })} style={[styles.swatch, { backgroundColor: c }, draft.furColor === c && { borderColor: C.pill }]} accessibilityLabel="Coat color" />
            ))}
          </Row>
        )}
      </View>

      {/* Dog details */}
      <SectionTitle title="About your dog" />
      <Card style={{ gap: 14 }}>
        <Field label="Name" value={draft.name} onChangeText={(t) => setDraft({ ...draft, name: t })} />
        <Field label="Birthday (YYYY-MM-DD)" value={birthText} onChangeText={setBirthText} autoCapitalize="none" hint={validBirth ? `${ageLabel(snapshot({ ...draft, birthDate: birthText }).weeks)} old` : 'Use the format 2026-07-15'} />
        <View style={{ gap: 6 }}>
          <T v="label">Breed: {draft.breed}</T>
          <TextInput value={breedQuery} onChangeText={setBreedQuery} placeholder="Search to change breed" placeholderTextColor={C.inkFaint} style={styles.input} />
          {breeds.map((b) => (
            <Pressable key={b.name} onPress={() => { setDraft({ ...draft, breed: b.name, size: b.size, adultWeightKg: b.adultKg }); setBreedQuery(''); }} style={styles.breedRow}>
              <T v="bodyStrong">{b.name}</T>
            </Pressable>
          ))}
        </View>
        <View style={{ gap: 6 }}>
          <T v="label">Expected adult weight</T>
          <Stepper value={draft.adultWeightKg} onChange={(v) => setDraft({ ...draft, adultWeightKg: v })} step={draft.adultWeightKg < 10 ? 0.5 : 1} min={1} suffix="kg" />
          {findBreed(draft.breed) && <T v="small">Breed average: {findBreed(draft.breed)!.adultKg} kg</T>}
        </View>
        <Segmented options={[{ value: 'female', label: 'Girl' }, { value: 'male', label: 'Boy' }]} value={draft.sex} onChange={(v) => setDraft({ ...draft, sex: v })} />
        <Segmented options={[{ value: 'no', label: 'Not neutered' }, { value: 'yes', label: 'Neutered or spayed' }]} value={draft.neutered ? 'yes' : 'no'} onChange={(v) => setDraft({ ...draft, neutered: v === 'yes' })} />
        <Segmented options={[{ value: 'low', label: 'Chill' }, { value: 'normal', label: 'Average' }, { value: 'high', label: 'Zoomies' }]} value={draft.activity} onChange={(v) => setDraft({ ...draft, activity: v })} />
        <View style={{ gap: 6 }}>
          <T v="label">Allergies and sensitivities</T>
          <Row gap={6} style={{ flexWrap: 'wrap' }}>
            {draft.allergies.map((a) => (
              <Chip key={a} label={`${a}  ✕`} tint="rose" active onPress={() => setDraft({ ...draft, allergies: draft.allergies.filter((x) => x !== a) })} />
            ))}
            {!draft.allergies.length && <T v="small">None added</T>}
          </Row>
          <Row gap={8}>
            <TextInput value={allergy} onChangeText={setAllergy} placeholder="Add one, e.g. Beef" placeholderTextColor={C.inkFaint} style={[styles.input, { flex: 1 }]} />
            <Button label="Add" kind="soft" onPress={() => { if (allergy.trim()) setDraft({ ...draft, allergies: [...draft.allergies, allergy.trim()] }); setAllergy(''); }} />
          </Row>
        </View>
        <Button label={saved ? 'Saved' : 'Save changes'} icon="check" onPress={saveDog} disabled={!dirty || !validBirth || !draft.name.trim()} />
      </Card>

      <Card style={{ gap: 4 }}>
        <T v="h3">Daily targets right now</T>
        <T>
          {snap.cal.daily} kcal a day ({snap.cal.meals} meals) · {snap.cal.weekly.toLocaleString()} kcal a week · treats up to {snap.cal.treatBudget} kcal a day · {snap.exerciseTarget} min activity
        </T>
        <T v="small">{snap.cal.explain} Based on {snap.cal.basisKg.toFixed(1)} kg.</T>
      </Card>

      {/* AI */}
      <SectionTitle title="AI connection" />
      <Card style={{ gap: 6 }} onPress={() => router.push('/ai')}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="bodyStrong">{state.aiMode === 'claude' ? 'My Claude account' : state.aiMode === 'server' ? 'My own server' : 'Demo mode'}</T>
          <Icon name="chevron" size={18} color={C.inkSoft} />
        </Row>
        <T v="small">Connect your own Claude account so the chat can read photos and answer anything.</T>
      </Card>

      {/* Data */}
      <SectionTitle title="Your data" />
      <Card style={{ gap: 12 }}>
        <T>Everything stays on this phone. Export a backup to keep it safe or to move to a new phone.</T>
        <Row gap={10}>
          <Button label="Export backup" icon="share" kind="soft" style={{ flex: 1 }} onPress={exportData} />
          <Button label="Food library" icon="bowl" kind="soft" style={{ flex: 1 }} onPress={() => router.push('/foods')} />
        </Row>
        <TextInput value={importText} onChangeText={setImportText} placeholder="Paste a backup here to restore" placeholderTextColor={C.inkFaint} style={[styles.input, { height: 80, paddingTop: 12 }]} multiline />
        <Button label="Restore backup" kind="ghost" onPress={importData} disabled={!importText.trim()} />
        {importMsg ? <T v="small">{importMsg}</T> : null}
      </Card>

      <Card style={{ gap: 10 }}>
        <T v="h3">Start over</T>
        <T v="small">Deletes {dog.name}'s profile, logs and plan from this phone. This can't be undone.</T>
        {confirmReset ? (
          <Row gap={10}>
            <Button label="Keep my data" kind="ghost" style={{ flex: 1 }} onPress={() => setConfirmReset(false)} />
            <Button label="Delete everything" kind="danger" style={{ flex: 1 }} onPress={() => { reset(); router.replace('/onboarding'); }} />
          </Row>
        ) : (
          <Button label="Reset app" kind="danger" icon="trash" onPress={() => setConfirmReset(true)} />
        )}
      </Card>
      <T v="small" style={{ textAlign: 'center' }}>
        Pawgress gives general guidance based on common veterinary advice. It is not a substitute for your vet.
      </T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderColor: '#fff' },
  input: { backgroundColor: C.bg, borderRadius: R.md, paddingHorizontal: 14, height: 48, fontFamily: F.bodySemi, fontSize: 15, color: C.ink },
  breedRow: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.lavender, borderRadius: R.sm },
});
