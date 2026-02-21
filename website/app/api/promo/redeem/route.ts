import { getDb } from '@/lib/db';
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

/** POST /api/promo/redeem - Redeem promo code, decrement uses and create audit record. */
export const POST = async (request: NextRequest) => {
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

    const prisma = getDb();

    const promoCode = await prisma.promoCode.findFirst({
      where: {
        code: trimmedCode,
        isActive: true,
      },
    });

    if (!promoCode) {
      return NextResponse.json(
        { success: false, error: 'Promo code does not exist or has been deactivated' },
        { status: 404 },
      );
    }

    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: 'Promo code has expired' }, { status: 410 });
    }

    if (promoCode.remainingUses <= 0) {
      return NextResponse.json({ success: false, error: 'Promo code has no remaining uses' }, { status: 410 });
    }

    const existingRedemption = await prisma.promoRedemption.findFirst({
      where: {
        promoCodeId: promoCode.id,
        OR: [{ ipAddress }, ...(browser_id ? [{ browserId: browser_id }] : [])],
      },
    });

    if (existingRedemption) {
      return NextResponse.json(
        {
          success: false,
          error: 'This promo code has already been used from this IP or browser',
        },
        { status: 409 },
      );
    }

    const updateResult = await prisma.promoCode.updateMany({
      where: {
        id: promoCode.id,
        remainingUses: { gt: 0 },
      },
      data: {
        remainingUses: { decrement: 1 },
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ success: false, error: 'Promo code has no remaining uses' }, { status: 410 });
    }

    const updatedPromo = await prisma.promoCode.findUnique({
      where: { id: promoCode.id },
      select: { remainingUses: true },
    });

    const premiumExpiresAt = calculatePremiumExpiration(promoCode.planType, promoCode.durationDays);

    await prisma.promoRedemption.create({
      data: {
        promoCodeId: promoCode.id,
        planType: promoCode.planType,
        premiumExpiresAt,
        ipAddress,
        userAgent,
        browserId: browser_id ?? null,
        fingerprint: fingerprint ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Redeem successful',
      data: {
        code: trimmedCode,
        plan_type: promoCode.planType,
        premium_expires_at: premiumExpiresAt?.toISOString() ?? null,
        remaining_uses: updatedPromo?.remainingUses ?? promoCode.remainingUses - 1,
        redeemed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error redeeming promo code:', error);
    return NextResponse.json({ success: false, error: 'System error, please try again later' }, { status: 500 });
  }
};
