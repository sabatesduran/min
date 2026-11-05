import type { ColorSchemeName, TextStyle, ViewStyle } from 'react-native';

export const palette = {
  brand: '#3947F5',
  brandPressed: '#2E38CC',
  lime: '#D8FA67',
  paper: '#F6F4EC',
  ink: '#20221F',
  secondary: '#646862',
  soft: '#EAEDE4',
  line: '#D6D9CF',
  lilac: '#E7E4FF',
  peach: '#F8DCCA',
  error: '#A7352A',
  errorSoft: '#F8DDD8',
  warning: '#765300',
  warningSoft: '#F8E8B9',
  success: '#21663A',
  successSoft: '#DCEFE0',
  whiteInk: '#F9F8F2',
  dark: {
    canvas: '#1C1A16',
    surface: '#28281F',
    raised: '#343128',
    text: '#F7F2E7',
    secondary: '#BDB5A6',
    line: '#504C3F',
    brand: '#7D87FF',
    lime: '#C7E95C',
    error: '#FFB4A9',
    warning: '#FFD977',
    success: '#93D7A5',
  },
} as const;

export const spacing = {
  x1: 4,
  x2: 8,
  x3: 12,
  x4: 16,
  x5: 20,
  x6: 24,
  x8: 32,
  x10: 40,
} as const;

export const radius = {
  input: 12,
  button: 16,
  card: 24,
  sheet: 28,
  pill: 999,
} as const;

export const type = {
  caption: 12,
  metadata: 14,
  body: 16,
  label: 20,
  title: 26,
  hero: 34,
  display: 42,
} as const;

export type ThemeColors = {
  canvas: string;
  surface: string;
  raised: string;
  text: string;
  secondary: string;
  line: string;
  brand: string;
  brandInk: string;
  now: string;
  nowInk: string;
  lilac: string;
  peach: string;
  error: string;
  errorSoft: string;
  warning: string;
  warningSoft: string;
  success: string;
  successSoft: string;
  focus: string;
};

const light: ThemeColors = {
  canvas: palette.paper,
  surface: palette.soft,
  raised: '#FDFCF7',
  text: palette.ink,
  secondary: palette.secondary,
  line: palette.line,
  brand: palette.brand,
  brandInk: palette.whiteInk,
  now: palette.lime,
  nowInk: palette.ink,
  lilac: palette.lilac,
  peach: palette.peach,
  error: palette.error,
  errorSoft: palette.errorSoft,
  warning: palette.warning,
  warningSoft: palette.warningSoft,
  success: palette.success,
  successSoft: palette.successSoft,
  focus: palette.brand,
};

const dark: ThemeColors = {
  canvas: palette.dark.canvas,
  surface: palette.dark.surface,
  raised: palette.dark.raised,
  text: palette.dark.text,
  secondary: palette.dark.secondary,
  line: palette.dark.line,
  brand: palette.dark.brand,
  brandInk: palette.dark.canvas,
  now: palette.dark.lime,
  nowInk: palette.dark.canvas,
  lilac: '#3D3858',
  peach: '#51392E',
  error: palette.dark.error,
  errorSoft: '#4D2925',
  warning: palette.dark.warning,
  warningSoft: '#4B3C1D',
  success: palette.dark.success,
  successSoft: '#263E2A',
  focus: palette.dark.brand,
};

export function colorsFor(scheme: ColorSchemeName): ThemeColors {
  return scheme === 'dark' ? dark : light;
}

export const typography = {
  display: {
    fontSize: type.display,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -1.2,
  } satisfies TextStyle,
  hero: {
    fontSize: type.hero,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.8,
  } satisfies TextStyle,
  title: {
    fontSize: type.title,
    lineHeight: 31,
    fontWeight: '700',
    letterSpacing: -0.4,
  } satisfies TextStyle,
  label: {
    fontSize: type.label,
    lineHeight: 25,
    fontWeight: '600',
  } satisfies TextStyle,
  body: {
    fontSize: type.body,
    lineHeight: 23,
    fontWeight: '400',
  } satisfies TextStyle,
  metadata: {
    fontSize: type.metadata,
    lineHeight: 19,
    fontWeight: '400',
  } satisfies TextStyle,
  caption: {
    fontSize: type.caption,
    lineHeight: 16,
    fontWeight: '500',
  } satisfies TextStyle,
  time: {
    fontSize: type.label,
    lineHeight: 25,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
} as const;

export const layout = {
  screen: {
    flex: 1,
    paddingHorizontal: spacing.x5,
  } satisfies ViewStyle,
  contentMaxWidth: 680,
  touchTarget: 48,
} as const;
