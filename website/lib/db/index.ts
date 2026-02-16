import { PrismaClient } from '@/lib/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { cache } from 'react';

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

/**
 * Tạo Prisma client mới cho mỗi request.
 * Trên Cloudflare Workers dùng Hyperdrive, local dev dùng PG_URL.
 * Không dùng global client vì Workers không cho phép reuse connection.
 */
export const getDb = cache(() => {
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error(
      'Không tìm thấy connection string. Thiết lập PG_URL trong .env.local hoặc cấu hình Hyperdrive binding.',
    );
  }

  const pool = new Pool({ connectionString, max: 1 });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
});
