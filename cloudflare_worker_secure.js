/**
 * Hardened Cloudflare Worker Proxy for stutosed (courses.stutosed.in)
 *
 * Features & Security:
 * 1. Closes Open Proxy Abuse: Only proxies requests to allowlisted upstream domains.
 * 2. Origin & Anti-Hotlinking Protection: Prevents external websites from stealing bandwidth.
 * 3. HLS M3U8 Playlist Rewriting: Rewrites TS segments and sub-playlists through the worker.
 * 4. Video Seeking & Range Support: Forwards 206 Partial Content and Range headers.
 * 5. Referer Spoofing: Required by Vidmoly, Streamvault, Morencius, etc.
 */

const ALLOWED_UPSTREAMS = [
  'streamvaultpro.cc',
  'fs1qydv17g1-161-162e5df28a45.herokuapp.com',
  'herokuapp.com',
  'vidmoly.net',
  'vidmoly.me',
  'vidmoly.to',
  'vmnow.online',
  'vmnow.me',
  'vmnow.to',
  'vmnow.cc',
  'vmnow.net',
  'playmoly.me',
  'playmoly.net',
  'morencius.com',
  'earnvids.com',
  'earnvids.net',
  'crwilladmin.com',
  'storage.googleapis.com',
  'edgeone.app',
  'cloudfront.net',
];

const ALLOWED_ORIGINS = [
  'course.stutosed.in',
  'courses.stutosed.in',
  'stutosed.in',
  'stutosed.vercel.app',
  'localhost',
  '127.0.0.1',
];

function isAllowedUpstream(urlStr) {
  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();
    return ALLOWED_UPSTREAMS.some((allowed) => host === allowed || host.endsWith('.' + allowed));
  } catch {
    return false;
  }
}

function isAllowedOrigin(originOrReferer) {
  if (!originOrReferer) return true; // Direct browser stream or curl
  try {
    const parsed = new URL(originOrReferer);
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_ORIGINS.some((allowed) => host === allowed || host.endsWith('.' + allowed));
  } catch {
    return false;
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const originHeader = request.headers.get('origin');
    const refererHeader = request.headers.get('referer');

    // 1. Anti-Hotlink Origin Check
    if ((originHeader && !isAllowedOrigin(originHeader)) || (refererHeader && !isAllowedOrigin(refererHeader))) {
      return new Response('Forbidden: Unauthorized Origin', { status: 403 });
    }

    // 2. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      const safeOrigin = originHeader && isAllowedOrigin(originHeader) ? originHeader : '*';
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': safeOrigin,
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // 3. Strict Upstream Allowlist Check (Prevents Open Proxy Abuse)
    if (!isAllowedUpstream(targetUrl)) {
      return new Response('Forbidden: Upstream domain is not allowed', { status: 403 });
    }

    try {
      const decodedUrl = decodeURIComponent(targetUrl);
      const upstreamHeaders = new Headers();
      upstreamHeaders.set(
        'User-Agent',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      );
      upstreamHeaders.set('Accept', '*/*');

      // Spoof Referers for CDNs
      if (decodedUrl.includes('vidmoly') || decodedUrl.includes('vmnow')) {
        upstreamHeaders.set('Referer', 'https://vidmoly.net/');
        upstreamHeaders.set('Origin', 'https://vidmoly.net');
      } else if (decodedUrl.includes('morencius') || decodedUrl.includes('earnvids')) {
        upstreamHeaders.set('Referer', 'https://morencius.com/');
        upstreamHeaders.set('Origin', 'https://morencius.com');
      } else if (decodedUrl.includes('streamvaultpro.cc')) {
        upstreamHeaders.set('Referer', 'https://www.streamvaultpro.cc/');
      } else if (decodedUrl.includes('herokuapp.com')) {
        upstreamHeaders.set('Referer', 'https://publicbotshub.blogspot.com/');
      }

      // Range header for video seeking
      const range = request.headers.get('range');
      if (range) {
        upstreamHeaders.set('Range', range);
      }

      const upstreamRes = await fetch(decodedUrl, {
        method: request.method,
        headers: upstreamHeaders,
        redirect: 'follow',
      });

      // 4. HLS M3U8 Playlist Rewriting
      if (decodedUrl.includes('.m3u8')) {
        const body = await upstreamRes.text();
        const baseUrl = new URL(decodedUrl);
        const lines = body.split('\n');

        const rewrittenLines = lines.map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line;
          if (trimmed.startsWith('#')) {
            return trimmed.replace(/URI=["']([^"']+)["']/g, (_, uri) => {
              const abs = new URL(uri, baseUrl).toString();
              return `URI="${url.origin}/hls?url=${encodeURIComponent(abs)}"`;
            });
          }
          try {
            const abs = new URL(trimmed, baseUrl).toString();
            return `${url.origin}/hls?url=${encodeURIComponent(abs)}`;
          } catch {
            return line;
          }
        });

        return new Response(rewrittenLines.join('\n'), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store',
          },
        });
      }

      // 5. Direct Streaming (MP4, MKV, PDF, TS Segments)
      const responseHeaders = new Headers(upstreamRes.headers);
      const safeOrigin = originHeader && isAllowedOrigin(originHeader) ? originHeader : '*';
      responseHeaders.set('Access-Control-Allow-Origin', safeOrigin);
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      responseHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
      responseHeaders.set('Accept-Ranges', 'bytes');

      return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response('Proxy Error: ' + err.message, { status: 502 });
    }
  },
};
