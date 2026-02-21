import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** GET /api/promo/validate?code=XXX - Kiểm tra mã promo hợp lệ (không trừ lượt). */
export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code || code.trim().length === 0) {
      return NextResponse.json({ valid: false, error: 'Missing code parameter' }, { status: 400 });
    }

    const trimmedCode = code.trim().toUpperCase();
    const prisma = getDb();

    const promoCode = await prisma.promoCode.findFirst({
      where: {
        code: trimmedCode,
        isActive: true,
      },
    });

    if (!promoCode) {
      return NextResponse.json(
        { valid: false, error: 'Promo code does not exist or has been deactivated' },
        { status: 404 },
      );
    }

    const isExpired = promoCode.expiresAt !== null && new Date(promoCode.expiresAt) < new Date();

    if (isExpired) {
      return NextResponse.json({ valid: false, error: 'Promo code has expired' }, { status: 410 });
    }

    if (promoCode.remainingUses <= 0) {
      return NextResponse.json({ valid: false, error: 'Promo code has no remaining uses' }, { status: 410 });
    }

    return NextResponse.json({
      valid: true,
      data: {
        code: trimmedCode,
        plan_type: promoCode.planType,
        duration_days: promoCode.durationDays,
        remaining_uses: promoCode.remainingUses,
        total_uses: promoCode.totalUses,
        expires_at: promoCode.expiresAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json({ valid: false, error: 'System error, please try again later' }, { status: 500 });
  }
};
