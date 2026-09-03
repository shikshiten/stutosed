import { NextRequest } from 'next/server';
import { generateDynamicSvgThumbnail } from '@/lib/dynamicThumbnail';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') || 'Study Lecture';
  const category = searchParams.get('category') || searchParams.get('subject') || '';
  const subtitle = searchParams.get('subtitle') || '';
  const theme = searchParams.get('theme') === 'dark' ? 'dark' : 'light';

  const svg = generateDynamicSvgThumbnail({
    title,
    category,
    subtitle,
    theme,
  });

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
