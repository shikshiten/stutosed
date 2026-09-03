/**
 * HLS Proxy – Edge Runtime
 *
 * Proxies m3u8 playlists and .ts segments through our server so that the
 * IP seen by the CDN is always Vercel's Edge IP (the same IP that
 * originally resolved the token). This eliminates the IP-lock mismatch
 * that causes mobile playback to fail.
 */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { isAllowedUpstream } from '@/lib/upstreamSecurity';
import { getWorkerProxyUrl } from '@/lib/proxyConfig';

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // ── SSRF Protection ────────────────────────────────────────────────────────────
  if (!isAllowedUpstream(targetUrl)) {
    return new Response('Forbidden upstream domain', { status: 403 });
  }

  try {
    const decoded = decodeURIComponent(targetUrl);
    const providerParam = request.nextUrl.searchParams.get('provider') || '';

    const isVidmoly =
      providerParam === 'vidmoly' ||
      decoded.includes('vidmoly') ||
      decoded.includes('vmnow.online');
    const isEarnvids =
      providerParam === 'earnvids' ||
      decoded.includes('morencius.') ||
      decoded.includes('earnvids.');

    // If NOT Vidmoly or Earnvids, offload directly to Cloudflare Worker (0 Vercel bandwidth!)
    if (!isVidmoly && !isEarnvids) {
      const workerUrl = getWorkerProxyUrl(targetUrl, 'hls');
      return NextResponse.redirect(workerUrl, 302);
    }

    let referer = 'https://vidmoly.net/';
    let origin = 'https://vidmoly.net';
    if (isEarnvids) {
      referer = 'https://morencius.com/';
      origin = 'https://morencius.com';
    }

    const clientRange = request.headers.get('range');
    const upstreamHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: referer,
      Origin: origin,
      Accept: '*/*',
    };
    if (clientRange) {
      upstreamHeaders['Range'] = clientRange;
    }

    const upstreamRes = await fetch(decoded, {
      headers: upstreamHeaders,
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return new Response(`Upstream ${upstreamRes.status}`, {
        status: upstreamRes.status,
      });
    }

    const isPlaylist = decoded.includes('.m3u8');

    if (isPlaylist) {
      const body = await upstreamRes.text();
      const baseUrl = new URL(decoded);

      const lines = body.split('\n');
      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        if (trimmed.startsWith('#')) {
          return trimmed.replace(/URI=["']([^"']+)["']/g, (_, uri) => {
            try {
              const absoluteUri = new URL(uri, baseUrl).toString();
              return `URI="/api/hls-proxy?url=${encodeURIComponent(absoluteUri)}&provider=${providerParam || (isVidmoly ? 'vidmoly' : 'earnvids')}"`;
            } catch {
              return `URI="${uri}"`;
            }
          });
        }

        try {
          const absoluteUrl = new URL(trimmed, baseUrl).toString();
          return `/api/hls-proxy?url=${encodeURIComponent(absoluteUrl)}&provider=${providerParam || (isVidmoly ? 'vidmoly' : 'earnvids')}`;
        } catch {
          return line;
        }
      });

      return new Response(rewrittenLines.join('\n'), {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'no-cache, no-store',
        },
      });
    }

    // ── Binary segment (.ts, thumbnails, etc.) → stream through ──
    const contentType = upstreamRes.headers.get('Content-Type') || 'video/MP2T';
    const contentLength = upstreamRes.headers.get('Content-Length');
    const acceptRanges = upstreamRes.headers.get('Accept-Ranges');

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=86400, immutable',
    };
    if (contentLength) headers['Content-Length'] = contentLength;
    if (acceptRanges) headers['Accept-Ranges'] = acceptRanges;

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    return new Response(message, { status: 502 });
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
