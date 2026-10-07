import 'server-only';
import { isAllowedUpstream } from '@/server/security/upstreamSecurity';
import { getWorkerProxyUrl, resolveDirectMediaUrl } from '@/lib/proxyConfig';
import { ForbiddenError } from '@/server/http/errors';

interface CacheEntry {
  targetUrl: string;
  expiresAt: number;
}

const pdfUrlCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

function normalizePdfUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  url = resolveDirectMediaUrl(url);
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

export interface ResolvePdfResult {
  workerUrl: string;
}

export async function resolvePdfUrl(rawUrl: string): Promise<ResolvePdfResult> {
  // 1. Strict Upstream Security (SSRF protection)
  if (!isAllowedUpstream(rawUrl)) {
    throw new ForbiddenError('Forbidden upstream domain');
  }

  // 2. Normalize and resolve redirects
  const normalizedUrl = normalizePdfUrl(rawUrl);
  const finalTargetUrl = await resolveFinalRedirectUrl(normalizedUrl);

  // 3. Resolve worker proxy URL
  const workerUrl = getWorkerProxyUrl(finalTargetUrl, 'pdf');

  return { workerUrl };
}
