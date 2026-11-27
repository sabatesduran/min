import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { MinBackup } from '@/domain/backup';
import { downloadTextFile, readTextFile } from '@/features/sharing/web-files';

export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

export async function shareBackupFile(backup: MinBackup): Promise<string> {
  const stamp = backup.exportedAt.slice(0, 10);
  if (Platform.OS === 'web') return downloadTextFile(`min-backup-${stamp}.json`, `${JSON.stringify(backup, null, 2)}\n`, 'application/json');
  const file = new File(Paths.cache, `min-backup-${stamp}.json`);
  if (file.exists) file.delete();
  file.create({ intermediates: true });
  await file.write(`${JSON.stringify(backup, null, 2)}\n`);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Exporta les dades de min' });
  }
  return file.uri;
}

export async function readBackupFile(uri: string): Promise<unknown> {
  if (Platform.OS === 'web') {
    const content = await readTextFile(uri, MAX_BACKUP_BYTES).catch(() => null);
    if (content === null) throw new Error('No s’ha pogut llegir la còpia de seguretat.');
    if (content === 'too-large') throw new Error('La còpia supera el límit de 20 MB.');
    try {
      return JSON.parse(content);
    } catch {
      throw new Error('El fitxer no conté una còpia de seguretat vàlida.');
    }
  }
  const file = new File(uri);
  if (!file.exists) throw new Error('No s’ha pogut llegir la còpia de seguretat.');
  if (file.size > MAX_BACKUP_BYTES) throw new Error('La còpia supera el límit de 20 MB.');
  try {
    return JSON.parse(await file.text());
  } catch {
    throw new Error('El fitxer no conté una còpia de seguretat vàlida.');
  }
}
