import { router } from 'expo-router';

/** Goes back, or to the entry screen when there is no history (e.g. after a browser reload). */
export function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
