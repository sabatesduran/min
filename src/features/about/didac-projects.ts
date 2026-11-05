import type { SQLiteDatabase } from 'expo-sqlite';
import { z } from 'zod';

const ENDPOINT = 'https://didac.dev/api/projects/ios';
const CACHE_DATA_KEY = 'didacProjectsCache';
const CACHE_DATE_KEY = 'didacProjectsCachedAt';
const CACHE_LIFETIME_MS = 24 * 60 * 60 * 1_000;

const httpUrl = z.string().url().refine((value) => value.startsWith('https://') || value.startsWith('http://'));
const projectSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  imageUrl: httpUrl,
  url: httpUrl,
});
const projectsSchema = z.array(projectSchema);

export type DidacProject = z.infer<typeof projectSchema>;
export type DidacProjectsResult = {
  projects: DidacProject[];
  source: 'network' | 'cache' | 'stale-cache';
};

type CachedProjects = { projects: DidacProject[]; cachedAt: number };

export function parseDidacProjects(input: unknown): DidacProject[] {
  return projectsSchema.parse(input).filter((project) => project.name.toLocaleLowerCase('ca') !== 'min');
}

async function readCache(db: SQLiteDatabase): Promise<CachedProjects | null> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM app_preferences WHERE key IN (?, ?)',
    CACHE_DATA_KEY,
    CACHE_DATE_KEY,
  );
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const rawProjects = values.get(CACHE_DATA_KEY);
  const cachedAt = Number(values.get(CACHE_DATE_KEY));
  if (!rawProjects || !Number.isFinite(cachedAt) || cachedAt <= 0) return null;
  try {
    return { projects: parseDidacProjects(JSON.parse(rawProjects)), cachedAt };
  } catch {
    return null;
  }
}

async function writeCache(db: SQLiteDatabase, projects: DidacProject[], nowMs: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO app_preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      CACHE_DATA_KEY,
      JSON.stringify(projects),
    );
    await db.runAsync(
      'INSERT INTO app_preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      CACHE_DATE_KEY,
      `${nowMs}`,
    );
  });
}

export async function loadDidacProjects(
  db: SQLiteDatabase,
  options: { forceRefresh?: boolean; nowMs?: number; fetcher?: typeof fetch } = {},
): Promise<DidacProjectsResult> {
  const nowMs = options.nowMs ?? Date.now();
  const cached = await readCache(db);
  if (!options.forceRefresh && cached && nowMs - cached.cachedAt < CACHE_LIFETIME_MS) {
    return { projects: cached.projects, source: 'cache' };
  }

  try {
    const response = await (options.fetcher ?? fetch)(ENDPOINT, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const projects = parseDidacProjects(await response.json());
    await writeCache(db, projects, nowMs).catch(() => {
      // The public content is still useful even if the local cache cannot be written.
    });
    return { projects, source: 'network' };
  } catch (error) {
    if (cached) return { projects: cached.projects, source: 'stale-cache' };
    throw error;
  }
}
