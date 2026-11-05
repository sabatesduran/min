import { z } from 'zod';

import type { AppPreferences, DocumentOrigin, DocumentPreferences, PersonalTaskState, SharedDocument } from './models';
import { sharedDocumentSchema } from './schema';

const documentPreferencesSchema = z.strictObject({
  documentId: z.string().uuid(),
  mePersonId: z.string().uuid().nullable(),
  filter: z.enum(['all', 'mine']),
  includeCommon: z.boolean(),
  followingPersonId: z.string().uuid().nullable(),
  liveMode: z.enum(['off', 'all', 'mine']),
  liveIncludeCommon: z.boolean(),
  reminderMode: z.enum(['off', 'all', 'mine']),
  reminderIncludeCommon: z.boolean(),
  reminderMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]).nullable(),
});

const personalStateSchema = z.strictObject({
  documentId: z.string().uuid(),
  taskId: z.string().uuid(),
  done: z.boolean(),
  checkedItemIds: z.array(z.string().uuid()),
});

const revisionSchema = z.strictObject({
  document: sharedDocumentSchema,
  contentHash: z.string().min(1).max(256),
  receivedAt: z.string().datetime(),
});

export const backupSchema = z.strictObject({
  backupVersion: z.literal(1),
  exportedAt: z.string().datetime(),
  appPreferences: z.strictObject({
    theme: z.enum(['system', 'light', 'dark']),
    selectedDocumentId: z.string().uuid().nullable(),
  }),
  documents: z.array(z.strictObject({
    document: sharedDocumentSchema,
    draft: sharedDocumentSchema.nullable(),
    origin: z.enum(['author', 'received', 'duplicated', 'demo']),
    favorite: z.boolean(),
    importedAt: z.string().datetime().nullable(),
    updatedAt: z.string().datetime(),
    preferences: documentPreferencesSchema,
    personalStates: z.array(personalStateSchema),
    revisions: z.array(revisionSchema),
  })).max(500),
});

export type MinBackup = {
  backupVersion: 1;
  exportedAt: string;
  appPreferences: AppPreferences;
  documents: {
    document: SharedDocument;
    draft: SharedDocument | null;
    origin: DocumentOrigin;
    favorite: boolean;
    importedAt: string | null;
    updatedAt: string;
    preferences: DocumentPreferences;
    personalStates: PersonalTaskState[];
    revisions: { document: SharedDocument; contentHash: string; receivedAt: string }[];
  }[];
};

export function parseBackup(input: unknown): MinBackup {
  return backupSchema.parse(input) as MinBackup;
}
