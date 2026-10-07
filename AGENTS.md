<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Stutosed Architecture & Backend Guide

## 1. Overview
The backend of Stutosed follows a strict layered REST architecture built directly on Next.js 15 App Router Route Handlers (Node.js runtime). Express is not used.

Every endpoint:
1. Is RESTful and versioned under `/api/v1/<resource>`.
2. Validates incoming query and request body using Zod schemas (`src/schemas/*.schema.ts`).
3. Uses the `withApi` wrapper (`src/server/http/withApi.ts`) for unified error handling, validation parsing, authentication, and rate limiting.
4. Returns a standard response envelope:
   - **Success**: `{ "data": ... }`
   - **Failure**: `{ "error": { "code": "...", "message": "..." } }`
5. Enforces security boundaries: All modules under `src/server/` include `import 'server-only'` to guarantee they can never be imported by client-side components.

---

## 2. Directory Structure

```
src/
├── app/
│   ├── api/
│   │   ├── health/route.ts          # System health check (GET /api/health)
│   │   ├── v1/                      # Modern REST API handlers (thin)
│   │   │   ├── pdf/route.ts         # GET /api/v1/pdf
│   │   │   ├── stream/route.ts      # GET /api/v1/stream
│   │   │   ├── thumbnail/route.ts   # GET /api/v1/thumbnail
│   │   │   ├── hls-proxy/route.ts   # GET /api/v1/hls-proxy
│   │   │   └── embed/route.ts       # GET /api/v1/embed (410 Gone)
│   │   ├── pdf/route.ts             # Backward-compat delegate -> v1/pdf
│   │   ├── stream/route.ts          # Backward-compat delegate -> v1/stream
│   │   ├── thumbnail/route.ts       # Backward-compat delegate -> v1/thumbnail
│   │   ├── hls-proxy/route.ts       # Backward-compat delegate -> v1/hls-proxy
│   │   └── embed/route.ts           # Backward-compat delegate -> v1/embed
├── schemas/                         # Zod request validation schemas
│   ├── pdf.schema.ts
│   ├── stream.schema.ts
│   ├── thumbnail.schema.ts
│   ├── hls-proxy.schema.ts
│   └── embed.schema.ts
├── server/                          # Server-only backend layer (import 'server-only')
│   ├── auth/
│   │   └── getUser.ts               # Reads authenticated user via supabase.auth.getUser()
│   ├── http/
│   │   ├── errors.ts                # AppError, UnauthorizedError, ValidationError, etc.
│   │   ├── response.ts              # ok() and fail() JSON response formatters
│   │   ├── cookies.ts               # Secure cookie utilities
│   │   └── withApi.ts               # Standard route handler wrapper with validation & rate limit
│   ├── security/
│   │   ├── upstreamSecurity.ts      # SSRF allowlists and CORS origin validators
│   │   └── rateLimit.ts             # In-memory sliding window IP rate limiter
│   ├── services/                    # Business logic layer
│   │   ├── pdf.service.ts
│   │   ├── stream.service.ts
│   │   ├── thumbnail.service.ts
│   │   ├── hls-proxy.service.ts
│   │   └── embed.service.ts
│   └── repositories/                # Database/Supabase queries
│       ├── user-progress.repo.ts    # Watch history, bookmarks, saved videos, progress
│       └── course.repo.ts           # Course data access
├── lib/
│   ├── env.ts                       # Zod-validated environment variables
│   ├── api-client.ts                # Typed fetch client for frontend components
│   └── proxyConfig.ts               # Cloudflare Worker proxy configuration
└── workers/
    └── cloudflare_worker_secure.js  # Edge streaming proxy worker code
```

---

## 3. Developing New Endpoints

When adding an endpoint:
1. Define the input validation schema in `src/schemas/<resource>.schema.ts`.
2. Implement business logic inside `src/server/services/<resource>.service.ts`.
3. If database or Supabase access is required, place queries inside `src/server/repositories/<resource>.repo.ts`.
4. Create the route handler in `src/app/api/v1/<resource>/route.ts` using `withApi`:
   ```typescript
   import { withApi } from '@/server/http/withApi';
   import { ok } from '@/server/http/response';
   import { mySchema } from '@/schemas/my.schema';
   import { myService } from '@/server/services/my.service';

   export const GET = withApi(
     async ({ req, query, user }) => {
       const result = await myService(query);
       return ok(result);
     },
     {
       querySchema: mySchema,
       requireAuth: false, // set true if authentication required
       rateLimit: { limit: 60, windowSeconds: 60 },
     }
   );
   ```

---

## 4. Frontend Usage
Client components should consume endpoints via `src/lib/api-client.ts`:
```typescript
import { apiClient } from '@/lib/api-client';

const data = await apiClient.get<StreamResult>('/api/v1/stream', {
  params: { code: 'abc', provider: 'vidmoly' }
});
```
Legacy routes under `/api/*` continue to delegate transparently to `/api/v1/*` to maintain full backward compatibility with unmigrated client code.
