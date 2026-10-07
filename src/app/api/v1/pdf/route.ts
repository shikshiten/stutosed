import { NextRequest, NextResponse } from 'next/server';
import { withApi } from '@/server/http/withApi';
import { ok } from '@/server/http/response';
import { pdfQuerySchema, PdfQueryInput } from '@/schemas/pdf.schema';
import { resolvePdfUrl } from '@/server/services/pdf.service';
import { isAllowedOrigin, getSecureCorsHeaders } from '@/server/security/upstreamSecurity';
import { ForbiddenError } from '@/server/http/errors';

export const dynamic = 'force-dynamic';

export const GET = withApi<{ workerUrl: string }, PdfQueryInput>(
  async ({ req, query }) => {
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');

    // Anti-hotlinking check
    if ((origin && !isAllowedOrigin(origin)) || (referer && !isAllowedOrigin(referer))) {
      throw new ForbiddenError('Unauthorized origin');
    }

    const { workerUrl } = await resolvePdfUrl(query.url);
    const corsHeaders = getSecureCorsHeaders(origin);

    const accept = req.headers.get('accept') || '';
    // If standard browser navigation / direct link, redirect directly to worker
    if (accept.includes('text/html') || !accept.includes('application/json')) {
      return NextResponse.redirect(workerUrl, {
        status: 302,
        headers: corsHeaders,
      });
    }

    // If API client, return standard REST JSON { data: { workerUrl } }
    return ok({ workerUrl }, 200, corsHeaders);
  },
  {
    querySchema: pdfQuerySchema,
    rateLimit: {
      limit: 60,
      windowSeconds: 60,
    },
  }
);

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new Response(null, {
    headers: getSecureCorsHeaders(origin),
  });
}
