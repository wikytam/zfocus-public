import { getPool } from '@/lib/db/pg';
import { checkRateLimit } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import polarConfig from '@/data/polar.json';

const polarEnv = (process.env.NEXT_PUBLIC_POLAR_ENV as 'sandbox' | 'production') || 'sandbox';
const apiBase = polarConfig[polarEnv].apiBase;
const productMapping = polarConfig.productMapping as Record<string, { planType: string; durationDays: number | null }>;
const planNamePatterns = polarConfig.planNamePatterns as Record<
  string,
  { planType: string; durationDays: number | null }
>;

const resolvePlanFromCheckout = (checkout: {
  product_id?: string;
  product?: { id?: string; name?: string };
}): { planType: string; durationDays: number | null } => {
  const productId = checkout.product_id ?? checkout.product?.id;
  if (productId && productMapping[productId]) {
    return productMapping[productId];
  }

  const productName = (checkout.product?.name ?? '').toLowerCase();
  for (const [pattern, plan] of Object.entries(planNamePatterns)) {
    if (productName.includes(pattern)) {
      return plan;
    }
  }

  return { planType: 'yearly', durationDays: 365 };
};

const generatePromoCode = (checkoutId: string): string => {
  const shortId = checkoutId.replace(/-/g, '').substring(0, 8).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ZFOCUS-${shortId}-${random}`;
};

export const GET = async (request: NextRequest) => {
  const { limited, response } = await checkRateLimit(request);
  if (limited) return response!;
  const pool = getPool();
  try {
    const { searchParams } = new URL(request.url);
    const checkoutId = searchParams.get('checkout_id');

    if (!checkoutId) {
      return NextResponse.json({ success: false, error: 'Missing checkout_id' }, { status: 400 });
    }

    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const existing = await pool.query(
      `SELECT pc.checkout_id, pc.status, pc.customer_name, pc.customer_email,
              pc.product_name, pc.amount, pc.currency, p.code as promo_code
       FROM polar_checkouts pc
       LEFT JOIN promo_codes p ON pc.promo_code_id = p.id
       WHERE pc.checkout_id = $1`,
      [checkoutId],
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];

      if (row.status === 'succeeded' && row.promo_code) {
        return NextResponse.json({
          success: true,
          data: {
            checkout_id: row.checkout_id,
            status: row.status,
            customer_name: row.customer_name,
            customer_email: row.customer_email,
            product_name: row.product_name,
            amount: row.amount,
            currency: row.currency,
            promo_code: row.promo_code,
          },
        });
      }
    }

    const polarRes = await fetch(`${apiBase}/v1/checkouts/${checkoutId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!polarRes.ok) {
      const errorText = await polarRes.text();
      console.error('Polar API error:', polarRes.status, errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to verify checkout with Polar' },
        { status: polarRes.status },
      );
    }

    const checkout = await polarRes.json();

    if (checkout.status !== 'succeeded') {
      return NextResponse.json(
        {
          success: false,
          error: `Checkout status is "${checkout.status}", not "succeeded"`,
          data: { checkout_id: checkout.id, status: checkout.status },
        },
        { status: 402 },
      );
    }

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO polar_checkouts (id, checkout_id, status, customer_name, customer_email, product_id, product_name, amount, currency, environment, raw_payload, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, NOW())
         ON CONFLICT (checkout_id) DO UPDATE SET status = $2`,
        [
          checkout.id,
          checkout.status,
          checkout.customer_name ?? null,
          checkout.customer_email ?? null,
          checkout.product_id ?? checkout.product?.id ?? null,
          checkout.product?.name ?? null,
          checkout.total_amount ?? null,
          checkout.currency ?? null,
          polarEnv,
          JSON.stringify(checkout),
        ],
      );
    } else {
      await pool.query('UPDATE polar_checkouts SET status = $1 WHERE checkout_id = $2', [checkout.status, checkout.id]);
    }

    const existingPromo = await pool.query('SELECT promo_code_id FROM polar_checkouts WHERE checkout_id = $1', [
      checkout.id,
    ]);

    let promoCode: string | null = null;

    if (existingPromo.rows[0]?.promo_code_id) {
      const codeResult = await pool.query('SELECT code FROM promo_codes WHERE id = $1', [
        existingPromo.rows[0].promo_code_id,
      ]);
      promoCode = codeResult.rows[0]?.code ?? null;
    } else {
      const { planType, durationDays } = resolvePlanFromCheckout(checkout);
      const newCode = generatePromoCode(checkout.id);

      const promoResult = await pool.query(
        `INSERT INTO promo_codes (id, code, description, plan_type, duration_days, total_uses, remaining_uses, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 1, 1, true, NOW(), NOW())
         RETURNING id`,
        [newCode, `Auto-generated for checkout ${checkout.id}`, planType, durationDays],
      );

      await pool.query('UPDATE polar_checkouts SET promo_code_id = $1 WHERE checkout_id = $2', [
        promoResult.rows[0].id,
        checkout.id,
      ]);

      promoCode = newCode;
      console.log(`[Verify] Promo code ${newCode} created for checkout ${checkout.id} (${planType})`);
    }

    return NextResponse.json({
      success: true,
      data: {
        checkout_id: checkout.id,
        status: checkout.status,
        customer_name: checkout.customer_name,
        customer_email: checkout.customer_email,
        product_name: checkout.product?.name ?? null,
        amount: checkout.total_amount,
        currency: checkout.currency,
        promo_code: promoCode,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error verifying checkout:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};
