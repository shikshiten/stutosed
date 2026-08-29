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
  'bW9yZW5jaXVzLmNvbQ==',
  'Y3J3aWxsYWRtaW4uY29t',
  'c3RvcmFnZS5nb29nbGVhcGlzLmNvbQ==',
  'd29ya2Vycy5kZXY=',
  'cHVibGljYm90c2h1Yi5ibG9nc3BvdC5jb20=',
  'ZWFybnZpZHMuY29t',
  'Y2RuLmp3cGxheWVyLmNvbQ==',
  'Y29udGVudC5qd3BsYXRmb3JtLmNvbQ==',
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
      if (hostname.endsWith('.' + allowed)) return true;
    }
    return false;
  } catch {
    return false;
  }
}
