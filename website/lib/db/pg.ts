import { Pool } from 'pg';

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

export const getPool = () => {
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error('Connection string not found. Set PG_URL in .env.local or configure Hyperdrive binding.');
  }

  return new Pool({ connectionString, max: 1, ssl: false });
};
