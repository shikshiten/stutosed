# 🛡️ stutosed Security & Threat Model

This document outlines the security architecture, threat mitigations, and compliance standards implemented in **stutosed**.

---

## 1. SSRF (Server-Side Request Forgery) Protection

Because stutosed operates reverse proxies for video and PDF streaming (`/api/stream`, `/api/pdf`, `/api/embed`, `/api/hls-proxy`), strict hostname whitelisting is enforced:

```typescript
const ALLOWED_UPSTREAM_HOSTNAMES = new Set([
  'streamvaultpro.cc',
  'svcdn-dl.workers.dev',
  'svcdn-dl2.workers.dev',
  'svcdn-dl3.workers.dev',
  'fs1qydv17g1-161-162e5df28a45.herokuapp.com',
  'vidmoly.net',
  'morencius.com',
  'crwilladmin.com',
  'storage.googleapis.com',
  'workers.dev'
]);
```
Any incoming request specifying an arbitrary internal/external IP or non-whitelisted domain is immediately rejected with HTTP `403 Forbidden`.

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
