import { getPool } from '@/lib/db/pg';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import polarConfig from '@/data/polar.json';

const polarEnv = (process.env.NEXT_PUBLIC_POLAR_ENV as 'sandbox' | 'production') || 'sandbox';
const apiBase = polarConfig[polarEnv].apiBase;

export const GET = async (request: NextRequest) => {
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
      'SELECT checkout_id, status, customer_name, customer_email, product_name, amount, currency FROM polar_checkouts WHERE checkout_id = $1',
      [checkoutId],
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
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
        },
      });
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
        { success: false, error: 'Failed to fetch checkout from Polar' },
        { status: polarRes.status },
      );
    }

    const checkout = await polarRes.json();

    await pool.query(
      `INSERT INTO polar_checkouts (id, checkout_id, status, customer_name, customer_email, product_id, product_name, amount, currency, environment, raw_payload, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, NOW())
       ON CONFLICT (checkout_id) DO NOTHING`,
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
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error verifying checkout:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  } finally {
    await pool.end();
  }
};
