import { NextRequest } from 'next/server';
import { thumbnailQuerySchema } from '@/schemas/thumbnail.schema';
import { getDynamicThumbnailSvg } from '@/server/services/thumbnail.service';
import { getSecureCorsHeaders } from '@/server/security/upstreamSecurity';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParamsObj: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((val, key) => {
    searchParamsObj[key] = val;
  });

  const parsed = thumbnailQuerySchema.safeParse(searchParamsObj);
  const input = parsed.success ? parsed.data : {
    title: 'Study Lecture',
    subtitle: '',
    theme: 'light' as const,
  };

  const svg = getDynamicThumbnailSvg(input);

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new Response(null, {
    headers: getSecureCorsHeaders(origin),
  });
}
