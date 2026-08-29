<div align="center">

<br/>

<img src="public/favicon.svg" alt="stutosed logo" width="100" height="100" />

<br/>
<br/>

# stutosed

### The all-in-one high-performance learning ecosystem for B.Tech & Competitive Exam aspirants.

<br/>

[![Launch App](https://img.shields.io/badge/⚡%20Launch%20App-stutosed.vercel.app-ff6b4a?style=for-the-badge&logoColor=white)](https://stutosed.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/Source-shikshiten%2Fstutosed-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/shikshiten/stutosed)

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15.1_App_Router-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)](LICENSE)

<br/>

> High-speed dual-engine video streaming · Crystal-clear PDF notes · Cloud study sync · Zero ads — engineered for students.

<br/>

</div>

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 📊 | **Study Dashboard** | Dynamic greeting banner, cloud progress sync, and last-played lecture resume memory |
| 🎬 | **Dual-Engine Video Player** | Stream HD lectures with instant toggle between **ALBA** (High-Speed Edge CDN) and **ESTE** (Failover Media Engine) |
| ⚡ | **Speed Control Bridge** | Granular playback speed regulation from **0.5x to 3.0x** with cross-origin iframe synchronization |
| 📑 | **Lossless PDF Reader** | Crystal-clear in-browser PDF notes previewer with native typography, full-screen mode & single-click downloads |
| 📱 | **Layered Back Navigation** | Smart state-driven browser history stack — mobile back gesture steps smoothly: *Player ➔ Folder ➔ Course ➔ Home* |
| 🏛️ | **BEU Engineering Hub** | Organized semester modules for Civil, CSE, Mech, EEE/ECE, 1st Year (Math-II, Physics, Chemistry) |
| 🎯 | **Govt Exams Archive** | Complete structured batches for SSC CGL/CHSL (Parmar GK 3.0, Pratham Foundation, Math, English, Reasoning) |
| 🔐 | **Zero-Storage PKCE Auth** | Google OAuth & Email authentication using secure HttpOnly, SameSite=Lax cookies with automatic session refresh |
| 🌓 | **Adaptive Theme System** | Instant dark/light mode toggle with CSS variable transitions and zero page flicker |
| 🛡️ | **Edge SSRF Security Layer** | Serverless proxy routes with strict upstream hostname whitelisting to block unauthorized proxying |

---

## 🎓 Academic Portals Tree View

stutosed organizes course curriculum into dedicated, structured academic hubs:

```
stutosed
 ├── 🏛️ BEU B.Tech Engineering Portal
 │    ├── 📘 1st Year All Branches (Engineering Physics, Chemistry, Math-II)
 │    ├── 🏗️ Civil Engineering Batch (Umeed & Esteem Modules)
 │    ├── 💻 Computer Science & Engineering (Core CS, Data Structures, Algorithms)
 │    ├── ⚙️ Mechanical Engineering (Fluid Mechanics, Thermodynamics, Machine Design)
 │    └── ⚡ EE / ECE / EEE Core Engineering Foundation
 │
 └── 🎯 Government Exams Portal
      ├── 🧠 Parmar SSC GK 3.0 Complete Series (Topic-wise GK & PYQs)
      ├── 📖 Pratham Foundation Complete Subject Batch
      ├── 🔢 Quantitative Aptitude & Fast Arithmetic
      ├── 🗣️ English Special & Practice Sessions
      └── 🧩 Logical Reasoning & Analytical Thinking
```

---

## ⚡ Core Engineering Breakdown

### 1. Dual-Engine Video Streaming Pipeline
- **ALBA Engine (Primary)**: Direct, low-latency CDN streaming via High-Speed Edge proxies for high-bitrate video playback with HTTP Range request support (`bytes=0-`).
- **ESTE Engine (Failover)**: Fallback streaming bridge powered by distributed media servers to guarantee 100% video uptime.
- **Granular Speed Bridge**: Custom speed regulation from `0.5x` to `3.0x` with cross-frame `postMessage` synchronization.

### 2. Lossless Crystal-Clear PDF Reading
- Direct in-browser viewing with native vector font rendering.
- Integrated download triggers with fallback proxied caching.
- Zero blurry canvas rendering or broken print stylesheets.

