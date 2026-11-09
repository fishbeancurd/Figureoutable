// Pawgress design tokens: cozy pastel (lavender, mint, peach, butter) with a deep plum ink
// and a floating dark pill navigation, as picked in the style review.

export const C = {
  bg: '#F4F0FB',
  paper: '#FFFFFF',
  ink: '#33284A',
  inkSoft: '#766C88',
  inkFaint: '#B2A9C2',
  line: '#E7E1F2',

  lavender: '#E1D9F7',
  lavenderDeep: '#A996EC',
  peach: '#FFDCCB',
  peachDeep: '#FF9C74',
  mint: '#D2ECDA',
  mintDeep: '#6DB487',
  butter: '#FCEDBC',
  butterDeep: '#E6B94A',
  sky: '#D5E7FA',
  skyDeep: '#6FA6E4',
  rose: '#FBD6DF',
  roseDeep: '#E7708E',

  pill: '#2E2541',
  danger: '#E2574C',
  dangerSoft: '#FDE0DC',
  ok: '#4FA470',
  okSoft: '#DDF2E3',
  warn: '#D99A1E',
  warnSoft: '#FCEFCB',
} as const;

export const F = {
  display: 'Grandstander_700Bold',
  displayMed: 'Grandstander_600SemiBold',
  body: 'Mulish_400Regular',
  bodySemi: 'Mulish_600SemiBold',
  bodyBold: 'Mulish_700Bold',
  bodyHeavy: 'Mulish_800ExtraBold',
} as const;

export const R = { sm: 12, md: 18, lg: 24, xl: 30, pill: 999 } as const;

export const shadow = {
  shadowColor: '#4B3B78',
  shadowOpacity: 0.12,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
} as const;

/** Pastel pairs used for categories: [soft background, strong accent]. */
export const Tint = {
  lavender: [C.lavender, C.lavenderDeep],
  peach: [C.peach, C.peachDeep],
  mint: [C.mint, C.mintDeep],
  butter: [C.butter, C.butterDeep],
  sky: [C.sky, C.skyDeep],
  rose: [C.rose, C.roseDeep],
} as const;
export type TintName = keyof typeof Tint;

/** Space reserved at the bottom of tab screens for the floating nav. */
export const TAB_BAR_SPACE = 120;
