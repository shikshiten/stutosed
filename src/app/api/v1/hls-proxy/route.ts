import { NextRequest } from 'next/server';
import { hlsProxyQuerySchema } from '@/schemas/hls-proxy.schema';
import { proxyHlsRequest } from '@/server/services/hls-proxy.service';
import { isAllowedOrigin, getSecureCorsHeaders } from '@/server/security/upstreamSecurity';
import { AppError } from '@/server/http/errors';
import { fail } from '@/server/http/response';
import { checkRateLimit, getClientIp } from '@/server/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const secFetchSite = request.headers.get('sec-fetch-site');

  // Anti-hotlinking check:
  // - If Origin or Referer present, must be allowed
  // - If sec-fetch-site is explicitly 'cross-site' and origin not allowed, block
  // - If Sec-Fetch-Site is missing (legacy Android WebView / Telegram in-app browser), do NOT block
  const originValid = !origin || isAllowedOrigin(origin, secFetchSite);
  const refererValid = !referer || isAllowedOrigin(referer, secFetchSite);
  const isExplicitCrossSite = secFetchSite === 'cross-site' && (!origin || !isAllowedOrigin(origin));

  if (!originValid || !refererValid || isExplicitCrossSite) {
    return fail('Unauthorized origin', 403, 'FORBIDDEN');
  }

  // Rate Limiting: 600 req/60s suitable for high-frequency video .ts segments & M3U8 refreshes
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`hls-proxy:${clientIp}`, 600, 60);
  if (!rateLimitResult.allowed) {
    return fail('Rate limit exceeded. Video streaming buffer throttled.', 429, 'RATE_LIMIT_EXCEEDED');
  }

  const searchParamsObj: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((val, key) => {
    searchParamsObj[key] = val;
  });

  const parsed = hlsProxyQuerySchema.safeParse(searchParamsObj);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const msg = firstIssue ? `${firstIssue.path.join('.') || 'query'}: ${firstIssue.message}` : 'Invalid query parameters';
    return fail(msg, 422, 'VALIDATION_ERROR');
  }

  const clientRange = request.headers.get('range');

  try {
    const response = await proxyHlsRequest(parsed.data, origin, clientRange, '/api/v1/hls-proxy');
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
    return response;
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return fail(err.message, err.statusCode, err.code);
    }
    const message = err instanceof Error ? err.message : 'Proxy error';
    return fail(message, 502, 'BAD_GATEWAY');
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new Response(null, {
    headers: getSecureCorsHeaders(origin),
  });
}
