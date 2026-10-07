import { NextRequest, NextResponse } from 'next/server';
import { withApi } from '@/server/http/withApi';
import { ok } from '@/server/http/response';
import { streamQuerySchema, StreamQueryInput } from '@/schemas/stream.schema';
import { resolveStream, StreamResult } from '@/server/services/stream.service';
import { isAllowedOrigin, getSecureCorsHeaders } from '@/server/security/upstreamSecurity';
import { ForbiddenError } from '@/server/http/errors';

export const dynamic = 'force-dynamic';

export const GET = withApi<StreamResult, StreamQueryInput>(
  async ({ req, query }) => {
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');

    // Anti-hotlinking check
    if ((origin && !isAllowedOrigin(origin)) || (referer && !isAllowedOrigin(referer))) {
      throw new ForbiddenError('Unauthorized origin');
    }

    const result = await resolveStream(query);

    // If Mode 1 direct URL proxy redirect
    if (result.kind === 'redirect') {
      const accept = req.headers.get('accept') || '';
      // If fetched as HTML/video or non-strict API, redirect directly 302 to worker
      if (!accept.includes('application/json')) {
        return NextResponse.redirect(result.workerUrl, 302);
      }
      return ok(result);
    }

    // If Mode 2 code extractor
    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          ...getSecureCorsHeaders(origin),
        },
      }
    );
  },
  {
    querySchema: streamQuerySchema,
    rateLimit: {
      limit: 120,
      windowSeconds: 60,
    },
  }
);

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new Response(null, {
    headers: {
      ...getSecureCorsHeaders(origin),
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    },
  });
}
