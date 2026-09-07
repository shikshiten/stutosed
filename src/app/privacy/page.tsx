'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Database, Eye, Globe } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main, #0d0f12)', color: 'var(--text-primary, #f0f3f6)', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent, #3b82f6)', textDecoration: 'none', marginBottom: '32px', fontSize: '14px', fontWeight: 600 }}>
          <ArrowLeft width={18} height={18} />
          Back to Vault
        </Link>

        <header style={{ marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '100px', color: '#60a5fa', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '14px' }}>
            <ShieldCheck width={14} height={14} />
            Student Privacy Commitment
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: 0, fontSize: '14px' }}>
            Effective Date: September 2026 • Platform: <strong>stutosed (courses.stutosed.in)</strong>
          </p>
        </header>

        <main style={{ display: 'flex', flexDirection: 'column', gap: '28px', lineHeight: 1.7, fontSize: '15px', color: 'rgba(255,255,255,0.85)' }}>
          <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock width={18} height={18} color="var(--accent, #3b82f6)" />
              1. Information We Collect
            </h2>
            <p style={{ margin: '0 0 10px 0' }}>
              We respect your privacy as a student and only collect the minimal information necessary to deliver educational video content, track learning progress, and save your course bookmarks:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Account Information:</strong> When you sign in via Google OAuth or Email, we store your user ID, name, email address, and profile picture avatar.</li>
              <li><strong>Learning Progress &amp; Watch History:</strong> We store timestamps of completed lectures, resume timestamps (video playback seconds), and course bookmarks so your learning state persists across devices.</li>
              <li><strong>Device &amp; Session Storage:</strong> LocalStorage and Cookies are utilized locally on your device for responsive performance, instant resume, and auth token management.</li>
            </ul>
          </section>

          <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database width={18} height={18} color="var(--accent, #3b82f6)" />
              2. How We Use Your Information
            </h2>
            <p style={{ margin: '0 0 10px 0' }}>Your information is strictly used for:</p>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Synchronizing lecture completion checkmarks and timestamps across desktop and mobile.</li>
              <li>Maintaining your personalized saved video folders and bookmarked batches.</li>
              <li>Authenticating your session securely with Supabase PostgreSQL Row Level Security (RLS).</li>
              <li><strong>We NEVER sell, rent, monetize, or share your personal data with any third-party advertising networks.</strong></li>
            </ul>
          </section>

          <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe width={18} height={18} color="var(--accent, #3b82f6)" />
              3. Media Streaming &amp; Smart Proxy Architecture
            </h2>
            <p style={{ margin: 0 }}>
              Educational lectures are streamed using high-performance Smart Proxy endpoints via Cloudflare Workers and HLS segment proxies. Media streams are routed with strict origin and SSRF security controls to protect your connection without logging your browsing activity.
            </p>
          </section>

          <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Eye width={18} height={18} color="var(--accent, #3b82f6)" />
              4. Your Rights &amp; Data Deletion
            </h2>
            <p style={{ margin: '0 0 10px 0' }}>
              You retain full control over your learning data. You can clear your local progress anytime via your browser settings or request complete deletion of your Supabase cloud profile and watch history by contacting our administration.
            </p>
            <p style={{ margin: 0, color: 'var(--text-secondary, #94a3b8)', fontSize: '13px' }}>
              For privacy inquiries, contact support at: <strong>support@stutosed.in</strong> or <strong>courses.stutosed.in</strong>
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
