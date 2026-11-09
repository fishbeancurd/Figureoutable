import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Text as SvgText } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { C, F } from '@/constants/theme';
import { T } from './ui';
import type { Dog } from '@/lib/types';
import { ageWeeks, expectedWeightKg } from '@/lib/dogmath';

function Bar({ value, max, color, i, height }: { value: number; max: number; color: string; i: number; height: number }) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.set(withDelay(i * 60, withTiming(max ? Math.min(1, value / max) : 0, { duration: 700, easing: Easing.out(Easing.back(1.4)) })));
  }, [value, max, h, i]);
  const a = useAnimatedStyle(() => ({ height: Math.max(4, h.value * height) }));
  return <Animated.View style={[{ width: '100%', borderRadius: 8, backgroundColor: color }, a]} />;
}

/** Vertical bars with an optional dashed target line. Labels under each bar. */
export function BarChart({
  data,
  target,
  color,
  soft,
  height = 120,
  unit,
}: {
  data: { label: string; value: number; highlight?: boolean }[];
  target?: number;
  color: string;
  soft: string;
  height?: number;
  unit?: string;
}) {
  const max = Math.max(target ?? 0, ...data.map((d) => d.value), 1) * 1.1;
  const targetY = target ? height - (target / max) * height : 0;
  return (
    <View>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        {data.map((d, i) => (
          <View key={i} style={{ flex: 1, height, justifyContent: 'flex-end' }}>
            <Bar value={d.value} max={max} color={d.highlight ? color : target && d.value >= target * 0.9 ? color : soft} i={i} height={height} />
          </View>
        ))}
        {target ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: targetY, borderTopWidth: 2, borderColor: C.ink, borderStyle: 'dashed', opacity: 0.45 }} />
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        {data.map((d, i) => (
          <T key={i} v="small" style={{ flex: 1, textAlign: 'center', fontSize: 10.5, color: d.highlight ? C.ink : C.inkSoft, fontFamily: d.highlight ? F.bodyHeavy : F.bodySemi }}>
            {d.label}
          </T>
        ))}
      </View>
    </View>
  );
}

/** Weight entries plotted against the expected growth band (±15%) for the dog's size. */
export function GrowthChart({ dog, width }: { dog: Dog; width: number }) {
  const h = 170;
  const padL = 34;
  const padB = 22;
  const padT = 10;
  const nowW = ageWeeks(dog.birthDate);
  const points = [...dog.weights]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((w) => ({ wk: (new Date(w.date).getTime() - new Date(dog.birthDate).getTime()) / (7 * 86400000), kg: w.kg }));
  const minW = Math.max(0, Math.floor(Math.min(nowW - 6, ...points.map((p) => p.wk)) / 2) * 2);
  const maxW = Math.max(minW + 8, Math.ceil(nowW + 4));
  const samples: number[] = [];
  for (let w = minW; w <= maxW; w += (maxW - minW) / 24) samples.push(w);
  const maxKg = Math.max(...samples.map((w) => expectedWeightKg(dog, w) * 1.15), ...points.map((p) => p.kg)) * 1.08;
  const x = (wk: number) => padL + ((wk - minW) / (maxW - minW)) * (width - padL - 22);
  const y = (kg: number) => padT + (1 - kg / maxKg) * (h - padT - padB);
  const upper = samples.map((w) => `${x(w)},${y(expectedWeightKg(dog, w) * 1.15)}`);
  const lower = samples.map((w) => `${x(w)},${y(expectedWeightKg(dog, w) * 0.85)}`).reverse();
  const band = `M${upper.join(' L')} L${lower.join(' L')} Z`;
  const mid = samples.map((w) => `${x(w)},${y(expectedWeightKg(dog, w))}`).join(' ');
  const ticks = [0, 0.5, 1].map((f) => +(maxKg * f * 0.9).toFixed(maxKg < 10 ? 1 : 0));
  const xTicks = [minW, Math.round((minW + maxW) / 2), maxW];

  return (
    <Svg width={width} height={h}>
      {ticks.map((t) => (
        <React.Fragment key={t}>
          <Line x1={padL} x2={width - 8} y1={y(t)} y2={y(t)} stroke={C.line} strokeWidth={1} />
          <SvgText x={padL - 6} y={y(t) + 4} fontSize={10} fill={C.inkSoft} textAnchor="end" fontFamily={F.bodySemi}>
            {t}
          </SvgText>
        </React.Fragment>
      ))}
      {xTicks.map((t) => (
        <SvgText key={t} x={x(t)} y={h - 6} fontSize={10} fill={C.inkSoft} textAnchor="middle" fontFamily={F.bodySemi}>
          {t < 26 ? `${t}w` : `${Math.round(t / 4.345)}mo`}
        </SvgText>
      ))}
      <Path d={band} fill={C.mint} opacity={0.75} />
      <Polyline points={mid} fill="none" stroke={C.mintDeep} strokeWidth={1.5} strokeDasharray="4 4" />
      <Line x1={x(nowW)} x2={x(nowW)} y1={padT} y2={h - padB} stroke={C.lavenderDeep} strokeWidth={1.5} strokeDasharray="2 4" />
      {points.length > 1 && (
        <Polyline points={points.map((p) => `${x(p.wk)},${y(p.kg)}`).join(' ')} fill="none" stroke={C.peachDeep} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      )}
      {points.map((p, i) => (
        <Circle key={i} cx={x(p.wk)} cy={y(p.kg)} r={i === points.length - 1 ? 6 : 4} fill={C.peachDeep} stroke="#fff" strokeWidth={2} />
      ))}
    </Svg>
  );
}

/** Dots for each potty trip by hour of day over recent days: reveals the dog's rhythm. */
export function HourDots({ entries, width }: { entries: { hour: number; accident: boolean }[]; width: number }) {
  const h = 54;
  const x = (hr: number) => 8 + (hr / 24) * (width - 16);
  return (
    <Svg width={width} height={h}>
      <Line x1={8} x2={width - 8} y1={30} y2={30} stroke={C.line} strokeWidth={2} />
      {entries.map((e, i) => (
        <Circle key={i} cx={x(e.hour)} cy={30 + ((i % 5) - 2) * 4} r={4} fill={e.accident ? C.roseDeep : C.butterDeep} opacity={0.75} />
      ))}
      {[0, 6, 12, 18, 24].map((hr) => (
        <SvgText key={hr} x={x(hr)} y={h - 2} fontSize={9.5} fill={C.inkSoft} textAnchor="middle" fontFamily={F.bodySemi}>
          {hr === 0 || hr === 24 ? '12a' : hr === 12 ? '12p' : hr < 12 ? `${hr}a` : `${hr - 12}p`}
        </SvgText>
      ))}
    </Svg>
  );
}
