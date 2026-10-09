# PROJECT CONTINUITY & CONTEXT HANDOFF GUIDE
**Project:** Stutosed (`course.stutosed.in` / `stutosed.vercel.app`)  
**Repository:** [github.com/shikshiten/stutosed](https://github.com/shikshiten/stutosed)  
**Last Updated:** October 9, 2026  
**Status:** Main branch clean, all layered REST API changes pushed (`0c49112`).

---

## 1. Project Overview & Current State
Stutosed is a Next.js 15 (App Router, React 19, TypeScript) educational portal with Supabase authentication, dynamic SVG thumbnails, in-browser PDF reader, and dual-engine streaming video player (ALBA / ESTE) designed for SSC, Competitive Exam & BEU B.Tech students.

### Latest Completed Milestones
1. **Layered Backend Architecture (`/api/v1/`)**:
   - Refactored serverless routes into a layered REST architecture:
     - `src/app/api/v1/stream/route.ts` &mdash; Resolves video streaming and handles proxying.
     - `src/app/api/v1/pdf/route.ts` &mdash; Validates and proxies high-res PDF course notes.
     - `src/app/api/v1/thumbnail/route.ts` &mdash; Generates dynamic SVG lecture vector thumbnails.
     - `src/app/api/v1/hls-proxy/route.ts` &mdash; M3U8 playlist & TS video segment proxy with Dean Edwards unpacker.
     - `src/app/api/v1/embed/route.ts` &mdash; Returns 410 Gone (deprecated embed route).
     - `src/app/api/health/route.ts` &mdash; Health check endpoint (`GET /api/health`).
   - Backward-compatible delegates in `src/app/api/*` re-export or delegate to `/api/v1/*`.
   - Zod schemas in `src/schemas/*.schema.ts`.
   - Server-only modules (`import 'server-only'`) in `src/server/`:
     - `src/server/services/` &mdash; Business logic.
     - `src/server/repositories/` &mdash; `user-progress.repo.ts`, `course.repo.ts`.
     - `src/server/security/` &mdash; SSRF protection (`upstreamSecurity.ts`), sliding window in-memory rate limiter (`rateLimit.ts`).
     - `src/server/http/` &mdash; `withApi.ts`, `response.ts`, `errors.ts`, `cookies.ts`.
     - `src/server/auth/` &mdash; `getUser.ts`.
   - Client fetch wrapper: `src/lib/api-client.ts`.
   - Relocated Cloudflare worker: `workers/cloudflare_worker_secure.js`.

---

## 2. Active User Goal & Next Planned Milestone

### The Goal: Automated Multi-Platform Lecture Ingest & Bulk Uploader
The user wants to upload new video lectures from Telegram to multiple video streaming platforms:
- **Vidmoly**
- **Earnvids**
- **StreamP2P / Upnshare**
- **YouTube** (Unlisted / Public via YouTube Data API v3)

### Key Requirements & Constraints Agreed With User
1. **No 24/7 Local Laptop Requirement**: The user frequently shifts machines or doesn't have their laptop turned on.
2. **Zero Server Hosting Bill (₹0 / Free)**:
   - Evaluated Render/Railway: Bandwidth costs ($0.15/GB) are prohibitive for GBs of video data.
   - Evaluated Cloudflare Workers: 100 MB body size limit & 50ms CPU limit cannot handle 500 MB video downloads.
   - Evaluated Oracle Cloud: User does not have a credit card for verification.
3. **Chosen Architecture: "Possibility 1 (GitHub Actions Cloud Runner + Stutosed Web Admin Panel)"**:
   - **GitHub Actions Runner**: Free 2,000 monthly runner minutes with 1 Gbps download/upload speeds and 16 GB RAM.
   - **Web Admin Panel (`/admin`)**: A password-protected UI on Stutosed where team members / uploaders can input:
     - **Telegram Start Post Link** (e.g. `https://t.me/testingchannelsanumo/14789`)
     - **Telegram End Post Link** (e.g. `https://t.me/testingchannelsanumo/14888`)
     - **Target Course & Subject** (e.g. BEU B.Tech 1st Year &rarr; Mathematics-II)
     - **Target Platforms Checkboxes** (`[x] Vidmoly`, `[x] Earnvids`, `[x] StreamP2P`, `[x] YouTube`)
     - Trigger button that dispatches a GitHub Actions workflow dispatch job.
   - **Confidentiality**: All API keys (Vidmoly, Earnvids, YouTube OAuth, Telegram MTProto API ID/Hash) live in GitHub Secrets / server `.env`. Team members never see any API keys or credentials.
4. **Domain Decision**: The user does NOT need to buy a domain immediately. Development and deployment continue on `stutosed.vercel.app` or localhost without any code rework needed when a domain is attached later.

---

## 3. Step-by-Step Implementation Roadmap

### Step 1: Core Automation Uploader Engine (`automation/uploader/`)
Build Python or Node script with:
- Telegram crawler (`telethon` / `pyrogram` or bot client) parsing message IDs from `start_link` to `end_link`.
- Download pipeline with streaming chunking (handles both public channels and private channels where user session is a member).
- Uploader adapters:
  - `vidmoly_uploader.py`: Uploads to Vidmoly via API key.
  - `earnvids_uploader.py`: Uploads to Earnvids via API key.
  - `streamp2p_uploader.py`: Uploads to StreamP2P / Upnshare.
  - `youtube_uploader.py`: OAuth client with YouTube Data API v3.
- Output JSON formatter: Generates ready-to-merge lecture objects matching `coursesData.json` schema.

### Step 2: GitHub Actions Cloud Runner Workflow (`.github/workflows/bulk-uploader.yml`)
- Accepts `workflow_dispatch` inputs: `start_url`, `end_url`, `course_id`, `subject_id`, `platforms`.
- Runs on `ubuntu-latest` with secrets for all platforms.
- Automatically commits updated lecture JSON or saves to Supabase database.

### Step 3: Web Admin Panel (`/admin`) on Stutosed
- Role-based protected route (`src/app/admin/page.tsx`).
- Clean form UI with live queue status, platform selection, and trigger button calling GitHub API `/repos/{owner}/{repo}/actions/workflows/bulk-uploader.yml/dispatches`.

---

## 4. Setup Instructions on New Computer

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shikshiten/stutosed.git
   cd stutosed
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Environment Setup (`.env.local`):**
   Ensure `.env.local` has:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://hofbtbutvuomeofmhkyu.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
   NEXT_PUBLIC_STREAM_PROXY_URL=https://seiryu.stutosed.workers.dev
   ```
4. **Run build check:**
   ```bash
   npm run build
   ```
5. **Start development server:**
   ```bash
   npm run dev
   ```

---

## 5. How to Resume the Conversation with the AI Assistant
When opening Antigravity or any AI assistant on your new laptop, simply say:
> *"I have switched to this computer. Please read `PROJECT_CONTINUITY.md` and continue with Step 1 of the Telegram Multi-Platform Uploader Engine."*
