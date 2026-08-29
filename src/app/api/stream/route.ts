import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://hofbtbutvuomeofmhkyu.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZmJ0YnV0dnVvbWVvZm1oa3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDQwNzEsImV4cCI6MjEwMjcyMDA3MX0.J5RU82Jn5VOZy_vyiSv9mX5QgKW6Ud23fVKMytXp7DA';

import { isAllowedUpstream } from '@/lib/upstreamSecurity';

async function getAuthenticatedUser(request: NextRequest) {
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {},
    },
  });
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

// 2-hour TTL cache for resolved 302 redirect target URLs
interface CacheEntry {
  targetUrl: string;
  expiresAt: number;
}
const urlCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

function unpackDeanEdwards(packed: string): string | null {
  try {
    const match = packed.match(/eval\(function\(p,a,c,k,e,d\)[\s\S]*?return p\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)/);
    if (match) {
      let [_, p, aStr, cStr, kStr] = match;
      let a = parseInt(aStr, 10);
      let c = parseInt(cStr, 10);
      let k = kStr.split('|');
      while (c--) {
        if (k[c]) {
          p = p.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]);
        }
      }
      return p;
    }
    const match2 = packed.match(/\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)\)\)/);
    if (match2) {
      let [_, p, aStr, cStr, kStr] = match2;
      let a = parseInt(aStr, 10);
      let c = parseInt(cStr, 10);
      let k = kStr.split('|');
      while (c--) {
        if (k[c]) {
          p = p.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]);
        }
      }
      return p;
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeMediaUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (url.includes('/0:/stream/')) {
    url = url.replace('/0:/stream/', '/0:/dl/');
  }
  if (url.includes('publicbotshub.blogspot.com') || url.includes('file-stream-bot.html')) {
    const idMatch = url.match(/[?&](?:dl|watch)=([a-zA-Z0-9]+)/);
    if (idMatch) {
      url = `https://fs1qydv17g1-161-162e5df28a45.herokuapp.com/dl/${idMatch[1]}`;
    }
  }
  return url;
}

async function resolveFinalRedirectUrl(initialUrl: string): Promise<string> {
  const cached = urlCache.get(initialUrl);
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

    if (!isRedirectDomain) break;

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

  urlCache.set(initialUrl, {
    targetUrl: currentUrl,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return currentUrl;
}

export async function GET(request: NextRequest) {
  // ── Auth check ───────────────────────────────────────────────────────────────
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUrlParam = searchParams.get('url');

  // ── MODE 1: Direct URL Proxy Streamer ───────────────────────────────────────
  if (targetUrlParam) {
    // SSRF Protection
    if (!isAllowedUpstream(targetUrlParam)) {
      return NextResponse.json({ error: 'Forbidden upstream domain' }, { status: 403 });
    }

    try {
      const normalizedUrl = normalizeMediaUrl(targetUrlParam);
      const finalTargetUrl = await resolveFinalRedirectUrl(normalizedUrl);

      const clientRange = request.headers.get('range');
      const upstreamHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: '*/*',
      };

      if (clientRange) {
        upstreamHeaders['Range'] = clientRange;
      }

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
      const passThroughHeaders = ['content-type', 'content-range', 'content-length', 'accept-ranges'];
      passThroughHeaders.forEach((h) => {
        const val = upstreamRes.headers.get(h);
        if (val) responseHeaders.set(h, val);
      });

      responseHeaders.set('Content-Disposition', 'inline');
      if (!responseHeaders.has('accept-ranges')) {
        responseHeaders.set('Accept-Ranges', 'bytes');
      }
      if (!responseHeaders.has('content-type')) {
        responseHeaders.set('Content-Type', 'video/mp4');
      }
      responseHeaders.set('Cache-Control', 'public, max-age=3600');
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Headers', 'Range, Accept, Content-Type');
      responseHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

      return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: responseHeaders,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return new Response(null, { status: 499 });
      }
      return new NextResponse('Streaming proxy error', { status: 502 });
    }
  }

  // ── MODE 2: Vidmoly / Earnvids Code Extractor ───────────────────────────────
  const code = searchParams.get('code');
  const provider = searchParams.get('provider') || 'vidmoly';

  if (!code) {
    return NextResponse.json({ error: 'Missing url or code parameter' }, { status: 400 });
  }

  try {
    let embedUrl = '';
    let referer = '';

    if (provider === 'earnvids') {
      embedUrl = `https://morencius.com/v/${code}`;
      referer = 'https://morencius.com/';
    } else {
      embedUrl = `https://vidmoly.net/embed-${code}.html`;
      referer = 'https://vidmoly.net/';
    }

    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: referer,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Provider returned HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();

    const directM3u8 = html.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/);
    if (directM3u8) {
      return NextResponse.json({
        streamUrl: `/api/hls-proxy?url=${encodeURIComponent(directM3u8[0])}`,
        type: 'hls',
        provider,
        code,
      });
    }

    const packedMatches =
      html.match(/eval\(function\(p,a,c,k,e,d\)[\s\S]*?\.split\('\|'\)\)\)/g) || [];
    for (const packed of packedMatches) {
      const unpacked = unpackDeanEdwards(packed);
      if (unpacked) {
        const unpackedM3u8 = unpacked.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/);
        if (unpackedM3u8) {
          return NextResponse.json({
            streamUrl: `/api/hls-proxy?url=${encodeURIComponent(unpackedM3u8[0])}`,
            type: 'hls',
            provider,
            code,
          });
        }
      }
    }

    const fileMatch = html.match(/["'](?:file|src)["']\s*:\s*["']([^"']+\.m3u8[^"']*)["']/);
    if (fileMatch) {
      return NextResponse.json({
        streamUrl: `/api/hls-proxy?url=${encodeURIComponent(fileMatch[1])}`,
        type: 'hls',
        provider,
        code,
      });
    }

    return NextResponse.json(
      { error: 'Stream URL could not be resolved from provider.' },
      { status: 404 }
    );
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Accept, Content-Type',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    },
  });
}
