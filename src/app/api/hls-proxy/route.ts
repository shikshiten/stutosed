/**
 * HLS Proxy – Edge Runtime
 *
 * Proxies m3u8 playlists and .ts segments through our server so that the
 * IP seen by the CDN is always Vercel's Edge IP (the same IP that
 * originally resolved the token). This eliminates the IP-lock mismatch
 * that causes mobile playback to fail.
 */
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    const decoded = decodeURIComponent(targetUrl);

    const upstreamRes = await fetch(decoded, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: 'https://vidmoly.net/',
        Origin: 'https://vidmoly.net',
      },
    });

    if (!upstreamRes.ok) {
      return new Response(`Upstream ${upstreamRes.status}`, {
        status: upstreamRes.status,
      });
    }

    const isPlaylist = decoded.includes('.m3u8');

    if (isPlaylist) {
      // ── m3u8 playlist: rewrite every absolute URL to go through proxy ──
      let body = await upstreamRes.text();

      body = body.replace(
        /https?:\/\/[^\s"',]+/g,
        (match: string) =>
          `/api/hls-proxy?url=${encodeURIComponent(match)}`,
      );

      return new Response(body, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'no-cache, no-store',
        },
      });
    }

    // ── Binary segment (.ts, thumbnails, etc.) → stream through ──
    return new Response(upstreamRes.body, {
      headers: {
        'Content-Type':
          upstreamRes.headers.get('Content-Type') || 'video/MP2T',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
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
