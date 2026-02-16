import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** GET /api/promo/validate?code=XXX - Kiểm tra mã promo hợp lệ (không trừ lượt). */
export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code || code.trim().length === 0) {
      return NextResponse.json({ valid: false, error: 'Thiếu tham số code' }, { status: 400 });
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
        { valid: false, error: 'Mã promo không tồn tại hoặc đã bị vô hiệu hóa' },
        { status: 404 },
      );
    }

    const isExpired = promoCode.expiresAt !== null && new Date(promoCode.expiresAt) < new Date();

    if (isExpired) {
      return NextResponse.json({ valid: false, error: 'Mã promo đã hết hạn sử dụng' }, { status: 410 });
    }

    if (promoCode.remainingUses <= 0) {
      return NextResponse.json({ valid: false, error: 'Mã promo đã hết lượt sử dụng' }, { status: 410 });
    }

    return NextResponse.json({
      valid: true,
      data: {
        code: trimmedCode,
        remaining_uses: promoCode.remainingUses,
        total_uses: promoCode.totalUses,
        expires_at: promoCode.expiresAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('Lỗi khi validate promo code:', error);
    return NextResponse.json({ valid: false, error: 'Lỗi hệ thống, vui lòng thử lại sau' }, { status: 500 });
  }
};
