import { Text, type TextProps, type TextStyle } from 'react-native';

import { typography } from '@/ui/tokens';
import { useMinTheme } from '@/ui/use-min-theme';

type Variant = keyof typeof typography;

export function MinText({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  const { colors } = useMinTheme();
  return <Text {...props} style={[typography[variant] as TextStyle, { color: colors.text }, style]} />;
}
