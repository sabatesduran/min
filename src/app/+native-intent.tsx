const EVENT_LINK = /^min:\/\/\/?event\/([^/?#]+)/i;

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    if (path.startsWith('content://') || path.startsWith('file://')) return `/import-review?uri=${encodeURIComponent(path)}`;
    const eventId = EVENT_LINK.exec(path)?.[1];
    if (eventId) return `/?documentId=${encodeURIComponent(decodeURIComponent(eventId))}`;
    // Any other min:// link (e.g. the empty widget's min://app) opens the entry screen.
    if (/^min:/i.test(path)) return '/';
    return path;
  } catch {
    return '/';
  }
}
