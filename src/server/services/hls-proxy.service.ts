import 'server-only';
import { NextResponse } from 'next/server';
import { isAllowedUpstream, getSecureCorsHeaders } from '@/server/security/upstreamSecurity';
import { getWorkerProxyUrl } from '@/lib/proxyConfig';
import { ForbiddenError, ValidationError, NotFoundError } from '@/server/http/errors';
import { HlsProxyQueryInput } from '@/schemas/hls-proxy.schema';

function unpackDeanEdwards(packed: string): string | null {
  try {
    const match = packed.match(
      /eval\(function\(p,a,c,k,e,d\)[\s\S]*?return p\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)/
    );
    if (match) {
      const [, p, aStr, cStr, kStr] = match;
      let a = parseInt(aStr, 10);
      let c = parseInt(cStr, 10);
      const k = kStr.split('|');
      let unpacked = p;
      while (c--) {
        if (k[c]) {
          unpacked = unpacked.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]);
        }
      }
      return unpacked;
    }
    const match2 = packed.match(/\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)\)\)/);
    if (match2) {
      const [, p, aStr, cStr, kStr] = match2;
      let a = parseInt(aStr, 10);
      let c = parseInt(cStr, 10);
      const k = kStr.split('|');
      let unpacked = p;
      while (c--) {
        if (k[c]) {
          unpacked = unpacked.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]);
        }
      }
      return unpacked;
    }
  } catch {
    return null;
  }
  return null;
}

export async function proxyHlsRequest(
  input: HlsProxyQueryInput,
  origin: string | null,
  clientRange: string | null,
  baseProxyEndpoint: string = '/api/v1/hls-proxy'
): Promise<Response> {
  const targetUrl = input.url;
  if (!targetUrl) {
    throw new ValidationError('Missing url parameter');
  }

  // SSRF Protection
  if (!isAllowedUpstream(targetUrl)) {
    throw new ForbiddenError('Forbidden upstream domain');
  }

  const decoded = decodeURIComponent(targetUrl);
  const providerParam = input.provider || '';

  const isVidmoly =
    providerParam === 'vidmoly' ||
    decoded.includes('vidmoly') ||
    decoded.includes('vmnow.') ||
    decoded.includes('vmeas.') ||
    decoded.includes('vmstorage.') ||
    decoded.includes('vmpx.') ||
    decoded.includes('vmcld.') ||
    decoded.includes('playmoly.');
  const isEarnvids =
    providerParam === 'earnvids' ||
    decoded.includes('morencius.') ||
    decoded.includes('earnvids.');
  const isHranker =
    providerParam === 'hranker' ||
    decoded.includes('hranker.com');

  // If NOT Vidmoly, Earnvids, or Hranker, offload directly to Cloudflare Worker (0 Vercel bandwidth)
  if (!isVidmoly && !isEarnvids && !isHranker) {
    const workerUrl = getWorkerProxyUrl(targetUrl, 'hls');
    return NextResponse.redirect(workerUrl, 302);
  }

  let upstreamReferer = decoded.includes('vidmoly.me') ? 'https://vidmoly.me/' : 'https://vidmoly.net/';
  let upstreamOrigin = decoded.includes('vidmoly.me') ? 'https://vidmoly.me' : 'https://vidmoly.net';
  if (isEarnvids) {
    upstreamReferer = 'https://morencius.com/';
    upstreamOrigin = 'https://morencius.com';
  } else if (isHranker) {
    upstreamReferer = 'https://selectionway.com/';
    upstreamOrigin = 'https://selectionway.com';
  }

  const upstreamHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Referer: upstreamReferer,
    Origin: upstreamOrigin,
    Accept: '*/*',
    'Sec-Fetch-Dest': decoded.includes('.m3u8') ? 'empty' : 'video',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
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

  const isPlaylist = decoded.includes('.m3u8') || decoded.includes('.html');

  if (isPlaylist) {
    let body = await upstreamRes.text();
    let baseUrl = new URL(decoded);

    // Extract M3U8 from HTML if needed
    if (decoded.includes('.html')) {
      let m3u8Url: string | null = null;

      const directM3u8 = body.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/);
      if (directM3u8) {
        m3u8Url = directM3u8[0];
      }

      if (!m3u8Url) {
        const packedMatches = body.match(/eval\(function\(p,a,c,k,e,d\)[\s\S]*?\.split\('\|'\)\)\)/g) || [];
        for (const packed of packedMatches) {
          const unpacked = unpackDeanEdwards(packed);
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
        // Fetch actual M3U8
        const m3u8Res = await fetch(m3u8Url, { headers: upstreamHeaders });
        if (!m3u8Res.ok) {
          return new Response(`M3U8 Upstream ${m3u8Res.status}`, { status: m3u8Res.status });
        }
        body = await m3u8Res.text();
        baseUrl = new URL(m3u8Url);
      } else {
        throw new NotFoundError('M3U8 not found in HTML');
      }
    }

    const lines = body.split('\n');
    const rewrittenLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      const currentProvider = providerParam || (isVidmoly ? 'vidmoly' : isEarnvids ? 'earnvids' : isHranker ? 'hranker' : '');

      if (trimmed.startsWith('#')) {
        return trimmed.replace(/URI=["']([^"']+)["']/g, (_, uri) => {
          try {
            const absoluteUri = new URL(uri, baseUrl).toString();
            return `URI="${baseProxyEndpoint}?url=${encodeURIComponent(absoluteUri)}&provider=${currentProvider}"`;
          } catch {
            return `URI="${uri}"`;
          }
        });
      }

      try {
        const absoluteUrl = new URL(trimmed, baseUrl).toString();
        return `${baseProxyEndpoint}?url=${encodeURIComponent(absoluteUrl)}&provider=${currentProvider}`;
      } catch {
        return line;
      }
    });

    return new Response(rewrittenLines.join('\n'), {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        ...getSecureCorsHeaders(origin),
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
      },
    });
  }

  // Binary segment (.ts, thumbnails, etc.) → stream through
  const contentType = upstreamRes.headers.get('Content-Type') || 'video/MP2T';
  const contentLength = upstreamRes.headers.get('Content-Length');
  const contentRange = upstreamRes.headers.get('Content-Range');
  const acceptRanges = upstreamRes.headers.get('Accept-Ranges');

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    ...getSecureCorsHeaders(origin),
    'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    'Cache-Control': 'public, max-age=86400, immutable',
  };
  if (contentLength) headers['Content-Length'] = contentLength;
  if (contentRange) headers['Content-Range'] = contentRange;
  if (acceptRanges) headers['Accept-Ranges'] = acceptRanges;

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers,
  });
}
