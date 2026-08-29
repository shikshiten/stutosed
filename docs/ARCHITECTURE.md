# 🏛️ stutosed Architecture & System Design

This document details the high-level architecture, streaming pipeline, authentication mechanisms, and state management of **stutosed**.

---

## 1. High-Level Architecture Overview

stutosed is built on **Next.js 15 App Router** deploying to **Vercel Serverless & Edge infrastructure**, integrated with **Supabase Auth & Database**.

```
Client (PWA / Web Browser)
        │
        ├── Session Verification via Secure HttpOnly Cookie
        │
        ▼
Next.js Edge Runtime (proxy.ts)
        │
        ├── Page Routes (SSR / Static Dashboard)
        │
        └── Serverless Edge API Proxies
                ├── /api/stream     (ALBA/ESTE video stream resolver)
                ├── /api/hls-proxy  (M3U8 index & TS segment proxy)
                ├── /api/pdf        (Lossless PDF document proxy)
                └── /api/embed      (JWPlayer / Vidmoly iframe bridge)
```

---

## 2. Dual-Engine Video Streaming Pipeline

To ensure 100% lecture availability without third-party IP blocks or CORS restrictions, stutosed implements a dual-engine architecture:

1. **ALBA Engine (Primary)**:
   - Connects to high-throughput StreamVault CDN clusters (`svcdn-dl*.workers.dev`).
   - Supports HTTP Range requests (`bytes=0-`) for instant video seeking.
   - Converts download `/0:/dl/` endpoints to direct streaming pipelines seamlessly.

2. **ESTE Engine (Failover)**:
   - Connects to dedicated Heroku media streaming bots.
   - Extracts unique video IDs from raw stream links and pipes directly with custom referer headers.

3. **HLS Proxy (`/api/hls-proxy`)**:
   - Re-writes M3U8 playlist URLs on-the-fly so that TS media segments route through Vercel Edge IPs, bypassing mobile CDN token-binding locks.

4. **Speed Control Bridge**:
   - Injects cross-window communication scripts into proxied embed players, enabling client playback speed control from `0.5x` to `3.0x`.

---

## 3. Layered Back Navigation State Engine

Mobile user experience requires that pressing the Android back button or gesture does not close the website prematurely.

stutosed models application state as a 5-layer hierarchy:
- **Layer 4**: Video Player / PDF Modal Active
- **Layer 3**: Course Subfolder Active
- **Layer 2**: Course Detail Modal Active
- **Layer 1**: Academic Category Portal Active (`beu-engineering`, `gov-exams`, etc.)
- **Layer 0**: Root Home Dashboard

Every forward navigation pushes a state to `window.history.pushState()`, and the global `popstate` listener unwinds one layer at a time in exact reverse sequence.

---

## 4. Authentication Architecture

- **Protocol**: OAuth 2.0 PKCE Flow with Supabase SSR (`@supabase/ssr`).
- **Session Storage**: Strict `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
- **Session Refresh**: `src/proxy.ts` calls `supabase.auth.getUser()` on all incoming requests to refresh tokens seamlessly without exposing secrets to client-side JavaScript.
