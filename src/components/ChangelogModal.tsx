'use client';

import React from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, Tag, Rocket, ArrowRight, History } from 'lucide-react';

export interface ReleaseLog {
  version: string;
  date: string;
  isLatest?: boolean;
  title: string;
  highlights: string[];
}

export const CHANGELOG_DATA: ReleaseLog[] = [
  {
    version: 'v1.4.0',
    date: 'August 29, 2026',
    isLatest: true,
    title: 'BEU 1st Year UMEED Branches & Complete Engineering Curriculum',
    highlights: [
      'Added Civil Engineering (UMEED Batch — 201 lectures & notes) with ALBA + ESTE dual servers.',
      'Added Computer Science Engineering (UMEED Batch — 143 lectures & notes) covering Chemistry, Maths & English.',
      'Added Engineering Physics (UMEED Batch — 61 lectures & notes) across all 5 units (Frames, Oscillations, Optics, Laser, Quantum).',
      'Added Engineering Mathematics-II (UMEED Batch — 110 lectures & class notes) covering all 6 units.',
      'Expanded Mechanical Engineering (UMEED Batch) to full 217-lecture catalog with workshop & welding modules.',
      'Dual Bot Vault with Smart Proxy & Direct Embed toggles across all new branches.',
      'Interactive Privacy Policy & Terms of Service modal integration.',
    ],
  },
  {
    version: 'v1.3.0',
    date: 'August 29, 2026',
    title: 'Account Authentication & Profile System Overhaul',
    highlights: [
      'Compulsory student login implemented across all course lectures and study materials.',
      'Enhanced Sign Up collecting Full Name, Email, Password with strength indicator & Show/Hide visibility toggle.',
      'Google Sign-In integration with auto-populated profile picture and display name.',
      'Personalized time-based greeting banner on dashboard (Good Morning / Afternoon / Evening).',
      'Redesigned Top-Right Profile menu with instant theme switch, progress tracking, and account actions.',
      'Mobile-optimized Profile View with 2×2 learning metric cards and cloud sync.',
      'Interactive Changelog & Version Tracking system in footer.',
    ],
  },
  {
    version: 'v1.2.0',
    date: 'August 28, 2026',
    title: 'Global Design System, Typography & Motion Pass',
    highlights: [
      'Configured Space Grotesk display headings paired with Inter UI typography.',
      'Standardized Lucide icon library replacing all raw emojis across the portal.',
      'Added floating ambient gradient mesh blobs & live viewport count-up stats on Hero.',
      'Redesigned course domain cards with hover lift (-5px) and category badge tints.',
      'Upgraded Multi-Column responsive footer with verified student channels.',
      'Deep link URL query state synchronization for instant state restoration on refresh.',
    ],
  },
  {
    version: 'v1.1.0',
    date: 'August 24, 2026',
    title: 'BEU 1st Year Engineering & Dual Stream Proxy Engine',
    highlights: [
      'Integrated Bihar Engineering University (BEU) 1st Year curriculum (EE/ECE/EEE, Chemistry, Mechanical UMEED).',
      'Dual Bot video streaming proxy engine with Smart Proxy and Direct Embed capabilities.',
      'Full-screen PDF notes viewer with quick navigation and download links.',
      'Lecture history and progress tracking stored securely in local state.',
    ],
  },
  {
    version: 'v1.0.0',
    date: 'August 2026',
    title: 'Initial stutosed Portal Launch',
    highlights: [
      'Platform launched with 9 comprehensive Government Exam preparation batches.',
      'Parmar GK 3.0, Static GK, English, Maths & Reasoning full course archives.',
      'Clean ad-free video player and structured folder navigation.',
    ],
  },
];

export const CURRENT_APP_VERSION = CHANGELOG_DATA[0].version;

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(18, 17, 16, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'changelogFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-2xl)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Decorative Gradient Bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--accent), var(--beu-blue), var(--green))' }} />

        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--r-lg)',
                background: 'rgba(204, 120, 92, 0.12)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <History width={20} height={20} strokeWidth={2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  Release Changelog
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--r-pill)',
                    background: 'var(--accent)',
                    color: '#ffffff',
                  }}
                >
                  {CURRENT_APP_VERSION}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Platform updates, performance improvements & new features
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            aria-label="Close"
          >
            <X width={16} height={16} />
          </button>
        </div>

        {/* Scrollable Changelog List */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {CHANGELOG_DATA.map((log) => (
            <div
              key={log.version}
              style={{
                background: log.isLatest ? 'var(--bg-card-subtle)' : 'transparent',
                border: log.isLatest ? '1px solid var(--accent-glow)' : '1px solid var(--border)',
                borderRadius: 'var(--r-xl)',
                padding: '18px 20px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                    {log.version}
                  </span>
                  {log.isLatest && (
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--r-pill)',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: 'var(--green)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                      }}
                    >
                      Latest Release
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 500 }}>
                  {log.date}
                </span>
              </div>

              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 10px' }}>
                {log.title}
              </h3>

              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {log.highlights.map((item, idx) => (
                  <li key={idx} style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-card-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-dim)' }}>
            <ShieldCheck width={13} height={13} style={{ color: 'var(--green)' }} />
            <span>stutosed is actively updated</span>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--r-md)',
              background: 'var(--accent)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      </div>

      <style>{`
        @keyframes changelogFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};
