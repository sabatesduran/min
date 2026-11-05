function documentFileStem(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ca')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'document';
}

export function buildDocumentFileName(title: string, revision?: number): string {
  const revisionSuffix = revision === undefined ? '' : `-v${revision}`;
  return `${documentFileStem(title)}${revisionSuffix}.minut.json`;
}
