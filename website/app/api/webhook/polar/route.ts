import { getPool } from '@/lib/db/pg';
import { checkRateLimit } from '@/lib/rate-limit';
import polarConfig from '@/data/polar.json';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Webhook } from 'standardwebhooks';

interface CheckoutPayload {
  id: string;
  status: string;
  customer_name?: string;
  customer_email?: string;
  product_id?: string;
  product?: { id?: string; name?: string };
  total_amount?: number;
  currency?: string;
}

interface WebhookEvent {
  type: string;
  data: CheckoutPayload;
}

const productMapping = polarConfig.productMapping as Record<string, { planType: string; durationDays: number | null }>;
const planNamePatterns = polarConfig.planNamePatterns as Record<
  string,
  { planType: string; durationDays: number | null }
>;

const resolvePlanFromCheckout = (checkout: CheckoutPayload): { planType: string; durationDays: number | null } => {
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

const polarEnv = (process.env.NEXT_PUBLIC_POLAR_ENV as 'sandbox' | 'production') || 'sandbox';

export const POST = async (request: NextRequest) => {
  const { limited, response } = await checkRateLimit(request);
  if (limited) return response!;

  const pool = getPool();

  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Webhook] POLAR_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    let event: WebhookEvent;
    try {
      const wh = new Webhook(webhookSecret);
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });
      const verified = wh.verify(rawBody, headers) as WebhookEvent;
      event = verified;
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (event.type !== 'checkout.updated') {
      return NextResponse.json({ received: true, skipped: event.type });
    }

    const checkout = event.data;

    if (checkout.status !== 'succeeded') {
      return NextResponse.json({ received: true, skipped: `status=${checkout.status}` });
    }

    const existingCheckout = await pool.query('SELECT id, promo_code_id FROM polar_checkouts WHERE checkout_id = $1', [
      checkout.id,
    ]);

    if (existingCheckout.rows.length > 0 && existingCheckout.rows[0].promo_code_id) {
      return NextResponse.json({ received: true, already_processed: true });
    }

    const { planType, durationDays } = resolvePlanFromCheckout(checkout);
    const promoCode = generatePromoCode(checkout.id);

    const promoResult = await pool.query(
      `INSERT INTO promo_codes (id, code, description, plan_type, duration_days, total_uses, remaining_uses, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 1, 1, true, NOW(), NOW())
       RETURNING id`,
      [promoCode, `Auto-generated for checkout ${checkout.id}`, planType, durationDays],
    );

    const promoCodeId = promoResult.rows[0].id;

    if (existingCheckout.rows.length > 0) {
      await pool.query('UPDATE polar_checkouts SET promo_code_id = $1 WHERE checkout_id = $2', [
        promoCodeId,
        checkout.id,
      ]);
    } else {
      await pool.query(
        `INSERT INTO polar_checkouts (id, checkout_id, status, customer_name, customer_email, product_id, product_name, amount, currency, environment, raw_payload, promo_code_id, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, NOW())
         ON CONFLICT (checkout_id) DO UPDATE SET promo_code_id = $11, status = $2`,
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
          promoCodeId,
        ],
      );
    }

    console.log(`[Webhook] Promo code ${promoCode} created for checkout ${checkout.id} (${planType})`);

    return NextResponse.json({
      received: true,
      promo_code: promoCode,
      plan_type: planType,
    });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};
