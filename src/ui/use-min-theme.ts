import { useColorScheme } from 'react-native';

import { useAppData } from '@/features/app-data/app-data-provider';

import { colorsFor } from './tokens';

export function useMinTheme() {
  const systemScheme = useColorScheme();
  const { appPreferences } = useAppData();
  const preference = appPreferences.theme === 'system' ? systemScheme : appPreferences.theme;
  const scheme = preference === 'dark' ? 'dark' : 'light';
  return { scheme, colors: colorsFor(scheme) } as const;
}
