import React from 'react';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '@/components/TabBar';
import { useStore } from '@/lib/store';
import { C } from '@/constants/theme';

export default function TabsLayout() {
  const { state } = useStore();
  if (!state.onboarded || !state.dog) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg }, animation: 'shift' }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="track" />
      <Tabs.Screen name="ask" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="learn" />
    </Tabs>
  );
}
