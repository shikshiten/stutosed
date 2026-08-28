import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface CacheEntry {
  targetUrl: string;
  expiresAt: number;
}
const pdfUrlCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function normalizePdfUrl(rawUrl: string): string {
  let url = rawUrl.trim();

  // 1. ALBA: /0:/stream/ -> /0:/dl/
  if (url.includes('/0:/stream/')) {
    url = url.replace('/0:/stream/', '/0:/dl/');
  }

  // 2. ESTE: extract ID -> direct Heroku media link
  if (url.includes('publicbotshub.blogspot.com') || url.includes('file-stream-bot.html')) {
    const idMatch = url.match(/[?&](?:dl|watch)=([a-zA-Z0-9]+)/);
    if (idMatch) {
      url = `https://fs1qydv17g1-161-162e5df28a45.herokuapp.com/dl/${idMatch[1]}`;
    }
  }

  return url;
}

async function resolveFinalRedirectUrl(initialUrl: string): Promise<string> {
  const cached = pdfUrlCache.get(initialUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.targetUrl;
  }

  let currentUrl = initialUrl;
  let hops = 0;
  const MAX_HOPS = 5;

  while (hops < MAX_HOPS) {
    const isRedirectDomain =
      currentUrl.includes('streamvaultpro.cc') ||
      currentUrl.includes('workers.dev') ||
      currentUrl.includes('publicbotshub.blogspot.com');

    if (!isRedirectDomain) {
      break;
    }

    try {
      const probeRes = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Range: 'bytes=0-0',
        },
      });

      const location = probeRes.headers.get('location');
      if (
        (probeRes.status === 301 ||
          probeRes.status === 302 ||
          probeRes.status === 307 ||
          probeRes.status === 308) &&
        location
      ) {
        currentUrl = new URL(location, currentUrl).toString();
        hops++;
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  pdfUrlCache.set(initialUrl, {
    targetUrl: currentUrl,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return currentUrl;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const normalizedUrl = normalizePdfUrl(rawUrl);
    const finalTargetUrl = await resolveFinalRedirectUrl(normalizedUrl);

    const upstreamHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'application/pdf,*/*',
    };

    if (finalTargetUrl.includes('workers.dev') || finalTargetUrl.includes('streamvaultpro.cc')) {
      upstreamHeaders['Referer'] = 'https://www.streamvaultpro.cc/';
    } else if (finalTargetUrl.includes('herokuapp.com')) {
      upstreamHeaders['Referer'] = 'https://publicbotshub.blogspot.com/';
    }

    const upstreamRes = await fetch(finalTargetUrl, {
      method: 'GET',
      headers: upstreamHeaders,
      signal: request.signal,
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return new NextResponse(`Upstream returned HTTP ${upstreamRes.status}`, {
        status: upstreamRes.status,
      });
    }

    const responseHeaders = new Headers();

    // Preserve upstream Content-Type or default to application/pdf
    const upstreamContentType = upstreamRes.headers.get('content-type');
    const contentType = upstreamContentType && !upstreamContentType.includes('text/plain')
      ? upstreamContentType
      : (finalTargetUrl.endsWith('.png') ? 'image/png' : finalTargetUrl.endsWith('.jpg') ? 'image/jpeg' : 'application/pdf');

    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Content-Disposition', 'inline');

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    responseHeaders.set('Cache-Control', 'public, max-age=3600');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return new Response(null, { status: 499 });
    }
    return new NextResponse(err.message || 'PDF proxy error', { status: 502 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
