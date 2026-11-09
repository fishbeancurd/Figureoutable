import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { C, F, shadow } from '@/constants/theme';
import { Mascot } from './Mascot';

interface Celebration {
  key: number;
  xp: number;
  title: string;
  levelUp?: string;
}

const Ctx = createContext<(c: Omit<Celebration, 'key'>) => void>(() => {});
export const useCelebrate = () => useContext(Ctx);

const COLORS = [C.peachDeep, C.lavenderDeep, C.mintDeep, C.butterDeep, C.skyDeep, C.roseDeep];

function Piece({ i, total }: { i: number; total: number }) {
  const { width, height } = Dimensions.get('window');
  // Deterministic spread so renders stay pure.
  const angle = (i / total) * Math.PI * 2 + ((i * 37) % 10) / 25;
  const dist = 120 + ((i * 53) % 160);
  const t = useSharedValue(0);
  const fall = useSharedValue(0);
  useEffect(() => {
    t.set(withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    fall.set(withDelay(500, withTiming(1, { duration: 1100, easing: Easing.in(Easing.quad) })));
  }, [t, fall]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - fall.value,
    transform: [
      { translateX: Math.cos(angle) * dist * t.value },
      { translateY: Math.sin(angle) * dist * t.value + fall.value * 220 },
      { rotate: `${(t.value + fall.value) * 540 * (i % 2 ? 1 : -1)}deg` },
    ],
  }));
  const round = i % 3 === 0;
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: width / 2 - 5, top: height * 0.42, width: round ? 10 : 8, height: round ? 10 : 14, borderRadius: round ? 5 : 2, backgroundColor: COLORS[i % COLORS.length] },
        style,
      ]}
    />
  );
}

function Burst({ c, onDone }: { c: Celebration; onDone: () => void }) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const t = setTimeout(onDone, c.levelUp ? 2600 : 1900);
    return () => clearTimeout(t);
  }, [c.levelUp, onDone]);
  const n = reduced ? 0 : c.levelUp ? 36 : 22;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: n }).map((_, i) => (
        <Piece key={i} i={i} total={n} />
      ))}
      <Animated.View entering={ZoomIn.springify().damping(12)} exiting={FadeOut} style={styles.toastWrap}>
        <View style={[styles.toast, shadow]}>
          <Mascot size={58} mood="cheer" cheerKey={c.key} />
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.xp}>+{c.xp} XP</Text>
            <Text style={styles.title}>{c.title}</Text>
            {c.levelUp ? <Text style={styles.level}>{c.levelUp}</Text> : null}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export function CelebrateProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Celebration | null>(null);
  const n = useRef(0);
  const celebrate = useCallback((c: Omit<Celebration, 'key'>) => {
    n.current += 1;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCurrent({ ...c, key: n.current });
  }, []);
  return (
    <Ctx.Provider value={celebrate}>
      {children}
      {current && <Burst key={current.key} c={current} onDone={() => setCurrent(null)} />}
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', left: 0, right: 0, top: '36%', alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.paper, borderRadius: 28, paddingVertical: 12, paddingLeft: 12, paddingRight: 22, maxWidth: 320 },
  xp: { fontFamily: F.display, fontSize: 24, color: C.peachDeep },
  title: { fontFamily: F.bodyBold, fontSize: 14, color: C.ink },
  level: { fontFamily: F.bodyHeavy, fontSize: 13, color: C.lavenderDeep, marginTop: 2 },
});
