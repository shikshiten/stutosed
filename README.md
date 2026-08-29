<div align="center">

<br/>

<img src="public/favicon.svg" alt="stutosed logo" width="90" height="90" />

<br/>
<br/>

# stutosed

### Next-Gen Distraction-Free Learning Ecosystem for Engineering & Exam Aspirants

<br/>

[![Launch App](https://img.shields.io/badge/⚡%20Launch%20App-stutosed.vercel.app-ff6b4a?style=for-the-badge&logoColor=white)](https://stutosed.vercel.app/)

<br/>

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_SSR-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

<br/>

> **High-speed video streaming · Crystal-clear PDF notes · Dual CDN servers · Zero ads · Cloud progress sync**

<br/>

</div>

---

## ⚡ Overview

**stutosed** is a modern, high-performance web application tailored for students preparing for **BEU (Bihar Engineering University)** semester examinations and **Government Competitive Exams** (SSC CGL, Banking, Railway, etc.).

Engineered with **Next.js 15 App Router**, **Supabase Auth (PKCE)**, and a **Custom Edge Proxy Streaming Engine**, it provides instant access to organized video lectures, lecture notes, formula sheets, and study modules with zero buffering and seamless mobile UX.

---

## ✨ Features & Capabilities

| | Feature | Description |
|---|---|---|
| 🎬 | **Dual-Engine Video Player** | Stream high-definition lectures with seamless toggle between **ALBA** (Direct High-Speed CDN) and **ESTE** (Backup Media Server). |
| ⚡ | **Granular Speed Bridge** | Custom playback speed controller ranging from **0.5x to 3.0x** with cross-frame `postMessage` synchronization. |
| 📑 | **Crystal-Clear PDF Viewer** | Native embedded PDF reader with direct new-tab viewing, high-resolution rendering, and instant download options. |
| 📱 | **Layered Back Navigation** | Smart state-driven browser history stack — hardware & gesture back button navigates smoothly: *Player ➔ Folder ➔ Course ➔ Home*. |
| 🔐 | **Supabase Auth (PKCE)** | Secure Google OAuth & Email/Password authentication with HttpOnly cookie session management and SSR protection. |
| ☁️ | **Cloud Progress Tracking** | Automatically records watched lectures and last-played timestamps with instant resume capabilities. |
| 🎨 | **Adaptive Dark & Light Theme** | Custom styled theme system with smooth CSS variable transitions and personalized dynamic greeting banners. |
| 🛡️ | **Edge SSRF Protection** | Hardened serverless proxy routes (`/api/stream`, `/api/pdf`, `/api/embed`, `/api/hls-proxy`) with strict upstream domain validation. |

---

## 🛠️ Tech Stack

```
Frontend Framework   Next.js 15.1 (React 19, Turbopack, App Router)
Language             TypeScript 5.0 (Strict Type Checking)
Styling & Design     Tailwind CSS 4.0 · Custom Design Tokens · Atyp Typography
Authentication       Supabase Auth (@supabase/ssr, OAuth PKCE, HttpOnly Cookies)
Media Streaming      HLS.js (Adaptive Bitrate) · Custom Reverse Proxies
Icons                Lucide React
Virtualization       @tanstack/react-virtual
Hosting & Edge       Vercel Serverless & Edge Network
```

---

## 📁 Project Structure

```
courses.stutosed/
├── public/
│   ├── assets/              # Course banner images and portal thumbnails
│   ├── fonts/atyp/          # High-fidelity Atyp font family files
│   ├── thumbnails/          # High-resolution course thumbnails
│   ├── favicon.svg          # Official stutosed vector brand logo
│   └── favicon.ico          # Browser tab icon
├── src/
│   ├── app/
│   │   ├── api/             # Secure Edge & Serverless proxy endpoints
│   │   │   ├── embed/       # Video player embed bridge proxy
│   │   │   ├── hls-proxy/   # M3U8 & TS segment streaming proxy
│   │   │   ├── pdf/         # High-resolution PDF document proxy
│   │   │   └── stream/      # Direct media stream resolver
│   │   ├── auth/callback/   # OAuth PKCE session exchange handler
│   │   ├── login/           # Standalone dedicated student login page
│   │   ├── globals.css      # Design tokens, typography & animations
│   │   ├── layout.tsx       # Root layout, metadata & viewport
│   │   └── page.tsx         # Core dashboard, portals & lecture modals
│   ├── components/
│   │   ├── AuthModal.tsx         # Google & Email sign-in / sign-up modal
│   │   ├── CourseGrid.tsx        # Responsive interactive course catalog
│   │   ├── CourseModal.tsx       # Folder/lecture explorer & search filter
│   │   ├── MobileHeader.tsx      # Responsive mobile navigation bar
│   │   ├── PdfViewerModal.tsx    # Native PDF notes previewer
│   │   ├── ProfileMenu.tsx       # User profile, theme toggle & stats
│   │   ├── Sidebar.tsx           # Collapsible desktop & mobile drawer
│   │   └── VideoPlayer.tsx       # Custom HLS/MP4 video player & speed controls
│   ├── lib/
│   │   ├── supabase/        # SSR client, server client & SQL schema
│   │   ├── coursesData.ts   # Course helpers, categorization & stats
│   │   └── coursesData.json # Structured multi-branch course catalog
│   ├── proxy.ts             # Session refresh proxy for Next.js App Router
│   └── types/               # TypeScript interfaces & domain types
├── .env.local.example       # Sample environment configuration
├── next.config.ts           # Next.js optimization configuration
├── tsconfig.json            # Strict TypeScript configuration
└── vercel.json              # Vercel deployment configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.18+ or 20+
- **npm**, **pnpm**, or **yarn**
- **Supabase Account** (for authentication)

### 1. Clone the repository
```bash
git clone https://github.com/shikshiten/courses.stutosed.git
cd courses.stutosed
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
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

## 🔒 Security & Architecture

- **Zero Client-Side Token Exposure**: Supabase auth tokens are handled through secure, `HttpOnly`, `SameSite=Lax` cookies via `@supabase/ssr`.
- **SSRF Prevention**: All media streaming and PDF proxy routes enforce strict hostname allowlists preventing arbitrary upstream access.
- **PKCE OAuth Flow**: Google sign-in utilizes cryptographic code verifiers and server-side code exchange.
- **Serverless Compatibility**: Completely stateless, multi-region edge deployment built specifically for Vercel.

---

## 🤝 Contributing

Contributions, feedback, and feature suggestions are welcome!

1. Fork the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.

---

<div align="center">
  <sub>Built with ❤️ for students everywhere. Designed &amp; Maintained by <b>stutosed</b>.</sub>
</div>
