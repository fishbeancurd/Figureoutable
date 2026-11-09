import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type Mood = 'happy' | 'sleepy' | 'cheer';

interface Props {
  size?: number;
  mood?: Mood;
  fur?: string;
  /** Change this value to make the pup do a little celebration hop. */
  cheerKey?: number;
}

const INK = '#3A2C3F';

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amt)));
  return `#${((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0')}`;
}

/** A soft illustrated pup that bobs, wags, blinks, naps and hops. Drawn in layers so each part can move. */
export function Mascot({ size = 120, mood = 'happy', fur = '#E9B48C', cheerKey = 0 }: Props) {
  const reduced = useReducedMotion();
  const S = size / 120;
  const furDark = shade(fur, -28);
  const cream = '#FFF5EA';
  const blush = '#F2A29A';

  const wag = useSharedValue(0);
  const bob = useSharedValue(0);
  const blink = useSharedValue(1);
  const hop = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    const sleepy = mood === 'sleepy';
    wag.set(withRepeat(withTiming(1, { duration: sleepy ? 1800 : 260, easing: Easing.inOut(Easing.quad) }), -1, true));
    bob.set(withRepeat(withTiming(1, { duration: sleepy ? 2200 : 1300, easing: Easing.inOut(Easing.sin) }), -1, true));
    if (!sleepy) {
      blink.set(
        withRepeat(withSequence(withDelay(2800, withTiming(0.1, { duration: 90 })), withTiming(1, { duration: 120 })), -1, false),
      );
    }
  }, [mood, reduced, wag, bob, blink]);

  useEffect(() => {
    if (!cheerKey || reduced) return;
    hop.set(withSequence(withSpring(1, { damping: 6, stiffness: 260 }), withSpring(0, { damping: 9 })));
  }, [cheerKey, reduced, hop]);

  const sleepy = mood === 'sleepy';

  const bodyStyle = useAnimatedStyle(() => ({
    transform: sleepy
      ? [{ translateY: size * 0.02 }, { scaleY: 1 + bob.value * 0.035 }]
      : [{ translateY: -bob.value * size * 0.035 - hop.value * size * 0.18 }, { rotate: `${hop.value * -6}deg` }],
  }));
  const tailStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(sleepy ? -6 : -16) + wag.value * (sleepy ? 8 : 34)}deg` }],
  }));
  const eyeStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[{ width: size, height: size }, bodyStyle]}>
        {/* tail (behind body) */}
        <Animated.View
          style={[
            { position: 'absolute', left: 80 * S, top: 62 * S, width: 30 * S, height: 36 * S, transformOrigin: '20% 83%' },
            tailStyle,
          ]}>
          <Svg width={30 * S} height={36 * S} viewBox="0 0 30 36">
            <Path d="M6 30 q20 -4 18 -26 q-2 10 -14 14z" fill={furDark} />
          </Svg>
        </Animated.View>

        <Svg width={size} height={size} viewBox="0 0 120 120" style={{ position: 'absolute' }}>
          {/* body and paws */}
          <Ellipse cx={60} cy={96} rx={30} ry={19} fill={fur} />
          <Ellipse cx={60} cy={100} rx={15} ry={12} fill={cream} />
          <Ellipse cx={45} cy={112} rx={9} ry={6} fill={cream} />
          <Ellipse cx={75} cy={112} rx={9} ry={6} fill={cream} />
          {/* ears */}
          <Path d={sleepy ? 'M34 42 30 16 54 30z' : 'M34 38 40 8 58 28z'} fill={furDark} />
          <Path d={sleepy ? 'M86 42 90 16 66 30z' : 'M86 38 80 8 62 28z'} fill={furDark} />
          <Path d={sleepy ? 'M38 36 36 23 49 30z' : 'M40 30 42 17 51 27z'} fill={blush} opacity={0.6} />
          <Path d={sleepy ? 'M82 36 84 23 71 30z' : 'M80 30 78 17 69 27z'} fill={blush} opacity={0.6} />
          {/* head */}
          <Circle cx={60} cy={54} r={30} fill={fur} />
          <Ellipse cx={60} cy={67} rx={17} ry={13} fill={cream} />
          <Circle cx={39} cy={62} r={5} fill={blush} opacity={0.55} />
          <Circle cx={81} cy={62} r={5} fill={blush} opacity={0.55} />
          {sleepy && (
            <Path d="M43 52q5 4 10 0M67 52q5 4 10 0" stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />
          )}
          <Ellipse cx={60} cy={61} rx={5} ry={3.6} fill={INK} />
          <Path d="M54 68q6 5 12 0" stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          {!sleepy && <Path d="M57 70q3 7 6 0" fill="#F27D8C" />}
        </Svg>

        {/* eyes (separate layer so they can blink) */}
        {!sleepy && (
          <Animated.View style={[{ position: 'absolute', left: 44 * S, top: 44 * S, width: 32 * S, height: 12 * S }, eyeStyle]}>
            <Svg width={32 * S} height={12 * S} viewBox="0 0 32 12">
              <Ellipse cx={5} cy={6} rx={4} ry={5} fill={INK} />
              <Ellipse cx={27} cy={6} rx={4} ry={5} fill={INK} />
              <Circle cx={6.4} cy={4} r={1.4} fill="#fff" />
              <Circle cx={28.4} cy={4} r={1.4} fill="#fff" />
            </Svg>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

export const FUR_COLORS = ['#E9B48C', '#D98E52', '#F3DCC0', '#8C6A5A', '#4A3B3F', '#C9C0B8', '#F2E9DF'];
