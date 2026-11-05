import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { MIN_DOCUMENT_MIME_TYPE } from '@/features/sharing/document-type';

export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;

export type DocumentFileErrorCode = 'unreadable' | 'invalid' | 'too-large';

export class DocumentFileError extends Error {
  constructor(public readonly code: DocumentFileErrorCode, message: string) {
    super(message);
    this.name = 'DocumentFileError';
  }
}

export async function pickDocumentUri(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [MIN_DOCUMENT_MIME_TYPE, 'application/json'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  return result.canceled ? null : result.assets[0]?.uri ?? null;
}

export async function readDocumentFile(uri: string): Promise<unknown> {
  let content: string;
  try {
    const file = new File(uri);
    if (!file.exists) throw new DocumentFileError('unreadable', 'iOS no ha donat accés al fitxer compartit. Torna’l a compartir amb min.');
    if (file.size > MAX_DOCUMENT_BYTES) throw new DocumentFileError('too-large', 'El fitxer supera el límit de 2 MB.');
    content = await file.text();
  } catch (reason) {
    if (reason instanceof DocumentFileError) throw reason;
    throw new DocumentFileError('unreadable', 'No s’ha pogut llegir el fitxer compartit.');
  }
  try {
    return JSON.parse(content);
  } catch {
    throw new DocumentFileError('invalid', 'El fitxer no conté un document min vàlid.');
  }
}
