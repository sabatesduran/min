export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    if (path.startsWith('content://') || path.startsWith('file://')) return `/import-review?uri=${encodeURIComponent(path)}`;
    const url = new URL(path, 'min://app');
    if (url.protocol === 'min:' && url.hostname === 'event') {
      const documentId = url.pathname.replace(/^\//, '');
      return documentId ? `/?documentId=${encodeURIComponent(documentId)}` : '/';
    }
    return path;
  } catch {
    return '/';
  }
}
