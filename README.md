# ✦ stutosed

> **The High-Performance, Distraction-Free Study Operating System for B.Tech & Competitive Exam Aspirants.**

[![Live Web App](https://img.shields.io/badge/stutosed-Live%20Platform-FF6B4A?style=for-the-badge&logo=vercel&logoColor=white)](https://stutosed.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/Source-shikshiten%2Fstutosed-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/shikshiten/stutosed)

```
       ✦  S T U T O S E D  ✦
   ┌─────────────────────────────────────────────────────────────┐
   │  ⚡ Dual-Engine CDN  ·  📑 Native PDF Engine  ·  🔐 PKCE Auth │
   │  🎯 Zero Distractions  ·  🌓 Atyp Adaptive Theme  ·  📱 PWA  │
   └─────────────────────────────────────────────────────────────┘
```

[Live App](https://stutosed.vercel.app/) • [Academic Portals](#-academic-portals) • [Core Engineering](#-core-engineering--features) • [Architecture](#-system-architecture) • [Keyboard Hotkeys](#-keyboard-shortcuts) • [Quickstart](#-developer-quickstart)

---

## 🎯 What is stutosed?

**stutosed** is an open, modern learning station built specifically for **Bihar Engineering University (BEU) B.Tech students** and **Government Competitive Exam aspirants** (SSC CGL, CHSL, Railways, State Exams).

Traditional educational websites are cluttered with ads, slow video players, broken PDF viewers, and intrusive popups. **stutosed** replaces that friction with a focused workspace: instant video streaming, clean PDF reading, automatic progress sync, and layered gesture navigation.

---

## 🎓 Academic Portals

stutosed organizes content into dedicated, specialized hubs:

```
stutosed
 ├── 🏛️ BEU B.Tech Engineering Portal
 │    ├── 📘 1st Year All Branches (Physics, Chemistry, Math-II)
 │    ├── 🏗️ Civil Engineering Batch (Umeed & Esteem Modules)
 │    ├── 💻 Computer Science & Engineering (Core CS, Algo, Data Structures)
 │    ├── ⚙️ Mechanical Engineering (Fluid, Thermo, Mechanics)
 │    └── ⚡ EE / ECE / EEE Core Foundation
 │
 └── 🎯 Government Exams Portal
      ├── 🧠 Parmar SSC GK 3.0 Complete Series (Topic-wise)
      ├── 📖 Pratham Foundation Complete Subject Batch
      ├── 🔢 Quantitative Aptitude & Fast Arithmetic
      ├── 🗣️ English Special & Practice Sessions
      └── 🧩 Logical Reasoning & Analytical Thinking
```

---

## ⚡ Core Engineering & Features

### 1. Dual-Engine Video Streaming Pipeline
- **ALBA Engine**: Direct, low-latency CDN streaming via StreamVault Edge proxies for high-bitrate video playback.
- **ESTE Engine**: Fallback streaming bridge powered by distributed media servers to guarantee 100% video uptime.
- **Granular Speed Bridge**: Custom speed regulation from `0.5x` to `3.0x` with cross-frame `postMessage` synchronization.

### 2. Native Crystal-Clear PDF Reading
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

### 5. Cloud Progress & Resume Memory
- Automatically tracks completed lectures and last-played timestamps.
- One-click resume directly from the dashboard greeting card.

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

## ⌨️ Keyboard Shortcuts

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

## 🧰 Tech Stack Breakdown

```yaml
Client Framework:  Next.js 15.1 (Turbopack, React 19)
Type System:       TypeScript 5.0 (Strict Mode)
Styling:           Tailwind CSS 4.0 + Custom CSS Custom Properties
Typography:        Atyp Display & Atyp Text Variable Families
Authentication:    Supabase Auth (@supabase/ssr, PKCE OAuth)
Media Delivery:    HLS.js + Next.js Serverless Edge Proxies
Virtualization:    @tanstack/react-virtual
Icons:             Lucide React
Hosting Platform:  Vercel Edge Network
```

---

## 💻 Developer Quickstart

### 1. Clone & Install
```bash
git clone https://github.com/shikshiten/stutosed.git
cd stutosed
npm install
```

### 2. Configure Environment
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 3. Start Development Server
```bash
npm run dev
```
Visit [`http://localhost:3000`](http://localhost:3000) in your browser.

### 4. Production Build Verification
```bash
npm run build
```

---

## 🔒 Security & Privacy

- **SSRF Hardening**: Proxy endpoints enforce domain whitelist validation against arbitrary upstream queries.
- **Zero Token Leakage**: Tokens are never stored in `localStorage` or exposed to client-side scripts.
- **OWASP Compliance**: Enforces 8+ character password standards, generic error messaging, and secure cookie scopes.

---

## 📜 License & Acknowledgments

- Licensed under the [MIT License](LICENSE).
- Built with focus and passion for engineering and competitive exam students.
- All course curriculum, lecture titles, and reference materials belong to their respective educators and institutions.

---

<div align="right">
  <sub>✦ <b>stutosed</b> — Knowledge, Unlocked.</sub>
</div>
