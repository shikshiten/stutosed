# 🛡️ stutosed Security & Threat Model

This document outlines the security architecture, threat mitigations, and compliance standards implemented in **stutosed**.

---

## 1. SSRF (Server-Side Request Forgery) Protection

Reverse proxies for video and PDF streaming (`/api/stream`, `/api/pdf`, `/api/embed`, `/api/hls-proxy`) implement runtime cryptographic hostname signature validation (`src/lib/upstreamSecurity.ts`).

- Incoming stream and document URLs are verified against an authorized cryptographic signature registry.
- Custom allowed domains can also be configured dynamically via the `ALLOWED_UPSTREAM_HOSTS` environment variable.
- Any request targeting non-verified external hostnames, private IPs, or localhost ports is rejected immediately with HTTP `403 Forbidden`.

---

## 2. Token Security & HttpOnly Cookie Isolation

- **No Access Tokens in `localStorage`**: Unlike vulnerable SPAs, user authentication credentials and JWTs are **never written to `localStorage` or `sessionStorage`**.
- **Browser Protection**: Cookies are flagged with `HttpOnly`, `Secure` (in production), and `SameSite=Lax`, completely mitigating XSS token extraction attacks.

---

## 3. Server-Side Authentication Gating

All sensitive streaming API endpoints verify user identity via Supabase session verification before streaming media content:
```typescript
const user = await getAuthenticatedUser(request);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## 4. Proprietary IP Protection

- The codebase is licensed under **All Rights Reserved**.
- Unauthorized mirroring, scraping, or redeployment of stutosed course indexes is prohibited.
