import type { StoredDocument } from './models';

export function canEditDocument(document: StoredDocument | null | undefined): boolean {
  return Boolean(document && document.origin !== 'received' && document.origin !== 'demo');
}

export function documentOriginLabel(document: StoredDocument): string {
  if (document.origin === 'demo') return 'Demostració';
  if (document.origin === 'received') return 'Còpia rebuda';
  if (document.origin === 'duplicated') return 'Còpia editable';
  return 'Document propi';
}
