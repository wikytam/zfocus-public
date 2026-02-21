import { PrismaClient } from '../lib/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { loadEnvFile } from 'node:process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  loadEnvFile(resolve(__dirname, '..', '.env.local'));
} catch {
  // fallback
}

const connectionString = process.env.PG_URL ?? '';
if (!connectionString) {
  console.error('PG_URL not found in environment');
  process.exit(1);
}

const pool = new Pool({ connectionString, max: 1 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const promoCodes = [
  // Legacy codes (from old hardcoded system) - yearly plans
  {
    code: 'ZFOCUS-PREMIUM-2025',
    description: 'Legacy premium code for 2025',
    planType: 'yearly',
    durationDays: 365,
    totalUses: 9999,
    remainingUses: 9999,
    isActive: true,
    expiresAt: new Date('2025-12-31T23:59:59Z'),
  },
  {
    code: 'ZFOCUS-PREMIUM-2026',
    description: 'Legacy premium code for 2026',
    planType: 'yearly',
    durationDays: 365,
    totalUses: 9999,
    remainingUses: 9999,
    isActive: true,
    expiresAt: new Date('2026-12-31T23:59:59Z'),
  },
  // New codes
  {
    code: 'ZFOCUS-YEARLY-2026',
    description: 'Premium yearly code for 2026',
    planType: 'yearly',
    durationDays: 365,
    totalUses: 100,
    remainingUses: 100,
    isActive: true,
    expiresAt: new Date('2026-12-31T23:59:59Z'),
  },
  {
    code: 'ZFOCUS-LIFETIME-001',
    description: 'Lifetime premium code',
    planType: 'lifetime',
    durationDays: null,
    totalUses: 50,
    remainingUses: 50,
    isActive: true,
    expiresAt: null,
  },
  {
    code: 'EARLY-ADOPTER-001',
    description: 'Special lifetime code for early adopters',
    planType: 'lifetime',
    durationDays: null,
    totalUses: 20,
    remainingUses: 20,
    isActive: true,
    expiresAt: new Date('2027-12-31T23:59:59Z'),
  },
  {
    code: 'ZFOCUS-BETA-TESTER',
    description: 'Yearly code for beta testers',
    planType: 'yearly',
    durationDays: 365,
    totalUses: 50,
    remainingUses: 50,
    isActive: true,
    expiresAt: new Date('2026-06-30T23:59:59Z'),
  },
];

const main = async () => {
  console.log('Seeding promo codes...');

  for (const code of promoCodes) {
    const result = await prisma.promoCode.upsert({
      where: { code: code.code },
      update: {
        description: code.description,
        planType: code.planType,
        durationDays: code.durationDays,
        totalUses: code.totalUses,
        remainingUses: code.remainingUses,
        isActive: code.isActive,
        expiresAt: code.expiresAt,
      },
      create: code,
    });
    console.log(`  [OK] ${result.code} (${result.planType}) - ${result.remainingUses}/${result.totalUses} uses`);
  }

  console.log('Done seeding promo codes.');
};

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
