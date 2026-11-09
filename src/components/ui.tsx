import React, { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarSpace } from '@/hooks/useTabBarSpace';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { C, F, R, Tint, shadow, type TintName } from '@/constants/theme';
import { Icon, type IconName } from './Icon';
import { Mascot, type Mood } from './Mascot';
import type { Dog } from '@/lib/types';

// ---------- Text ----------

type Variant = 'hero' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'small' | 'label' | 'num';
const variants: Record<Variant, TextStyle> = {
  hero: { fontFamily: F.display, fontSize: 30, lineHeight: 34, color: C.ink },
  h1: { fontFamily: F.display, fontSize: 24, lineHeight: 29, color: C.ink },
  h2: { fontFamily: F.display, fontSize: 19, lineHeight: 24, color: C.ink },
  h3: { fontFamily: F.displayMed, fontSize: 16, lineHeight: 21, color: C.ink },
  body: { fontFamily: F.body, fontSize: 15, lineHeight: 22, color: C.ink },
  bodyStrong: { fontFamily: F.bodyBold, fontSize: 15, lineHeight: 21, color: C.ink },
  small: { fontFamily: F.bodySemi, fontSize: 12.5, lineHeight: 17, color: C.inkSoft },
  label: { fontFamily: F.bodyHeavy, fontSize: 11, lineHeight: 14, letterSpacing: 0.9, textTransform: 'uppercase', color: C.inkSoft },
  num: { fontFamily: F.display, fontSize: 22, lineHeight: 26, color: C.ink, fontVariant: ['tabular-nums'] },
};

export function T({ v = 'body', style, ...rest }: TextProps & { v?: Variant }) {
  return <Text {...rest} style={[variants[v], style]} />;
}

// ---------- Layout ----------

export function Screen({
  children,
  scroll = true,
  tabs = true,
  style,
  header,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  tabs?: boolean;
  style?: StyleProp<ViewStyle>;
  header?: React.ReactNode;
}) {
  const tabSpace = useTabBarSpace();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: tabs ? tabSpace + 36 : 40 + insets.bottom, gap: 16 }, style]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function TopBar({ title, right, onBack }: { title?: string; right?: React.ReactNode; onBack?: () => void }) {
  return (
    <View style={styles.topBar}>
      <RoundButton icon="back" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} label="Go back" />
      <T v="h2" style={{ flex: 1, textAlign: 'center' }} numberOfLines={1}>
        {title}
      </T>
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function Card({
  children,
  style,
  tint,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tint?: TintName | 'paper';
  onPress?: () => void;
}) {
  const bg = !tint || tint === 'paper' ? C.paper : Tint[tint][0];
  const inner = <View style={[styles.card, { backgroundColor: bg }, (!tint || tint === 'paper') && shadow, style]}>{children}</View>;
  if (!onPress) return inner;
  return <Press onPress={onPress}>{inner}</Press>;
}

export function Row({ children, gap = 10, style }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
      <T v="h2">{title}</T>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <T v="small" style={{ color: C.lavenderDeep, fontFamily: F.bodyHeavy }}>
            {action}
          </T>
        </Pressable>
      ) : null}
    </Row>
  );
}

// ---------- Pressables ----------

/** Pressable that squishes slightly when touched. */
export function Press({ children, onPress, style, haptic = true, ...rest }: PressableProps & { haptic?: boolean; style?: StyleProp<ViewStyle> }) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      {...rest}
      style={style}
      onPressIn={() => s.set(withSpring(0.96, { damping: 15, stiffness: 400 }))}
      onPressOut={() => s.set(withSpring(1, { damping: 12, stiffness: 300 }))}
      onPress={(e) => {
        if (haptic) Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}>
      <Animated.View style={a}>{children as React.ReactNode}</Animated.View>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  style,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  kind?: 'primary' | 'dark' | 'soft' | 'ghost' | 'danger';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const bg = { primary: C.peachDeep, dark: C.pill, soft: C.lavender, ghost: 'transparent', danger: C.dangerSoft }[kind];
  const fg = { primary: '#fff', dark: '#fff', soft: C.ink, ghost: C.ink, danger: C.danger }[kind];
  return (
    <Press onPress={disabled ? undefined : onPress} accessibilityRole="button" accessibilityLabel={label} style={style}>
      <View style={[styles.button, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 }, kind === 'ghost' && { borderWidth: 1.5, borderColor: C.line }]}>
        {icon && <Icon name={icon} size={18} color={fg} strokeWidth={2.4} />}
        <Text style={{ fontFamily: F.bodyHeavy, fontSize: 15, color: fg }}>{label}</Text>
      </View>
    </Press>
  );
}

export function RoundButton({ icon, onPress, label, bg = C.paper, color = C.ink, size = 44 }: { icon: IconName; onPress?: () => void; label: string; bg?: string; color?: string; size?: number }) {
  return (
    <Press onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, bg === C.paper && shadow]}>
        <Icon name={icon} size={size * 0.45} color={color} strokeWidth={2.2} />
      </View>
    </Press>
  );
}

export function Chip({ label, active, onPress, tint = 'lavender', icon }: { label: string; active?: boolean; onPress?: () => void; tint?: TintName; icon?: IconName }) {
  return (
    <Press onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }}>
      <View style={[styles.chip, active ? { backgroundColor: C.pill, borderColor: C.pill } : { backgroundColor: C.paper, borderColor: C.line }]}>
        {icon && <Icon name={icon} size={14} color={active ? '#fff' : Tint[tint][1]} strokeWidth={2.4} />}
        <Text style={{ fontFamily: F.bodyBold, fontSize: 13, color: active ? '#fff' : C.ink }}>{label}</Text>
      </View>
    </Press>
  );
}

