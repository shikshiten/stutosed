/**
 * Cloudflare Worker Smart Proxy Configuration
 * Offloads heavy media and PDF streaming bandwidth from Vercel Serverless to Cloudflare Workers,
 * preserving 0 Egress Bandwidth costs and 100% free operation on stutosed.vercel.app.
 */

export const CLOUDFLARE_WORKER_URL =
  process.env.NEXT_PUBLIC_STREAM_PROXY_URL || 'https://seiryu.stutosed.workers.dev';

export function getWorkerProxyUrl(targetUrl: string, type: 'stream' | 'hls' | 'pdf' = 'stream'): string {
  if (!targetUrl) return '';
  const base = CLOUDFLARE_WORKER_URL.replace(/\/+$/, '');
  if (type === 'hls') {
    return `${base}/hls?url=${encodeURIComponent(targetUrl)}`;
  }
  return `${base}/?url=${encodeURIComponent(targetUrl)}`;
}
