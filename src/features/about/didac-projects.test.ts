import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDatabase } from '@/db/migrations';

import { loadDidacProjects, parseDidacProjects } from './didac-projects';

type SqlValue = string | number | bigint | null | Uint8Array;

function expoAdapter(database: DatabaseSync): SQLiteDatabase {
  return {
    execAsync: async (source: string) => database.exec(source),
    getFirstAsync: async <T>(source: string, ...params: SqlValue[]) => database.prepare(source).get(...params) as T | null,
    getAllAsync: async <T>(source: string, ...params: SqlValue[]) => database.prepare(source).all(...params) as T[],
    runAsync: async (source: string, ...params: SqlValue[]) => database.prepare(source).run(...params),
    withTransactionAsync: async (task: () => Promise<void>) => {
      database.exec('BEGIN');
      try {
        await task();
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  } as unknown as SQLiteDatabase;
}

const projects = [
  { name: 'min', description: 'Aquesta app', imageUrl: 'https://min.example/icon.png', url: 'https://min.example' },
  { name: 'Veura', description: 'Veu a text', imageUrl: 'https://veura.app/icon.png', url: 'https://veura.app' },
];

describe('projectes de didac.dev', () => {
  let native: DatabaseSync;
  let db: SQLiteDatabase;

  beforeEach(async () => {
    native = new DatabaseSync(':memory:');
    db = expoAdapter(native);
    await migrateDatabase(db);
  });

  afterEach(() => native.close());

  it('valida les dades i no mostra min com un projecte propi', () => {
    expect(parseDidacProjects(projects).map((project) => project.name)).toEqual(['Veura']);
    expect(() => parseDidacProjects([{ name: 'Trencat' }])).toThrow();
  });

  it('reutilitza la cache durant 24 hores', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify(projects), { status: 200 })) as unknown as typeof fetch;
    const first = await loadDidacProjects(db, { fetcher, nowMs: 1_000 });
    const second = await loadDidacProjects(db, { fetcher, nowMs: 60 * 60 * 1_000 });

    expect(first.source).toBe('network');
    expect(second.source).toBe('cache');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('recupera la cache antiga si no hi ha connexió', async () => {
    const success = vi.fn(async () => new Response(JSON.stringify(projects), { status: 200 })) as unknown as typeof fetch;
    await loadDidacProjects(db, { fetcher: success, nowMs: 1_000 });
    const offline = vi.fn(async () => { throw new Error('Sense connexió'); }) as unknown as typeof fetch;

    const result = await loadDidacProjects(db, { fetcher: offline, nowMs: 25 * 60 * 60 * 1_000 });

    expect(result.source).toBe('stale-cache');
    expect(result.projects.map((project) => project.name)).toEqual(['Veura']);
  });
});
