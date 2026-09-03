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
import { getWorkerProxyUrl } from '@/lib/proxyConfig';

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

interface CacheEntry {
  targetUrl: string;
  expiresAt: number;
}
const pdfUrlCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

function normalizePdfUrl(rawUrl: string): string {
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

  // ── SSRF Protection ────────────────────────────────────────────────────────────
  // Allow crwilladmin.com (direct PDF links) without hostname check
  const isCrwill = rawUrl.includes('crwilladmin.com') || rawUrl.endsWith('.pdf');
  if (!isCrwill && !isAllowedUpstream(rawUrl)) {
    return NextResponse.json({ error: 'Forbidden upstream domain' }, { status: 403 });
  }

  try {
    const normalizedUrl = normalizePdfUrl(rawUrl);
    const finalTargetUrl = await resolveFinalRedirectUrl(normalizedUrl);

    // 302 Redirect to Cloudflare Worker to avoid Vercel 10GB origin transfer bandwidth!
    const workerUrl = getWorkerProxyUrl(finalTargetUrl, 'pdf');
    return NextResponse.redirect(workerUrl, 302);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return new Response(null, { status: 499 });
    }
    return new NextResponse('PDF proxy error', { status: 502 });
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
