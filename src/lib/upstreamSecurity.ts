/**
 * Upstream Security & Hostname Validation Engine
 * Protects serverless proxy endpoints from SSRF without exposing internal hostnames in plaintext.
 */

// Encoded upstream media gateway signatures
const SECURE_HOST_SIGNATURES = [
  'c3RyZWFtdmF1bHRwcm8uY2M=',
  'c3ZjZG4tZGwud29ya2Vycy5kZXY=',
  'c3ZjZG4tZGwyLndvcmtlcnMuZGV2',
  'c3ZjZG4tZGwzLndvcmtlcnMuZGV2',
  'ZnMxcXlkdjE3ZzEtMTYxLTE2MmU1ZGYyOGE0NS5oZXJva3VhcHAuY29t',
  'dmlkbW9seS5uZXQ=',
  'dmlkbW9seS5tZQ==',
  'dmlkbW9seS50bw==',
  'dm1ub3cub25saW5l',
  'dm1ub3cubWU=',
  'dm1ub3cudG8=',
  'dm1ub3cuY2M=',
  'dm1ub3cubmV0',
  'cGxheW1vbHkubWU=',
  'cGxheW1vbHkubmV0',
  'bW9yZW5jaXVzLmNvbQ==',
  'ZWFybnZpZHMuY29t',
  'ZWFybnZpZHMubmV0',
  'Y3J3aWxsYWRtaW4uY29t',
  'c3RvcmFnZS5nb29nbGVhcGlzLmNvbQ==',
  'd29ya2Vycy5kZXY=',
  'aGVyb2t1YXBwLmNvbQ==',
  'cHVibGljYm90c2h1Yi5ibG9nc3BvdC5jb20=',
  'Y2RuLmp3cGxheWVyLmNvbQ==',
  'Y29udGVudC5qd3BsYXRmb3JtLmNvbQ==',
  'ZWRnZW9uZS5hcHA=', // edgeone.app
  'Y2xvdWRmcm9udC5uZXQ=', // cloudfront.net
];

function decodeSignature(b64: string): string {
  try {
    if (typeof atob === 'function') {
      return atob(b64);
    }
    return Buffer.from(b64, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

function getResolvedAllowlist(): Set<string> {
  const custom = process.env.ALLOWED_UPSTREAM_HOSTS;
  if (custom) {
    return new Set(custom.split(',').map((h) => h.trim().toLowerCase()));
  }
  const hosts = SECURE_HOST_SIGNATURES.map(decodeSignature).filter(Boolean);
  return new Set(hosts);
}

const RESOLVED_ALLOWLIST = getResolvedAllowlist();

export function isAllowedUpstream(rawUrl: string): boolean {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname.toLowerCase();
    if (RESOLVED_ALLOWLIST.has(hostname)) return true;
    for (const allowed of RESOLVED_ALLOWLIST) {
      if (hostname.endsWith('.' + allowed) || hostname === allowed) return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ── Origin & Anti-Hotlinking Protection ──────────────────────────────────────────
const ALLOWED_APP_DOMAINS = [
  'course.stutosed.in',
  'stutosed.in',
  'stutosed.vercel.app',
  'localhost',
  '127.0.0.1',
];

export function isAllowedOrigin(originOrReferer: string | null): boolean {
  if (!originOrReferer) return true; // Browser direct or same-origin non-cross requests
  try {
    const parsed = new URL(originOrReferer);
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_APP_DOMAINS.some(
      (allowed) => host === allowed || host.endsWith('.' + allowed)
    );
  } catch {
    return false;
  }
}

export function getSecureCorsHeaders(origin: string | null): Record<string, string> {
  const safeOrigin = origin && isAllowedOrigin(origin) ? origin : 'https://course.stutosed.in';
  return {
    'Access-Control-Allow-Origin': safeOrigin,
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
    'Vary': 'Origin',
  };
}
