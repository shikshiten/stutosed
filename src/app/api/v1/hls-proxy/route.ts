import { NextRequest } from 'next/server';
import { hlsProxyQuerySchema } from '@/schemas/hls-proxy.schema';
import { proxyHlsRequest } from '@/server/services/hls-proxy.service';
import { isAllowedOrigin, getSecureCorsHeaders } from '@/server/security/upstreamSecurity';
import { AppError } from '@/server/http/errors';
import { fail } from '@/server/http/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Anti-hotlinking check
  if ((origin && !isAllowedOrigin(origin)) || (referer && !isAllowedOrigin(referer))) {
    return fail('Unauthorized origin', 403, 'FORBIDDEN');
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
    return await proxyHlsRequest(parsed.data, origin, clientRange, '/api/v1/hls-proxy');
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
