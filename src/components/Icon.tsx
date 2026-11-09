import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { C } from '@/constants/theme';

export type IconName =
  | 'home' | 'chart' | 'camera' | 'calendar' | 'book' | 'chat' | 'paw' | 'bowl' | 'bone' | 'potty' | 'medal'
  | 'brush' | 'moon' | 'heart' | 'cross' | 'spark' | 'plus' | 'chevron' | 'back' | 'check' | 'close' | 'send'
  | 'image' | 'bell' | 'scale' | 'edit' | 'trash' | 'user' | 'flame' | 'star' | 'ball' | 'clock' | 'bulb'
  | 'lock' | 'share' | 'refresh' | 'sun' | 'map' | 'list' | 'minus';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
}

export function Icon({ name, size = 22, color = C.ink, strokeWidth = 2, fill = 'none' }: Props) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill };
  const solid = { fill: color };
  let body: React.ReactNode;
  switch (name) {
    case 'home': body = <Path {...p} d="M3.5 11 12 4l8.5 7v8.2a.8.8 0 0 1-.8.8H15v-6H9v6H4.3a.8.8 0 0 1-.8-.8z" />; break;
    case 'chart': body = <Path {...p} d="M5 20v-7M11 20V5M17 20v-10M3 20h18" />; break;
    case 'camera': body = <><Path {...p} d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><Circle {...p} cx={12} cy={13.5} r={3.5} /></>; break;
    case 'calendar': body = <><Rect {...p} x={3} y={5} width={18} height={16} rx={3} /><Path {...p} d="M3 10h18M8 3v4M16 3v4" /></>; break;
    case 'book': body = <Path {...p} d="M5 19.5V5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5 2.5 2.5 0 0 0 7.5 21H19M9 7h6" />; break;
    case 'chat': body = <Path {...p} d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-5 4v-4.5H5.5A1.5 1.5 0 0 1 4 14.5z" />; break;
    case 'paw': body = <><Ellipse {...solid} cx={12} cy={16} rx={4.6} ry={3.8} /><Circle {...solid} cx={5.8} cy={10.8} r={2.1} /><Circle {...solid} cx={9.6} cy={6.8} r={2.1} /><Circle {...solid} cx={14.4} cy={6.8} r={2.1} /><Circle {...solid} cx={18.2} cy={10.8} r={2.1} /></>; break;
    case 'bowl': body = <Path {...p} d="M3 11h18a9 7 0 0 1-18 0zM8.5 7.5c0-1.6.8-3 2-3.5M13.5 7.5c0-1.6.8-3 2-3.5" />; break;
    case 'bone': body = <Path {...p} d="M8.2 6.4a2.6 2.6 0 1 0-3.7 2.2 2.6 2.6 0 1 0 2.2 3.7l5 5a2.6 2.6 0 1 0 3.7-2.2 2.6 2.6 0 1 0-2.2-3.7z" transform="rotate(0)" />; break;
    case 'potty': body = <Path {...p} d="M12 3.5s6 6.8 6 10.8a6 6 0 0 1-12 0c0-4 6-10.8 6-10.8z" />; break;
    case 'medal': body = <><Circle {...p} cx={12} cy={15} r={5} /><Path {...p} d="M8 3l3 7M16 3l-3 7M12 13v4" /></>; break;
    case 'brush': body = <Path {...p} d="M14.5 3.5l6 6-8.5 8.5H6v-6zM10 8l6 6M6 18l-2.5 2.5" />; break;
    case 'moon': body = <Path {...p} d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />; break;
    case 'heart': body = <Path {...p} d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z" />; break;
    case 'cross': body = <Path {...p} d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z" />; break;
    case 'spark': body = <Path {...p} d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />; break;
    case 'plus': body = <Path {...p} d="M12 5v14M5 12h14" />; break;
    case 'minus': body = <Path {...p} d="M5 12h14" />; break;
    case 'chevron': body = <Path {...p} d="M9 6l6 6-6 6" />; break;
    case 'back': body = <Path {...p} d="M15 6l-6 6 6 6" />; break;
    case 'check': body = <Path {...p} d="M5 12.5l4.5 4.5L19 7" />; break;
    case 'close': body = <Path {...p} d="M6 6l12 12M18 6 6 18" />; break;
    case 'send': body = <Path {...p} d="M4.5 12 20 4.5 15 20l-3-6.5z M12 13.5 20 4.5" />; break;
    case 'image': body = <><Rect {...p} x={3} y={4} width={18} height={16} rx={3} /><Path {...p} d="M3.5 17l5-5 4 4 3-3 5 5" /><Circle {...p} cx={8.5} cy={9} r={1.5} /></>; break;
    case 'bell': body = <Path {...p} d="M6 10a6 6 0 0 1 12 0v4l2 3H4l2-3zM10 20a2 2 0 0 0 4 0" />; break;
    case 'scale': body = <><Path {...p} d="M5 4h14l1.5 16h-17z" /><Path {...p} d="M8.5 10a3.5 3.5 0 0 1 7 0M12 10l1.5-2" /></>; break;
    case 'edit': body = <Path {...p} d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />; break;
    case 'trash': body = <Path {...p} d="M5 7h14M9.5 7V4.5h5V7M7 7l1 13h8l1-13" />; break;
    case 'user': body = <><Circle {...p} cx={12} cy={8} r={4} /><Path {...p} d="M4 21a8 8 0 0 1 16 0" /></>; break;
    case 'flame': body = <Path {...p} d="M12 3c1 4 6 5.5 6 11a6 6 0 0 1-12 0c0-3 1.8-4.3 2.5-6.5.9 1.4 1.5 2.3 1.5 4 1.6-2.2 2.3-5.5 2-8.5z" />; break;
    case 'star': body = <Path {...p} d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />; break;
    case 'ball': body = <><Circle {...p} cx={12} cy={12} r={8} /><Path {...p} d="M4.6 9.3c5 1.3 9.8 1.3 14.8 0M4.6 14.7c5-1.3 9.8-1.3 14.8 0" /></>; break;
    case 'clock': body = <><Circle {...p} cx={12} cy={12} r={8.5} /><Path {...p} d="M12 7.5V12l3 2" /></>; break;
    case 'bulb': body = <Path {...p} d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" />; break;
    case 'lock': body = <><Rect {...p} x={5} y={11} width={14} height={10} rx={2.5} /><Path {...p} d="M8 11V8a4 4 0 0 1 8 0v3" /></>; break;
    case 'share': body = <Path {...p} d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7" />; break;
    case 'refresh': body = <Path {...p} d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" />; break;
    case 'sun': body = <><Circle {...p} cx={12} cy={12} r={4} /><Path {...p} d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>; break;
    case 'map': body = <Path {...p} d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6zM9 4v14M15 6v14" />; break;
    case 'list': body = <Path {...p} d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />; break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}