### 3. Layered Hardware & Gesture Navigation
Designed specifically for mobile ergonomics:
$$\text{Player [Layer 4]} \xrightarrow{\text{Back}} \text{Subfolder [Layer 3]} \xrightarrow{\text{Back}} \text{Course [Layer 2]} \xrightarrow{\text{Back}} \text{Portal [Layer 1]} \xrightarrow{\text{Back}} \text{Home [Layer 0]}$$
Pressing the Android back gesture or browser back arrow steps cleanly through each modal layer without exiting the application.

### 4. Zero-Storage Client Auth (PKCE)
- Supabase SSR authentication with **HttpOnly**, **Secure**, **SameSite=Lax** cookies.
- Google OAuth with cryptographic code exchange (`/auth/callback`).
- Serverless Session Proxy (`proxy.ts`) refreshes JWT sessions transparently on every request.

---

## 🏗️ System Architecture

```
                                 ┌────────────────────────┐
                                 │   Student Browser /    │
                                 │  Mobile PWA (Client)   │
                                 └───────────┬────────────┘
                                             │
                                  HTTPS + HttpOnly Cookies
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │  Next.js 15 App Router Edge   │
                             │   (Vercel Serverless Infra)   │
                             └───────────────┬───────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               │                             │                             │
               ▼                             ▼                             ▼
   ┌───────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────┐
   │  Supabase Auth & DB   │   │  Streaming Reverse Proxy  │   │   PDF Document Proxy  │
   │  - PKCE OAuth / JWT   │   │  - /api/stream            │   │  - /api/pdf           │
   │  - Session Management │   │  - /api/hls-proxy         │   │  - SSRF Allowlist     │
   │  - RLS Security       │   │  - SSRF Allowlist         │   │  - In-Memory Cache    │
   └───────────────────────┘   └─────────────┬─────────────┘   └───────────┬───────────┘
                                             │                             │
                                             ▼                             ▼
                                 ┌────────────────────────┐    ┌───────────────────────┐
                                 │  CDN Video Hosts       │    │  Cloud Media Storage  │
                                 │  (ALBA / ESTE Clusters)│    │  (Raw Course Notes)   │
                                 └────────────────────────┘    └───────────────────────┘
```

---

## ⌨️ Video Player Keyboard Shortcuts

| Shortcut | Action | Scope |
|---|---|---|
| <kbd>Space</kbd> / <kbd>K</kbd> | Play / Pause video | Video Player |
| <kbd>→</kbd> / <kbd>L</kbd> | Seek Forward 10 seconds | Video Player |
| <kbd>←</kbd> / <kbd>J</kbd> | Seek Backward 10 seconds | Video Player |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Increase / Decrease volume | Video Player |
| <kbd>F</kbd> | Toggle Fullscreen mode | Video Player |
| <kbd>M</kbd> | Mute / Unmute audio | Video Player |
| <kbd>0</kbd> – <kbd>9</kbd> | Jump to 0% – 90% timeline | Video Player |
| <kbd>Esc</kbd> | Close active modal / step back | Global |

---

## 🛠 Tech Stack Spec

```yaml
Frontend Framework:  Next.js 15.1 (Turbopack, React 19, App Router)
Language:            TypeScript 5.0 (Strict Type Checking)
Styling & Design:    Tailwind CSS 4.0 · Custom CSS Properties · Atyp Font Family
Authentication:      Supabase Auth (@supabase/ssr, OAuth 2.0 PKCE, HttpOnly Cookies)
Database:            Supabase PostgreSQL (Row Level Security & Triggers)
Media Streaming:     HLS.js (Adaptive Bitrate) · Custom Reverse Proxies
Icons:               Lucide React
Virtualization:      @tanstack/react-virtual
Hosting & Edge:      Vercel Edge Network
```

---

## 📁 Project Structure

