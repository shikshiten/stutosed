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
    version: 'v2.4.0',
    date: 'September 04, 2026 • 03:25 AM IST',
    isLatest: true,
    title: 'News & Announcements Hub, Student Request Desk & Refined Home Layout',
    highlights: [
      'News & Announcements Hub: Stay updated with upcoming exam batches, future study features, and new learning tracks in one dedicated section.',
      'Direct Telegram Course Request Desk: Have a demand for a specific subject, lecture series, or class notes? Reach out directly to admin via Telegram.',
      'Refined Value Highlights: Balanced and stress-free pillars on the home banner emphasizing 100% free access, chapter-wise learning, and one-click notes.',
      'Polished Responsive Geometry: Perfectly aligned metrics and cards across widescreen monitors, laptops, tablets, and smartphones.',
    ],
  },
  {
    version: 'v2.3.0',
    date: 'September 04, 2026 • 01:55 AM IST',
    title: 'Topic-Specific Vector Artwork for Every Lecture & Folder',
    highlights: [
      'Personalized Lecture Artwork: Every video lecture card now features clean vector artwork displaying its exact topic title and lecture number.',
      'Custom Folder & Course Covers: Course folders and batch cards showcase custom artwork designed around their subjects.',
      'Day & Night Reading Synergy: Visual covers automatically adjust colors and contrast to match your selected light or dark theme.',
    ],
  },
  {
    version: 'v2.2.0',
    date: 'September 04, 2026 • 01:35 AM IST',
    title: 'Advik Guest Profile, Instant Playback & Direct Device PDF Downloads',
    highlights: [
      'Personalized Advik Experience: Homepage greetings and study metrics are now customized for Advik with zero setup needed.',
      'One-Click PDF Downloads: Save class notes and study materials straight to your phone or computer with a single tap.',
      'Smooth High-Speed Video: Faster lecture load times and smooth playback across all government and engineering batches.',
    ],
  },
  {
    version: 'v2.1.0',
    date: 'September 04, 2026 • 01:15 AM IST',
    title: '100% Free Open Access & Stress-Free Learning',
    highlights: [
      'Zero Forced Logins: Learn freely without mandatory sign-up popups. Watch lectures, view study modules, and download notes anytime as a guest.',
      'Continue as Guest: Instant, one-tap guest access button to dive straight into your studies.',
      'Optional Sync: Sign in only if you wish to sync watched video progress across multiple devices.',
    ],
  },
  {
    version: 'v2.0.0',
    date: 'September 03, 2026 • 11:00 PM IST',
    title: 'High-Performance Video & PDF Engine',
    highlights: [
      'Supercharged Streaming: Instant video playback with zero buffering interruptions.',
      'Reliable Course Materials: Seamless viewing of all class notes and study handouts.',
    ],
  },
  {
    version: 'v1.9.0',
    date: 'August 31, 2026 • 10:45 PM IST',
    title: 'Clean Navigation & Swipeable Touch Filters',
    highlights: [
      'Organized 4-Row Header: Cleanly structured lecture navigation with quick search, subject pills, and layout switcher.',
      'Smooth Touch Tabs: Fast swipeable subject pills with zero scrollbar clutter on mobile devices.',
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
