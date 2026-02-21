import { getPool } from '@/lib/db/pg';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const GET = async (request: NextRequest) => {
  const pool = getPool();
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code || code.trim().length === 0) {
      return NextResponse.json({ valid: false, error: 'Missing  code parameter' }, { status: 400 });
    }

    const trimmedCode = code.trim().toUpperCase();

    const result = await pool.query(
      'SELECT id, code, plan_type, duration_days, total_uses, remaining_uses, is_active, expires_at FROM promo_codes WHERE code = $1 AND is_active = true',
      [trimmedCode],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'Promo code does not exist or has been deactivated' },
        { status: 404 },
      );
    }

    const promoCode = result.rows[0];

    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Promo code has expired' }, { status: 410 });
    }

    if (promoCode.remaining_uses <= 0) {
      return NextResponse.json({ valid: false, error: 'Promo code has no remaining uses' }, { status: 410 });
    }

    return NextResponse.json({
      valid: true,
      data: {
        code: trimmedCode,
        plan_type: promoCode.plan_type,
        duration_days: promoCode.duration_days,
        remaining_uses: promoCode.remaining_uses,
        total_uses: promoCode.total_uses,
        expires_at: promoCode.expires_at?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json({ valid: false, error: 'System error, please try again later' }, { status: 500 });
  } finally {
    await pool.end();
  }
};