export function IconBubble({ icon, tint, size = 54, label, onPress, badge }: { icon: IconName; tint: TintName; size?: number; label?: string; onPress?: () => void; badge?: string }) {
  const content = (
    <View style={{ alignItems: 'center', gap: 6, width: size + 14 }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: Tint[tint][0], alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' }}>
        <Icon name={icon} size={size * 0.46} color={Tint[tint][1]} strokeWidth={2.3} fill={icon === 'paw' ? undefined : 'none'} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={{ fontFamily: F.bodyHeavy, fontSize: 10, color: '#fff' }}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {label ? (
        <T v="small" style={{ color: C.ink, fontFamily: F.bodyBold, textAlign: 'center' }} numberOfLines={1}>
          {label}
        </T>
      ) : null}
    </View>
  );
  return onPress ? (
    <Press onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {content}
    </Press>
  ) : (
    content
  );
}

// ---------- Progress ----------

export function ProgressBar({ value, color = C.peachDeep, track = 'rgba(255,255,255,0.75)', height = 12, delay = 0 }: { value: number; color?: string; track?: string; height?: number; delay?: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    const t = setTimeout(() => w.set(withTiming(Math.max(0, Math.min(1, value)), { duration: 900, easing: Easing.out(Easing.cubic) })), delay);
    return () => clearTimeout(t);
  }, [value, delay, w]);
  const a = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: color }, a]} />
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function Ring({ value, size = 64, stroke = 9, color, track, children }: { value: number; size?: number; stroke?: number; color: string; track: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(Math.max(0, Math.min(1, value)), { duration: 1200, easing: Easing.out(Easing.cubic) }));
  }, [value, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.value) }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} animatedProps={props} />
      </Svg>
      {children}
    </View>
  );
}

export function Badge({ text, tint = 'lavender', dark, light }: { text: string; tint?: TintName; dark?: boolean; light?: boolean }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill, backgroundColor: dark ? C.pill : light ? 'rgba(255,255,255,0.75)' : Tint[tint][0], alignSelf: 'flex-start' }}>
      <Text style={{ fontFamily: F.bodyHeavy, fontSize: 11.5, color: dark ? '#fff' : C.ink }}>{text}</Text>
    </View>
  );
}

/** Small round "3/5" progress badge used on lesson and checklist cards. */
export function CountBadge({ done, total }: { done: number; total: number }) {
  const complete = done >= total;
  return (
    <View style={{ minWidth: 42, height: 42, borderRadius: 21, backgroundColor: complete ? C.ok : C.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, borderWidth: 3, borderColor: '#fff' }}>
      {complete ? <Icon name="check" size={18} color="#fff" strokeWidth={3} /> : <Text style={{ fontFamily: F.bodyHeavy, fontSize: 12, color: '#fff' }}>{done}/{total}</Text>}
    </View>
  );
}

// ---------- Inputs ----------

export function Field({ label, hint, style, ...rest }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <T v="label">{label}</T>
      <TextInput placeholderTextColor={C.inkFaint} {...rest} style={[styles.input, style]} />
      {hint ? <T v="small">{hint}</T> : null}
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange(o.value); }} style={[styles.segmentItem, on && { backgroundColor: C.paper }, on && shadow]} accessibilityRole="button" accessibilityState={{ selected: on }}>
            <Text style={{ fontFamily: on ? F.bodyHeavy : F.bodySemi, fontSize: 13.5, color: on ? C.ink : C.inkSoft }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ value, onChange, step = 1, min = 0, suffix }: { value: number; onChange: (n: number) => void; step?: number; min?: number; suffix?: string }) {
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ''));
  return (
    <Row gap={14}>
      <RoundButton icon="minus" label="Less" onPress={() => onChange(Math.max(min, +(value - step).toFixed(2)))} bg={C.lavender} />
      <T v="num" style={{ minWidth: 70, textAlign: 'center' }}>
        {fmt(value)}
        {suffix ? <T v="small"> {suffix}</T> : null}
      </T>
      <RoundButton icon="plus" label="More" onPress={() => onChange(+(value + step).toFixed(2))} bg={C.lavender} />
    </Row>
  );
}

// ---------- Dog avatar ----------

export function DogAvatar({ dog, size = 64, mood = 'happy', cheerKey }: { dog: Dog | null; size?: number; mood?: Mood; cheerKey?: number }) {
  if (dog?.photoUri) {
    return <Image source={{ uri: dog.photoUri }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: '#fff' }} contentFit="cover" />;
  }
  return <Mascot size={size} mood={mood} fur={dog?.furColor} cheerKey={cheerKey} />;
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, gap: 10 },
  card: { borderRadius: R.lg, padding: 16 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, height: 52, borderRadius: R.pill },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: R.pill, borderWidth: 1.5 },
  badge: { position: 'absolute', top: -4, right: -6, backgroundColor: C.peachDeep, borderRadius: 10, paddingHorizontal: 5, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  input: { backgroundColor: C.paper, borderRadius: R.md, paddingHorizontal: 16, height: 52, fontFamily: F.bodySemi, fontSize: 16, color: C.ink, borderWidth: 1.5, borderColor: C.line },
  segment: { flexDirection: 'row', backgroundColor: C.lavender, borderRadius: R.pill, padding: 4, gap: 4 },
  segmentItem: { flex: 1, height: 40, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
