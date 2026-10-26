import 'server-only';

/**
 * Upstream Security & Hostname Validation Engine
 * Protects serverless proxy endpoints from SSRF without exposing internal hostnames in plaintext.
 */

// Encoded upstream media gateway signatures
const SECURE_HOST_SIGNATURES = [
  'c3ZjZG4tZGwud29ya2Vycy5kZXY=',
  'c3ZjZG4tZGwyLndvcmtlcnMuZGV2',
  'c3ZjZG4tZGwzLndvcmtlcnMuZGV2',
  'ZnMxcXlkdjE3ZzEtMTYxLTE2MmU1ZGYyOGE0NS5oZXJva3VhcHAuY29t',
  'ZnMxZW5jaGFudGVkLWZsb3dlci02ODkzMDIyMi04NzMxNzI3MTZlODIuaGVyb2t1YXBwLmNvbQ==', // fs1enchanted-flower-68930222-873172716e82.herokuapp.com
  'dmlkbW9seS5uZXQ=',
  'dmlkbW9seS5tZQ==',
  'dmlkbW9seS50bw==',
  'dmlkbW9seS5iaXo=', // vidmoly.biz
  'dmlkbW9seS5wcm8=', // vidmoly.pro
  'dmlkbW9seS5jb20=', // vidmoly.com
  'dm1lYXMuY2xvdWQ=', // vmeas.cloud (Vidmoly primary CDN cluster)
  'dm1lYXMubmV0', // vmeas.net
  'dm1lYXMub25saW5l', // vmeas.online
  'dm1zdG9yYWdlLm5ldA==', // vmstorage.net
  'dm1zdG9yYWdlLmNsb3Vk', // vmstorage.cloud
  'dm1weC5vbmxpbmU=', // vmpx.online
  'dm1weC5uZXQ=', // vmpx.net
  'dm1weC5jbG91ZA==', // vmpx.cloud
  'dm1jbGQuc3BhY2U=', // vmcld.space
  'dm1jbGQubmV0', // vmcld.net
  'dm1jbGQuY2xvdWQ=', // vmcld.cloud
  'dm1ub3cub25saW5l',
  'dm1ub3cubWU=',
  'dm1ub3cudG8=',
  'dm1ub3cuY2M=',
  'dm1ub3cubmV0',
  'cGxheW1vbHkubWU=',
  'cGxheW1vbHkubmV0',
  'bW9yZW5jaXVzLmNvbQ==',
  'bW9yZW5jaXVzLm5ldA==', // morencius.net
  'ZWFybnZpZHMuY29t',
  'ZWFybnZpZHMubmV0',
  'ZWFybnZpZHMueHl6', // earnvids.xyz
  'Y3J3aWxsYWRtaW4uY29t',
  'c2VsZWN0aW9ud2F5LmNvbQ==', // selectionway.com
  'c3RvcmFnZS5nb29nbGVhcGlzLmNvbQ==',
  'c2Vpcnl1LnN0dXRvc2VkLndvcmtlcnMuZGV2', // seiryu.stutosed.workers.dev (Stutosed official streaming worker)
  'cHVibGljYm90c2h1Yi5ibG9nc3BvdC5jb20=',
  'Y2RuLmp3cGxheWVyLmNvbQ==',
  'Y29udGVudC5qd3BsYXRmb3JtLmNvbQ==',
  'aHJhbmtlci5jb20=', // hranker.com
  'c3RycDJwLnNpdGU=', // strp2p.site
  'c3R1dG9zZWQuc3RycDJwLnNpdGU=', // stutosed.strp2p.site
  'c3luY3AycC5jb20=', // syncp2p.com
  'c3RyZWFtcDJwLmNvbQ==', // streamp2p.com
  // Exact-host specific subdomains (No wildcards permitted)
  'ZmlsZXMuY2F0Ym94Lm1vZQ==', // files.catbox.moe
  'aHJhbmtlci1ub2RlLnMzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbQ==', // hranker-node.s3.ap-south-1.amazonaws.com
  'ZDE0djR2ODBjcGpodDcuY2xvdWRmcm9udC5uZXQ=', // d14v4v80cpjht7.cloudfront.net
  'ZDI4eG5pOTc3OGhvZmwuY2xvdWRmcm9udC5uZXQ=', // d28xni9778hofl.cloudfront.net
  'ZDN2bGc0cWpiODBoOG4uY2xvdWRmcm9udC5uZXQ=', // d3vlg4qjb80h8n.cloudfront.net
  'aXNzbWF0dGVycHVyZXh2aXZpZC5lZGdlb25lLmFwcA==',
  'dml2aWRlY290ZXN0MS5lZGdlb25lLmFwcA==',
  'dml2aWR4YWNpZGJhc2VhbmRzYWx0c2VuZy5lZGdlb25lLmFwcA==',
  'dml2aWR4YWNpZGJhc2VhbmRzYWx0c2hpbi5lZGdlb25lLmFwcA==',
  'dml2aWR4YWNpZGJhc2VzYW5kc2FsdHMuZWRnZW9uZS5hcHA=',
  'dml2aWR4YWNpZGJhc2VzYW5kc2FsdHNwcHQuZWRnZW9uZS5hcHA=',
  'dml2aWR4YWNpZGJhc2VzYW5kc2FsdHNxdWl6LmVkZ2VvbmUuYXBw',
  'dml2aWR4YXRvbS5lZGdlb25lLmFwcA==',
  'dml2aWR4YXRvbWVuZ2xpc2guZWRnZW9uZS5hcHA=',
  'dml2aWR4YXRvbWhpbmRpLmVkZ2VvbmUuYXBw',
  'dml2aWR4YXRvbXBwdC5lZGdlb25lLmFwcA==',
  'dml2aWR4YXRvbXouZWRnZW9uZS5hcHA=',
  'dml2aWR4YmlvZnVsbHRlc3QuZWRnZW9uZS5hcHA=',
  'dml2aWR4Y2hlbWljYWxlbmcuZWRnZW9uZS5hcHA=',
  'dml2aWR4Y2hlbWljYWxoaW5kaS5lZGdlb25lLmFwcA==',
  'dml2aWR4Y2hlbWljYWxwcHQuZWRnZW9uZS5hcHA=',
  'dml2aWR4Y2hlbWljYWxxdWl6LmVkZ2VvbmUuYXBw',
  'dml2aWR4Y2hlbWljYWxyZWFjdGlvbnMuZWRnZW9uZS5hcHA=',
  'dml2aWR4Y2hlbWlzdHJ5dGVzdC5lZGdlb25lLmFwcA==',
  'dml2aWR4Y2xhc3NpY2FsZGRhbmNlLmVkZ2VvbmUuYXBw',
  'dml2aWR4ZWNvZnVsbHRlc3QuZWRnZW9uZS5hcHA=',
  'dml2aWR4Zm9sa2RhbmNlcy5lZGdlb25lLmFwcA==',
  'dml2aWR4ZnVsbGdlb3Rlc3QuZWRnZW9uZS5hcHA=',
  'dml2aWR4ZnVsbGhpc3Rvcnl0ZXN0LmVkZ2VvbmUuYXBw',
  'dml2aWR4ZnVsbHBvbGl0eXRlc3QuZWRnZW9uZS5hcHA=',
  'dml2aWR4aW1hdHRlcnB1cmVsZWN0dXJlLmVkZ2VvbmUuYXBw',
  'dml2aWR4aXNtYXR0ZXJwdXJlZW5nLmVkZ2VvbmUuYXBw',
  'dml2aWR4aXNtYXR0ZXJwdXJlaGluZGkuZWRnZW9uZS5hcHA=',
  'dml2aWR4aXNtYXR0ZXJwdXJlcHB0LmVkZ2VvbmUuYXBw',
  'dml2aWR4bWF0dGVyZW5nLmVkZ2VvbmUuYXBw',
  'dml2aWR4bWF0dGVyaGluZGkuZWRnZW9uZS5hcHA=',
  'dml2aWR4bWF0dGVycHB0LmVkZ2VvbmUuYXBw',
  'dml2aWR4bWF0dGVycy5lZGdlb25lLmFwcA==',
  'dml2aWR4bWV0YWxhbmRub24tbWV0YWwuZWRnZW9uZS5hcHA=',
  'dml2aWR4bWV0YWxub25tZXRhbGVuZy5lZGdlb25lLmFwcA==',
  'dml2aWR4bWV0YWxub25tZXRhbGhpbmRpLmVkZ2VvbmUuYXBw',
  'dml2aWR4bWV0YWxub25tZXRhbHBwdC5lZGdlb25lLmFwcA==',
  'dml2aWR4bWV0YWxxdWl6LmVkZ2VvbmUuYXBw',
  'dml2aWR4cGVyaW9kaWNlbmcuZWRnZW9uZS5hcHA=',
  'dml2aWR4cGVyaW9kaWNoaW5kaS5lZGdlb25lLmFwcA==',
  'dml2aWR4cGVyaW9kaWNwcHQuZWRnZW9uZS5hcHA=',
  'dml2aWR4cGVyaW9kaWNxdWl6LmVkZ2VvbmUuYXBw',
  'dml2aWR4cGVyaW9kaWN0YWJsZWxlY3R1cmUuZWRnZW9uZS5hcHA=',
  'dml2aWR4cGh5c2ljc3Rlc3QuZWRnZW9uZS5hcHA=',
  'dml2aWR4cHJhdGhhbWJhdGNoLmVkZ2VvbmUuYXBw',
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

// Multi-tenant and generic cloud platforms where suffix wildcard matching MUST NEVER be allowed
const NO_WILDCARD_PLATFORMS = [
  'workers.dev',
  'herokuapp.com',
  'blogspot.com',
  'appspot.com',
  'vercel.app',
  'github.io',
  'pages.dev',
  'netlify.app',
  'render.com',
  'amazonaws.com',
  'cloudfront.net',
  'edgeone.app',
  'catbox.moe',
];

export function isAllowedUpstream(rawUrl: string): boolean {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname.toLowerCase();

    // 1. Direct exact match in allowlist
    if (RESOLVED_ALLOWLIST.has(hostname)) return true;

    // 2. Subdomain check with strict public platform protection
    for (const allowed of RESOLVED_ALLOWLIST) {
      const isPublicPlatform = NO_WILDCARD_PLATFORMS.some(
        (p) => allowed === p || allowed.endsWith('.' + p)
      );

      // Never permit wildcard subdomains on shared multi-tenant or public cloud platforms
      if (isPublicPlatform) {
        if (hostname === allowed) return true;
        continue;
      }

      if (hostname === allowed || hostname.endsWith('.' + allowed)) {
        return true;
      }
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

export function isAllowedOrigin(
  originOrReferer: string | null,
  secFetchSite?: string | null
): boolean {
  // If explicitly cross-site and no origin provided, block
  if (secFetchSite === 'cross-site' && !originOrReferer) {
    return false;
  }

  if (originOrReferer) {
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

  // When Origin/Referer and Sec-Fetch-Site are missing (e.g. older Android WebView, Telegram in-app browser),
  // do not block unless explicitly cross-site
  return true;
}

export function getSecureCorsHeaders(origin: string | null): Record<string, string> {
  const safeOrigin = origin && isAllowedOrigin(origin) ? origin : 'https://stutosed.vercel.app';
  return {
    'Access-Control-Allow-Origin': safeOrigin,
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
    'Vary': 'Origin',
  };
}
