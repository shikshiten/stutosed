/**
 * Cloudflare Worker Smart Proxy Configuration
 * Offloads heavy media and PDF streaming bandwidth from Vercel Serverless to Cloudflare Workers,
 * preserving 0 Egress Bandwidth costs and 100% free operation on stutosed.vercel.app.
 */

export const CLOUDFLARE_WORKER_URL =
  process.env.NEXT_PUBLIC_STREAM_PROXY_URL || 'https://seiryu.stutosed.workers.dev';

export const CURRENT_HEROKU_BOT_HOST = 'fs1enchanted-flower-68930222-873172716e82.herokuapp.com';

/**
 * Resolves any bot redirect, blogspot wrapper, or legacy Heroku stream bot URL
 * directly to the live, working high-speed file endpoint.
 */
export function resolveDirectMediaUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // 1. Preserve publicbotshub.blogspot.com wrappers directly
  if (url.includes('publicbotshub.blogspot.com') || url.includes('file-stream-bot.html')) {
    return url;
  }

  // 2. Route legacy Heroku bots directly to publicbotshub frontend
  if (url.includes('herokuapp.com')) {
    const idMatch = url.match(/\/dl\/([a-zA-Z0-9_-]+)/);
    if (idMatch) {
      return `https://publicbotshub.blogspot.com/p/file-stream-bot.html?watch=${idMatch[1]}`;
    }
  }

  return url;
}

export function getWorkerProxyUrl(targetUrl: string, type: 'stream' | 'hls' | 'pdf' = 'stream'): string {
  if (!targetUrl) return '';
  const resolvedTarget = resolveDirectMediaUrl(targetUrl);
  const base = CLOUDFLARE_WORKER_URL.replace(/\/+$/, '');
  if (type === 'hls') {
    return `${base}/hls?url=${encodeURIComponent(resolvedTarget)}`;
  }
  return `${base}/?url=${encodeURIComponent(resolvedTarget)}`;
}
