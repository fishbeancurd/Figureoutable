import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { C, R, Tint } from '@/constants/theme';
import { Badge, Button, Card, DogAvatar, Row, Screen, T, TopBar } from '@/components/ui';
import { allDogs, removeDogState, switchDogState, useGame, useStore } from '@/lib/store';
import { ageLabel, levelTitle, snapshot } from '@/lib/dogmath';

export default function Dogs() {
  const { state, update } = useStore();
  const game = useGame();
  const dogs = allDogs(state);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  return (
    <Screen tabs={false} header={<TopBar title="Your dogs" />}>
      <Card tint="lavender" style={{ gap: 4 }}>
        <T v="h3">
          {state.owner.name ? `${state.owner.name}'s pack` : 'Your pack'} · {dogs.length} dog{dogs.length === 1 ? '' : 's'}
        </T>
        <T>
          Each dog has its own profile, plan, logs, lessons and chat. Your level is shared: Level {game.level}, {levelTitle(game.level)}.
        </T>
      </Card>

      {dogs.map(({ dog, logs }, i) => {
        const snap = snapshot(dog);
        const active = dog.id === state.dog?.id;
        return (
          <Animated.View key={dog.id} entering={FadeInDown.delay(i * 60)} layout={LinearTransition}>
            <View style={[styles.card, active && { borderColor: C.lavenderDeep }]}>
              <Row gap={14}>
                <DogAvatar dog={dog} size={64} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Row gap={8}>
                    <T v="h2">{dog.name}</T>
                    {active && <Badge text="Showing" dark />}
                  </Row>
                  <T v="small">
                    {dog.breed} · {ageLabel(snap.weeks)}
                  </T>
                  <Row gap={6}>
                    <Badge text={snap.stage.name} tint={snap.stage.tint} />
                    <Badge text={`${logs.length} log${logs.length === 1 ? '' : 's'}`} tint="sky" />
                  </Row>
                </View>
              </Row>
              <Row gap={8}>
                {!active && (
                  <Button
                    label={`Show ${dog.name}`}
                    kind="dark"
                    style={{ flex: 1 }}
                    onPress={() => {
                      update((s) => switchDogState(s, dog.id));
                      router.back();
                    }}
                  />
                )}
                <Button
                  label="Edit profile"
                  kind="soft"
                  icon="edit"
                  style={{ flex: 1 }}
                  onPress={() => {
                    update((s) => switchDogState(s, dog.id));
                    router.push('/profile');
                  }}
                />
              </Row>
              {dogs.length > 1 &&
                (confirmRemove === dog.id ? (
                  <View style={[styles.confirm, { backgroundColor: Tint.rose[0] }]}>
                    <T>
                      Remove {dog.name} and all of {dog.sex === 'female' ? 'her' : 'his'} logs, plan and lessons from this phone? This can't be undone.
                    </T>
                    <Row gap={8}>
                      <Button label="Keep" kind="ghost" style={{ flex: 1 }} onPress={() => setConfirmRemove(null)} />
                      <Button
                        label={`Remove ${dog.name}`}
                        kind="danger"
                        style={{ flex: 1 }}
                        onPress={() => {
                          update((s) => removeDogState(s, dog.id));
                          setConfirmRemove(null);
                        }}
                      />
                    </Row>
                  </View>
                ) : (
                  <Button label="Remove" kind="ghost" icon="trash" onPress={() => setConfirmRemove(dog.id)} />
                ))}
            </View>
          </Animated.View>
        );
      })}

      <Button label="Add another dog" icon="plus" onPress={() => router.push({ pathname: '/onboarding', params: { mode: 'add' } })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.paper, borderRadius: R.lg, padding: 16, gap: 14, borderWidth: 2, borderColor: 'transparent' },
  confirm: { borderRadius: R.md, padding: 12, gap: 10 },
});