```
stutosed/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md              # Bug reporting template
│   │   └── feature_request.md         # Feature request template
│   └── PULL_REQUEST_TEMPLATE.md       # Pull request contribution template
├── docs/
│   ├── ARCHITECTURE.md                # System design, media streaming pipeline & auth flow
│   └── SECURITY.md                    # Threat model, SSRF protection & cookie security
├── database/
│   └── schema.sql                     # Reference PostgreSQL schema, RLS policies & triggers
├── public/
│   ├── assets/                        # Portal banners and course graphics
│   ├── fonts/atyp/                    # Complete Atyp typography family
│   ├── thumbnails/                    # High-resolution batch thumbnails
│   ├── favicon.svg                    # Vector brand spike logo
│   └── favicon.ico                    # Browser favicon
├── src/
│   ├── app/
│   │   ├── api/                       # Serverless proxy endpoints
│   │   │   ├── embed/                 # Player embed speed bridge proxy
│   │   │   ├── hls-proxy/             # M3U8 index & TS segment proxy
│   │   │   ├── pdf/                   # Lossless PDF document proxy
│   │   │   └── stream/                # Video stream URL resolver
│   │   ├── auth/callback/             # OAuth PKCE session code exchange
│   │   ├── login/                     # Standalone dedicated login page
│   │   ├── globals.css                # Design tokens, typography & animations
│   │   ├── layout.tsx                 # Root layout & OpenGraph metadata
│   │   └── page.tsx                   # Main dashboard, portals & modal orchestration
│   ├── components/
│   │   ├── AuthModal.tsx              # Google & Email sign-in / sign-up modal
│   │   ├── CourseGrid.tsx             # Interactive course card grid
│   │   ├── CourseModal.tsx            # Folder/lecture explorer & search filter
│   │   ├── MobileHeader.tsx           # Mobile navigation & account drawer
│   │   ├── PdfViewerModal.tsx         # In-browser PDF reader
│   │   ├── ProfileMenu.tsx            # User profile dropdown & theme toggle
│   │   ├── Sidebar.tsx                # Collapsible navigation drawer
│   │   └── VideoPlayer.tsx            # Custom video player & speed controls
│   ├── lib/
│   │   ├── supabase/                  # Supabase SSR browser & server clients
│   │   ├── coursesData.ts             # Course querying & progress helpers
│   │   └── coursesData.json           # Comprehensive course catalog data
│   ├── proxy.ts                       # Edge session refresh proxy
│   └── types/                         # TypeScript interfaces
├── .env.local.example                 # Sample environment variables
├── CONTRIBUTING.md                    # Contribution & IP guidelines
├── LICENSE                            # All Rights Reserved Proprietary License
├── next.config.ts                     # Next.js optimization configuration
├── package.json                       # Dependencies & scripts
└── tsconfig.json                      # Strict TypeScript configuration
```

---

## ⚡ Quick Start

### 1 · Clone the repository
```bash
git clone https://github.com/shikshiten/stutosed.git
cd stutosed
```

### 2 · Set up Supabase
1. Create a project at [supabase.com](https://supabase.com/).
2. Open the **SQL Editor** and run [`database/schema.sql`](database/schema.sql) to create `profiles`, `user_progress`, `user_last_played` tables, RLS policies, and user triggers.
3. Copy your **Project URL** and **anon key** from **Settings → API**.
4. Go to **Authentication → URL Configuration**:
   - Set **Site URL**: `https://stutosed.vercel.app` (or `http://localhost:3000` for local testing).
   - Add to **Redirect URLs**:
     ```
     https://stutosed.vercel.app/**
     https://stutosed.vercel.app/auth/callback
     http://localhost:3000/**
     http://localhost:3000/auth/callback
     ```

### 3 · Configure Environment Variables
Credentials are never hardcoded in source code. Create a `.env.local` file in the root directory:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-supabase-anon-key` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `your-google-client-id.apps.googleusercontent.com` |

```bash
# Install dependencies
npm install

# Run local development server
npm run dev
```
Open [`http://localhost:3000`](http://localhost:3000) in your browser.

### 4 · Deploy to Vercel
1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com/) → **Add New Project**.
3. Import your `stutosed` repository.
4. Add the Environment Variables in **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
5. Click **Deploy** ✅

### 5 · Verify Edge Streaming & Proxies
Once deployed, Vercel automatically deploys the serverless edge proxies:
- `/api/stream` — Resolves and proxies ALBA/ESTE video streams with Range headers.
- `/api/hls-proxy` — Rewrites and serves M3U8 indices and TS video segments.
- `/api/pdf` — Proxies high-resolution PDF course notes.
- `/api/embed` — Speed bridge iframe controller.

---

## 🔒 Copyright & Proprietary Notice

**ALL RIGHTS RESERVED.**

Unauthorized copying, cloning, redistribution, commercialization, or reverse-engineering of this codebase or its streaming architecture is strictly prohibited. See [`LICENSE`](LICENSE) for complete terms.

---

<div align="center">
  <sub>✦ Built with precision for students. Designed &amp; Maintained by <b>stutosed</b>.</sub>
</div>
