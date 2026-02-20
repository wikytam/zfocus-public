import { defineConfig } from 'prisma/config';
import path from 'node:path';
import { loadEnvFile } from 'node:process';

// Tải biến môi trường từ .env.local (Next.js convention)
try {
  loadEnvFile(path.resolve(__dirname, '.env.local'));
} catch {
  // Bỏ qua nếu không tìm thấy .env.local
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.PG_URL,
  },
});
