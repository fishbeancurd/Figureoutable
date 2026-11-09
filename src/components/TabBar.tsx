import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TAB_BAR_HEIGHT, useKeyboardVisible, useTabBarBottom } from '@/hooks/useTabBarSpace';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { C, F } from '@/constants/theme';
import { Icon, type IconName } from './Icon';

const META: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  track: { icon: 'chart', label: 'Track' },
  ask: { icon: 'camera', label: 'Ask' },
  plan: { icon: 'calendar', label: 'Plan' },
  learn: { icon: 'book', label: 'Learn' },
};

function Tab({ name, focused, onPress }: { name: string; focused: boolean; onPress: () => void }) {
  const meta = META[name];
  const f = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    f.set(focused ? withSpring(1, { damping: 14, stiffness: 220 }) : withTiming(0, { duration: 160 }));
  }, [focused, f]);
  const bubble = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + f.value * 0.4 }],
    opacity: f.value,
  }));
  const lift = useAnimatedStyle(() => ({ transform: [{ translateY: -f.value * 2 }] }));
  return (
    <Pressable onPress={onPress} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={meta.label}>
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.activeBubble, bubble]} />
        <Animated.View style={lift}>
          <Icon name={meta.icon} size={21} color={focused ? C.pill : '#CFC6E2'} strokeWidth={2.3} />
        </Animated.View>
      </View>
      {focused ? null : <Text style={styles.label}>{meta.label}</Text>}
    </Pressable>
  );
}

function AskButton({ focused, onPress }: { focused: boolean; onPress: () => void }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false));
  }, [pulse]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - pulse.value), transform: [{ scale: 1 + pulse.value * 0.35 }] }));
  return (
    <Pressable onPress={onPress} style={styles.askWrap} accessibilityRole="tab" accessibilityLabel="Ask about your dog" accessibilityState={{ selected: focused }}>
      {!focused && <Animated.View style={[styles.askRing, ring]} />}
      <View style={[styles.ask, focused && { backgroundColor: C.lavenderDeep }]}>
        <Icon name={focused ? 'chat' : 'camera'} size={24} color="#fff" strokeWidth={2.3} />
      </View>
    </Pressable>
  );
}

/** Floating dark pill navigation with a raised camera button for the Ask chat. */
export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const bottom = useTabBarBottom();
  const keyboard = useKeyboardVisible();
  // Get out of the way while typing so the message box stays visible.
  if (keyboard) return null;
  return (
    <View pointerEvents="box-none" style={[styles.outer, { paddingBottom: bottom }]}>
      <View style={styles.pill}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const onPress = () => {
            Haptics.selectionAsync().catch(() => {});
            if (!focused) navigateToTab(route.key);
          };
          if (route.name === 'ask') return <AskButton key={route.key} focused={focused} onPress={onPress} />;
          if (!META[route.name]) return null;
          return <Tab key={route.key} name={route.name} focused={focused} onPress={onPress} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 16 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.pill,
    borderRadius: 34,
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: 10,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#22183A',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 68, gap: 2 },
  iconWrap: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  activeBubble: { position: 'absolute', width: 46, height: 46, borderRadius: 23, backgroundColor: C.peach },
  label: { fontFamily: F.bodyBold, fontSize: 10.5, color: '#CFC6E2', marginTop: -8 },
  askWrap: { width: 72, alignItems: 'center', justifyContent: 'center', marginTop: -30 },
  askRing: { position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: C.peachDeep },
  ask: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.peachDeep, alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: C.bg },
});
