import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;

export async function pickDocumentUri(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/vnd.min.document+json', 'application/json'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  return result.canceled ? null : result.assets[0]?.uri ?? null;
}

export async function readDocumentFile(uri: string): Promise<unknown> {
  const file = new File(uri);
  if (!file.exists) throw new Error('No s’ha pogut llegir el fitxer.');
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error('El fitxer supera el límit de 2 MB.');
  try {
    return JSON.parse(await file.text());
  } catch {
    throw new Error('El fitxer no conté un document min vàlid.');
  }
}
