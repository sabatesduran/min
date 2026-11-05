import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { SharedDocument } from '@/domain/models';
import { nextBoundaryMs } from '@/domain/time';

export function useNow(document?: SharedDocument): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const boundary = document ? nextBoundaryMs(document, now) : null;
    const untilBoundary = boundary ? Math.max(1_000, boundary - now + 50) : 60_000;
    const timer = setTimeout(refresh, Math.min(untilBoundary, 60_000));
    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [document, now]);
  return now;
}
