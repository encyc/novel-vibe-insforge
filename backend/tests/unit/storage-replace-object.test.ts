import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pool, PoolClient } from 'pg';
import type { StorageProvider } from '@/providers/storage/base.provider.js';

vi.mock('@/infra/database/database.manager.js', () => ({
  DatabaseManager: {
    getInstance: () => ({ getPool: () => mockPool }),
  },
}));

let mockPool: Pool;
let calls: Array<{ sql: string; params?: unknown[] }>;
let queryResults: Array<{ rows: unknown[]; rowCount: number }>;

function makeMockPool(): Pool {
  calls = [];
  queryResults = [];
  const client = {
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      calls.push({ sql, params });
      return queryResults.shift() ?? { rows: [], rowCount: 0 };
    }),
    release: vi.fn(),
  } as unknown as PoolClient;
  return { connect: vi.fn(async () => client), query: client.query } as unknown as Pool;
}

describe('StorageService.replaceObject', () => {
  beforeEach(() => {
    mockPool = makeMockPool();
    vi.resetModules();
  });

  it('overwrites the exact visible key and updates its metadata', async () => {
    const { StorageService } = await import('@/services/storage/storage.service.js');
    const service = StorageService.getInstance();
    const putObject = vi.fn(async () => ({ etag: 'etag-v2' }));
    (service as unknown as { provider: StorageProvider }).provider = {
      putObject,
    } as unknown as StorageProvider;
    const uploadedAt = new Date('2026-06-28T00:00:00.000Z');
    queryResults = [
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [{ key: 'novel.md' }], rowCount: 1 },
      { rows: [{ uploadedAt }], rowCount: 1 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 1 },
    ];
    const file = {
      buffer: Buffer.from('updated'),
      size: 7,
      mimetype: 'text/markdown',
      originalname: 'novel.md',
    } as Express.Multer.File;

    const result = await service.replaceObject(
      { userId: 'user-1', role: 'authenticated' },
      'novels',
      'project/novel.md',
      file
    );

    expect(putObject).toHaveBeenCalledWith('novels', 'project/novel.md', file);
    expect(result).toMatchObject({
      bucket: 'novels',
      key: 'project/novel.md',
      size: 7,
      mimeType: 'text/markdown',
    });
    expect(calls.some(({ sql }) => sql.includes('UPDATE storage.objects'))).toBe(true);
    expect(calls.some(({ sql }) => sql.includes('generateNextAvailableKey'))).toBe(false);
  });
});
