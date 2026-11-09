import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { C, F, R, shadow } from '@/constants/theme';
import { allDogs, switchDogState, useStore } from '@/lib/store';
import { DogAvatar, T } from './ui';
import { Icon } from './Icon';

/** A row of dog avatars to switch the active dog. Hidden when there is only one dog, unless showAdd is set. */
export function DogSwitcher({ showAdd = false }: { showAdd?: boolean }) {
  const { state, update } = useStore();
  const dogs = allDogs(state);
  if (dogs.length < 2 && !showAdd) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={{ marginHorizontal: -18 }}>
      {dogs.map(({ dog }) => {
        const on = dog.id === state.dog?.id;
        return (
          <Pressable
            key={dog.id}
            onPress={() => {
              if (on) {
                router.push('/dogs');
                return;
              }
              Haptics.selectionAsync().catch(() => {});
              update((s) => switchDogState(s, dog.id));
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={on ? `${dog.name}, showing. Open your dogs` : `Show ${dog.name}`}
            style={[styles.pill, on ? styles.pillOn : null]}>
            <View style={styles.avatar}>
              <DogAvatar dog={dog} size={30} />
            </View>
            <T v="bodyStrong" style={{ fontSize: 13.5, color: on ? '#fff' : C.ink }} numberOfLines={1}>
              {dog.name}
            </T>
          </Pressable>
        );
      })}
      <Pressable onPress={() => router.push({ pathname: '/onboarding', params: { mode: 'add' } })} accessibilityRole="button" accessibilityLabel="Add another dog" style={[styles.pill, styles.add]}>
        <Icon name="plus" size={16} color={C.lavenderDeep} strokeWidth={2.6} />
        <T v="bodyStrong" style={{ fontSize: 13.5, color: C.lavenderDeep, fontFamily: F.bodyHeavy }}>
          Add dog
        </T>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 18, paddingVertical: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, paddingLeft: 5, paddingRight: 14, borderRadius: R.pill, backgroundColor: C.paper, ...shadow, shadowOpacity: 0.06 },
  pillOn: { backgroundColor: C.pill },
  avatar: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: C.lavender },
  add: { paddingLeft: 12, backgroundColor: C.lavender, shadowOpacity: 0 },
});
