import { getPool } from '@/lib/db/pg';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RedeemRequest {
  code: string;
  browser_id?: string;
  fingerprint?: string;
}

const DEFAULT_YEARLY_DAYS = 365;

const calculatePremiumExpiration = (planType: string, durationDays: number | null): Date | null => {
  if (planType === 'lifetime') return null;
  const days = durationDays ?? DEFAULT_YEARLY_DAYS;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
};

export const POST = async (request: NextRequest) => {
  const pool = getPool();
  try {
    let body: RedeemRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const { code, browser_id, fingerprint } = body;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Missing code parameter' }, { status: 400 });
    }

    const trimmedCode = code.trim().toUpperCase();

    const ipAddress =
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    const promoResult = await pool.query(
      'SELECT id, code, plan_type, duration_days, remaining_uses, expires_at FROM promo_codes WHERE code = $1 AND is_active = true',
      [trimmedCode],
    );

    if (promoResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Promo code does not exist or has been deactivated' },
        { status: 404 },
      );
    }

    const promoCode = promoResult.rows[0];

    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'Promo code has expired' }, { status: 410 });
    }

    if (promoCode.remaining_uses <= 0) {
      return NextResponse.json({ success: false, error: 'Promo code has no remaining uses' }, { status: 410 });
    }

    const dupQuery = browser_id
      ? 'SELECT id FROM promo_redemptions WHERE promo_code_id = $1 AND (ip_address = $2 OR browser_id = $3)'
      : 'SELECT id FROM promo_redemptions WHERE promo_code_id = $1 AND ip_address = $2';
    const dupParams = browser_id ? [promoCode.id, ipAddress, browser_id] : [promoCode.id, ipAddress];

    const existingRedemption = await pool.query(dupQuery, dupParams);

    if (existingRedemption.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'This promo code has already been used from this IP or browser' },
        { status: 409 },
      );
    }

    const updateResult = await pool.query(
      'UPDATE promo_codes SET remaining_uses = remaining_uses - 1 WHERE id = $1 AND remaining_uses > 0 RETURNING remaining_uses',
      [promoCode.id],
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Promo code has no remaining uses' }, { status: 410 });
    }

    const newRemainingUses = updateResult.rows[0].remaining_uses;
    const premiumExpiresAt = calculatePremiumExpiration(promoCode.plan_type, promoCode.duration_days);

    await pool.query(
      `INSERT INTO promo_redemptions (id, promo_code_id, plan_type, premium_expires_at, ip_address, user_agent, browser_id, fingerprint, redeemed_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        promoCode.id,
        promoCode.plan_type,
        premiumExpiresAt,
        ipAddress,
        userAgent,
        browser_id ?? null,
        fingerprint ?? null,
      ],
    );

    return NextResponse.json({
      success: true,
      message: 'Redeem successful',
      data: {
        code: trimmedCode,
        plan_type: promoCode.plan_type,
        premium_expires_at: premiumExpiresAt?.toISOString() ?? null,
        remaining_uses: newRemainingUses,
        redeemed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error redeeming promo code:', error);
    return NextResponse.json({ success: false, error: 'System error, please try again later' }, { status: 500 });
  } finally {
    await pool.end();
  }
};
