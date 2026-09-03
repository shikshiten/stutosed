/**
 * Cloudflare Worker Smart Proxy Configuration
 * Offloads heavy media and PDF streaming bandwidth from Vercel Serverless to Cloudflare Workers,
 * preserving 0 Egress Bandwidth costs and 100% free operation on stutosed.vercel.app.
 */

export const CLOUDFLARE_WORKER_URL =
  process.env.NEXT_PUBLIC_STREAM_PROXY_URL || 'https://seiryu.stutosed.workers.dev';

export const CURRENT_HEROKU_BOT_HOST = 'fs1qydv17g1-161-162e5df28a45.herokuapp.com';

/**
 * Resolves any bot redirect, blogspot wrapper, or legacy Heroku stream bot URL
 * directly to the live, working high-speed file endpoint.
 */
export function resolveDirectMediaUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // 1. Convert publicbotshub.blogspot.com / file-stream-bot wrappers directly to live Heroku file stream
  if (url.includes('publicbotshub.blogspot.com') || url.includes('file-stream-bot.html')) {
    const dlMatch = url.match(/[?&]dl=([a-zA-Z0-9_-]+)/);
    if (dlMatch) {
      return `https://${CURRENT_HEROKU_BOT_HOST}/dl/${dlMatch[1]}`;
    }
    const watchMatch = url.match(/[?&]watch=([a-zA-Z0-9_-]+)/);
    if (watchMatch) {
      return `https://${CURRENT_HEROKU_BOT_HOST}/dl/${watchMatch[1]}`;
    }
  }

  // 2. Fix dead legacy Heroku bot instances (e.g. hell-fs1-oot-c9eb9b92ba45 -> live bot)
  if (url.includes('hell-fs1-oot-c9eb9b92ba45.herokuapp.com')) {
    url = url.replace('hell-fs1-oot-c9eb9b92ba45.herokuapp.com', CURRENT_HEROKU_BOT_HOST);
  }

  // 3. Streamvault / Google Drive stream to download conversion for direct file access
  if (url.includes('/0:/stream/')) {
    url = url.replace('/0:/stream/', '/0:/dl/');
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
