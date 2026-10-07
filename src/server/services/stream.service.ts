import 'server-only';
import { isAllowedUpstream } from '@/server/security/upstreamSecurity';
import { getWorkerProxyUrl } from '@/lib/proxyConfig';
import { ForbiddenError, ValidationError } from '@/server/http/errors';
import { StreamQueryInput } from '@/schemas/stream.schema';

// 2-hour TTL cache for resolved 302 redirect target URLs
interface CacheEntry {
  targetUrl: string;
  expiresAt: number;
}
const urlCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

// In-memory cache for resolved Vidmoly & Earnvids M3U8 streams
interface StreamCacheEntry {
  streamUrl: string;
  type: string;
  provider: string;
  code: string;
  expiresAt: number;
}
const streamCache = new Map<string, StreamCacheEntry>();
const STREAM_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

export function normalizeMediaUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (url.includes('/0:/stream/')) {
    url = url.replace('/0:/stream/', '/0:/dl/');
  }
  if (url.includes('publicbotshub.blogspot.com') || url.includes('file-stream-bot.html')) {
    const idMatch = url.match(/[?&](?:dl|watch)=([a-zA-Z0-9]+)/);
    if (idMatch) {
      url = `https://fs1enchanted-flower-68930222-873172716e82.herokuapp.com/dl/${idMatch[1]}`;
    }
  }
  if (url.includes('fs1qydv17g1-161-162e5df28a45.herokuapp.com')) {
    url = url.replace('fs1qydv17g1-161-162e5df28a45.herokuapp.com', 'fs1enchanted-flower-68930222-873172716e82.herokuapp.com');
  }
  if (url.includes('hell-fs1-oot-c9eb9b92ba45.herokuapp.com')) {
    url = url.replace('hell-fs1-oot-c9eb9b92ba45.herokuapp.com', 'fs1enchanted-flower-68930222-873172716e82.herokuapp.com');
  }
  return url;
}

export async function resolveFinalRedirectUrl(initialUrl: string): Promise<string> {
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

export type StreamResult =
  | {
      kind: 'redirect';
      workerUrl: string;
    }
  | {
      kind: 'stream';
      streamUrl: string;
      type: string;
      provider: string;
      code: string;
      cached?: boolean;
    };

export async function resolveStream(input: StreamQueryInput): Promise<StreamResult> {
  // MODE 1: Direct URL Proxy Streamer
  if (input.url) {
    if (!isAllowedUpstream(input.url)) {
      throw new ForbiddenError('Forbidden upstream domain');
    }

    const normalizedUrl = normalizeMediaUrl(input.url);
    const finalTargetUrl = await resolveFinalRedirectUrl(normalizedUrl);
    const workerUrl = getWorkerProxyUrl(finalTargetUrl, 'stream');

    return {
      kind: 'redirect',
      workerUrl,
    };
  }

  // MODE 2: Vidmoly / Earnvids Code Extractor
  const code = input.code;
  const provider = input.provider || 'vidmoly';

  if (!code) {
    throw new ValidationError('Missing url or code parameter');
  }

  const cacheKey = `${provider}:${code}`;
  const cachedStream = streamCache.get(cacheKey);
  if (cachedStream && cachedStream.expiresAt > Date.now()) {
    return {
      kind: 'stream',
      streamUrl: cachedStream.streamUrl,
      type: cachedStream.type,
      provider: cachedStream.provider,
      code: cachedStream.code,
      cached: true,
    };
  }

  let embedUrl = '';
  if (provider === 'earnvids') {
    embedUrl = `https://morencius.com/v/${code}`;
  } else {
    embedUrl = `https://vidmoly.net/embed-${code}.html`;
  }

  const resolvedStreamUrl = `/api/hls-proxy?url=${encodeURIComponent(embedUrl)}&provider=${provider}`;

  const entry: StreamCacheEntry = {
    streamUrl: resolvedStreamUrl,
    type: 'hls',
    provider,
    code,
    expiresAt: Date.now() + STREAM_CACHE_TTL_MS,
  };
  streamCache.set(cacheKey, entry);

  return {
    kind: 'stream',
    streamUrl: resolvedStreamUrl,
    type: 'hls',
    provider,
    code,
  };
}
