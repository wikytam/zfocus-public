import { Pool } from 'pg';

let cachedPool: Pool | null = null;
let lastConnectionString = '';

const getConnectionString = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const { env } = getCloudflareContext();
    if (env?.HYPERDRIVE?.connectionString) {
      return env.HYPERDRIVE.connectionString as string;
    }
  } catch {
    // Not running on Cloudflare, fall through to PG_URL
  }
  return process.env.PG_URL ?? '';
};

export const getPool = (): Pool => {
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error('Connection string not found. Set PG_URL in .env.local or configure Hyperdrive binding.');
  }

  // Reuse existing pool if connection string hasn't changed
  if (cachedPool && lastConnectionString === connectionString) {
    return cachedPool;
  }

  // Close old pool if connection string changed
  if (cachedPool && lastConnectionString !== connectionString) {
    cachedPool.end().catch(() => {});
  }

  lastConnectionString = connectionString;
  cachedPool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: false,
  });

  return cachedPool;
};
