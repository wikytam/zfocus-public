import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitResult {
  limited: boolean;
  response?: NextResponse;
}

const getClientIp = (request: NextRequest): string =>
  request.headers.get('cf-connecting-ip') ??
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  request.headers.get('x-real-ip') ??
  'unknown';

export const checkRateLimit = async (request: NextRequest): Promise<RateLimitResult> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const { env } = getCloudflareContext();

    if (!env?.RATE_LIMITER) {
      return { limited: false };
    }

    const ip = getClientIp(request);
    const { success } = await env.RATE_LIMITER.limit({ key: ip });

    if (!success) {
      return {
        limited: true,
        response: NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429, headers: { 'Retry-After': '60' } },
        ),
      };
    }

    return { limited: false };
  } catch {
    return { limited: false };
  }
};
