/**
 * Hardened Cloudflare Worker Proxy for stutosed (stutosed.vercel.app)
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
  'fs1enchanted-flower-68930222-873172716e82.herokuapp.com',
  'herokuapp.com',
  'vidmoly.net',
  'vidmoly.me',
  'vidmoly.to',
  'vidmoly.biz',
  'vidmoly.pro',
  'vidmoly.com',
  'vmeas.cloud',
  'vmeas.net',
  'vmeas.online',
  'vmstorage.net',
  'vmstorage.cloud',
  'vmpx.online',
  'vmpx.net',
  'vmpx.cloud',
  'vmcld.space',
  'vmcld.net',
  'vmcld.cloud',
  'vmnow.online',
  'vmnow.me',
  'vmnow.to',
  'vmnow.cc',
  'vmnow.net',
  'playmoly.me',
  'playmoly.net',
  'morencius.com',
  'morencius.net',
  'earnvids.com',
  'earnvids.net',
  'earnvids.xyz',
  'crwilladmin.com',
  'selectionway.com',
  'storage.googleapis.com',
  'edgeone.app',
  'cloudfront.net',
  'hranker.com',
  'amazonaws.com',
  'catbox.moe',
];

const ALLOWED_ORIGINS = [
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
      if (decodedUrl.includes('vidmoly') || decodedUrl.includes('vmnow') || decodedUrl.includes('vmeas') || decodedUrl.includes('vmstorage') || decodedUrl.includes('vmpx') || decodedUrl.includes('vmcld') || decodedUrl.includes('playmoly')) {
        const vidRef = decodedUrl.includes('vidmoly.me') ? 'https://vidmoly.me/' : 'https://vidmoly.net/';
        const vidOrig = decodedUrl.includes('vidmoly.me') ? 'https://vidmoly.me' : 'https://vidmoly.net';
        upstreamHeaders.set('Referer', vidRef);
        upstreamHeaders.set('Origin', vidOrig);
        upstreamHeaders.set('Sec-Fetch-Dest', decodedUrl.includes('.m3u8') ? 'empty' : 'video');
        upstreamHeaders.set('Sec-Fetch-Mode', 'cors');
        upstreamHeaders.set('Sec-Fetch-Site', 'cross-site');
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

      // HLS M3U8 Playlist or HTML Embed Rewriting
      if (decodedUrl.includes('.m3u8') || decodedUrl.includes('.html')) {
        let body = await upstreamRes.text();
        let baseUrl = new URL(decodedUrl);
        let isHtml = false;

        // Extract M3U8 from HTML if needed
        if (decodedUrl.includes('.html')) {
          isHtml = true;
          let m3u8Url = null;
          
          const directM3u8 = body.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/);
          if (directM3u8) m3u8Url = directM3u8[0];

          if (!m3u8Url) {
            const packedMatches = body.match(/eval\(function\(p,a,c,k,e,d\)[\s\S]*?\.split\('\|'\)\)\)/g) || [];
            for (const packed of packedMatches) {
              let unpacked = null;
              try {
                const match = packed.match(/eval\(function\(p,a,c,k,e,d\)[\s\S]*?return p\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)/);
                if (match) {
                  let [_, p, aStr, cStr, kStr] = match;
                  let a = parseInt(aStr, 10);
                  let c = parseInt(cStr, 10);
                  let k = kStr.split('|');
                  while (c--) { if (k[c]) p = p.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]); }
                  unpacked = p;
                }
              } catch (e) {}
              if (unpacked) {
                const unpackedM3u8 = unpacked.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/);
                if (unpackedM3u8) {
                  m3u8Url = unpackedM3u8[0];
                  break;
                }
              }
            }
          }

          if (!m3u8Url) {
            const fileMatch = body.match(/["'](?:file|src)["']\s*:\s*["']([^"']+\.m3u8[^"']*)["']/);
            if (fileMatch) m3u8Url = fileMatch[1];
          }

          if (m3u8Url) {
            const m3u8Res = await fetch(m3u8Url, { headers: upstreamHeaders });
            if (!m3u8Res.ok) return new Response(`M3U8 Upstream ${m3u8Res.status}`, { status: m3u8Res.status });
            body = await m3u8Res.text();
            baseUrl = new URL(m3u8Url);
          } else {
            return new Response('M3U8 not found in HTML', { status: 404 });
          }
        }

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
