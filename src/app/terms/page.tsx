'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, ArrowLeft, ShieldAlert, Award, FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main, #0d0f12)', color: 'var(--text-primary, #f0f3f6)', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent, #3b82f6)', textDecoration: 'none', marginBottom: '32px', fontSize: '14px', fontWeight: 600 }}>
          <ArrowLeft width={18} height={18} />
          Back to Vault
        </Link>

        <header style={{ marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '100px', color: '#60a5fa', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '14px' }}>
            <FileText width={14} height={14} />
            Academic Terms of Service
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>Terms of Service</h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: 0, fontSize: '14px' }}>
            Effective Date: September 2026 • Platform: <strong>stutosed (courses.stutosed.in)</strong>
          </p>
        </header>

        <main style={{ display: 'flex', flexDirection: 'column', gap: '28px', lineHeight: 1.7, fontSize: '15px', color: 'rgba(255,255,255,0.85)' }}>
          <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen width={18} height={18} color="var(--accent, #3b82f6)" />
              1. Acceptance of Terms
            </h2>
            <p style={{ margin: 0 }}>
              By accessing or using the stutosed platform (courses.stutosed.in), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.
            </p>
          </section>

          <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award width={18} height={18} color="var(--accent, #3b82f6)" />
              2. Educational Purpose &amp; Fair Use
            </h2>
            <p style={{ margin: 0 }}>
              stutosed is designed solely for individual student study, academic preparation (including Bihar Engineering University - BEU engineering syllabi, SSC, UPSC, and competitive exam studies), revision, and self-education. Users agree to utilize content responsibly and for lawful educational purposes only.
            </p>
          </section>

          <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert width={18} height={18} color="var(--accent, #3b82f6)" />
              3. Platform Conduct &amp; Prohibitions
            </h2>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Do not attempt to disrupt or bypass server rate-limiting, proxy gateways, or security filters.</li>
              <li>Do not use automated scraping bots, spiders, or scrapers that cause denial of service to educational servers.</li>
              <li>Do not exploit authentication systems or attempt unauthorized access to other students accounts.</li>
            </ul>
          </section>

          <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText width={18} height={18} color="var(--accent, #3b82f6)" />
              4. Disclaimer of Warranties &amp; Limitation of Liability
            </h2>
            <p style={{ margin: 0 }}>
              The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. While we strive for maximum uptime, high-speed streaming, and accurate syllabus organization, we make no express warranties regarding uninterrupted service. Under no circumstances shall stutosed be liable for indirect, incidental, or consequential damages resulting from platform use.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
