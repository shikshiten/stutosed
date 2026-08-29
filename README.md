<div align="center">

<br/>

<img src="public/favicon.svg" alt="stutosed logo" width="100" height="100" />

<br/>
<br/>

# stutosed

### The all-in-one high-performance learning ecosystem for B.Tech & Competitive Exam aspirants.

<br/>

[![Launch App](https://img.shields.io/badge/⚡%20Launch%20App-stutosed.vercel.app-ff6b4a?style=for-the-badge&logoColor=white)](https://stutosed.vercel.app/)

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
| 📊 | **Study Dashboard** | Personalized dynamic greeting banner, study progress overview & last-played lecture resume memory |
| 🎬 | **Dual-Engine Video Player** | Stream HD lectures with instant toggle between **ALBA** (High-Speed StreamVault CDN) and **ESTE** (Failover Media Engine) |
| ⚡ | **Speed Control Bridge** | Granular playback speed regulation from **0.5x to 3.0x** with cross-origin iframe synchronization |
| 📑 | **Lossless PDF Reader** | Crystal-clear in-browser PDF notes previewer with native typography, full-screen mode & single-click downloads |
| 📱 | **Layered Back Navigation** | Smart state-driven browser history stack — mobile back gesture steps smoothly: *Player ➔ Folder ➔ Course ➔ Home* |
| 🏛️ | **BEU Engineering Hub** | Organized semester modules for Civil, CSE, Mech, EEE/ECE, 1st Year (Math-II, Physics, Chemistry) |
| 🎯 | **Govt Exams Archive** | Complete structured batches for SSC CGL/CHSL (Parmar GK 3.0, Pratham Foundation, Math, English, Reasoning) |
| 🔐 | **Zero-Storage PKCE Auth** | Google OAuth & Email authentication using secure HttpOnly, SameSite=Lax cookies with automatic session refresh |
| 🌓 | **Adaptive Theme System** | Instant dark/light mode toggle with CSS variable transitions and zero page flicker |
| 🛡️ | **Edge SSRF Security Layer** | Serverless proxy routes with strict upstream hostname whitelisting to block unauthorized proxying |

---

## 🛠 Tech Stack

```
Frontend Framework   Next.js 15.1 (React 19, Turbopack, App Router)
Language             TypeScript 5.0 (Strict Type Checking)
Styling & Tokens     Tailwind CSS 4.0 · Custom CSS Variables · Atyp Font Family
Authentication       Supabase Auth (@supabase/ssr, OAuth 2.0 PKCE, HttpOnly Cookies)
Database             Supabase PostgreSQL (Row Level Security & Triggers)
Media Streaming      HLS.js (Adaptive Bitrate) · Custom Reverse Proxies
Icons                Lucide React
Virtualization       @tanstack/react-virtual
Edge & Hosting       Vercel Edge Network
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

> **Note on `database/schema.sql`**: These SQL statements define the PostgreSQL schema and Row Level Security (RLS) policies used in Supabase. Run them directly in the Supabase SQL Editor.

---

## ⚡ Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/shikshiten/stutosed.git
cd stutosed
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Copyright & Proprietary Notice

**ALL RIGHTS RESERVED.**

Unauthorized copying, cloning, redistribution, commercialization, or reverse-engineering of this codebase or its streaming architecture is strictly prohibited. See [`LICENSE`](LICENSE) for complete terms.

---

<div align="center">
  <sub>✦ Built with precision for students. Designed &amp; Maintained by <b>stutosed</b>.</sub>
</div>
