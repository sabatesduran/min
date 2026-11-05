import type { Accent } from '@/domain/models';
import type { ThemeColors } from '@/ui/tokens';

export const accents: readonly Accent[] = ['blue', 'lime', 'lilac', 'peach', 'red'];

export const accentLabels: Record<Accent, string> = {
  blue: 'Blau',
  lime: 'Llima',
  lilac: 'Lila',
  peach: 'Préssec',
  red: 'Vermell',
};

export function colorForAccent(accent: Accent | undefined, colors: ThemeColors): string {
  if (accent === 'lime') return colors.now;
  if (accent === 'lilac') return colors.lilac;
  if (accent === 'peach') return colors.peach;
  if (accent === 'red') return colors.red;
  return colors.brand;
}

export function inkForAccent(accent: Accent | undefined, colors: ThemeColors): string {
  if (accent === 'blue') return colors.brandInk;
  if (accent === 'red') return colors.redInk;
  return colors.text;
}
