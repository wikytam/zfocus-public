import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RedeemRequest {
  code: string;
  browser_id?: string;
  fingerprint?: string;
}

/** POST /api/promo/redeem - Redeem mã khuyến mãi, trừ lượt và ghi nhật ký kiểm toán. */
export const POST = async (request: NextRequest) => {
  try {
    let body: RedeemRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Request body không hợp lệ' }, { status: 400 });
    }

    const { code, browser_id, fingerprint } = body;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Thiếu tham số code' }, { status: 400 });
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
        { success: false, error: 'Mã promo không tồn tại hoặc đã bị vô hiệu hóa' },
        { status: 404 },
      );
    }

    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: 'Mã promo đã hết hạn sử dụng' }, { status: 410 });
    }

    if (promoCode.remainingUses <= 0) {
      return NextResponse.json({ success: false, error: 'Mã promo đã hết lượt sử dụng' }, { status: 410 });
    }

    // Kiểm tra đã redeem từ IP hoặc browser_id này chưa
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
          error: 'Mã promo này đã được sử dụng từ IP hoặc trình duyệt này',
        },
        { status: 409 },
      );
    }

    // Trừ lượt sử dụng với điều kiện remainingUses > 0 chống race condition
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
      return NextResponse.json({ success: false, error: 'Mã promo đã hết lượt sử dụng' }, { status: 410 });
    }

    // Đọc lại giá trị remainingUses sau khi cập nhật
    const updatedPromo = await prisma.promoCode.findUnique({
      where: { id: promoCode.id },
      select: { remainingUses: true },
    });

    await prisma.promoRedemption.create({
      data: {
        promoCodeId: promoCode.id,
        ipAddress,
        userAgent,
        browserId: browser_id ?? null,
        fingerprint: fingerprint ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Redeem thành công',
      data: {
        code: trimmedCode,
        remaining_uses: updatedPromo?.remainingUses ?? promoCode.remainingUses - 1,
        redeemed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Lỗi khi redeem promo code:', error);
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống, vui lòng thử lại sau' }, { status: 500 });
  }
};
