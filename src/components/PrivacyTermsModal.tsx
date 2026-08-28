'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Scale, CheckCircle2, AlertCircle } from 'lucide-react';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  initialTab?: 'privacy' | 'terms';
  onClose: () => void;
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

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
        animation: 'modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
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
          maxWidth: '620px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top Gradient Stripe */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--accent), var(--beu-blue), var(--green))' }} />

        {/* Header with Tabs */}
        <div
          style={{
            padding: '18px 24px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('privacy')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--r-pill)',
                border: activeTab === 'privacy' ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: activeTab === 'privacy' ? 'rgba(204, 120, 92, 0.12)' : 'var(--bg)',
                color: activeTab === 'privacy' ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <ShieldCheck width={15} height={15} />
              <span>Privacy Policy</span>
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--r-pill)',
                border: activeTab === 'terms' ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: activeTab === 'terms' ? 'rgba(204, 120, 92, 0.12)' : 'var(--bg)',
                color: activeTab === 'terms' ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Scale width={15} height={15} />
              <span>Terms of Service</span>
            </button>
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
            }}
            aria-label="Close"
          >
            <X width={16} height={16} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeTab === 'privacy' ? (
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--green)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  <ShieldCheck width={14} height={14} />
                  <span>Student Privacy First</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
                  stutosed Privacy Policy
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  Last updated: August 2026. At <strong>stutosed</strong>, your privacy and study integrity are our absolute priorities. We are committed to transparency in how your data is handled.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
                    1. Information We Collect
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    When you sign up via Email or Google OAuth, we collect your Name, Email address, and optional Google Avatar photo. We also store your watched lecture URLs and last-played timestamps to keep your study progress synchronized.
                  </p>
                </div>

                <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
                    2. Zero Commercial Data Selling
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    We will <strong>never</strong> sell, rent, monetize, or share your personal contact details or study behavior with third-party advertisers or marketing data brokers.
                  </p>
                </div>

                <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
                    3. Local Storage & Preferences
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    We utilize browser local storage strictly for functional application preferences: Dark/Light theme mode, open folder tabs, and instant offline watched indicators.
                  </p>
                </div>

                <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
                    4. Security & Encryption
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    All user authentication is powered by Supabase with modern cryptographic hashing and SSL transmission, ensuring passwords and auth tokens are guarded against interception.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  <Scale width={14} height={14} />
                  <span>Fair Use & Community Policy</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
                  Terms & Conditions of Service
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  Last updated: August 2026. By accessing and using <strong>stutosed</strong>, you agree to comply with the following fair educational use terms.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
                    1. Educational Non-Commercial Purpose
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    stutosed is a non-profit educational study companion developed solely to facilitate organized academic preparation for students preparing for Government Exams (SSC CGL/CHSL) and BEU B.Tech engineering coursework.
                  </p>
                </div>

                <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
                    2. Content Attribution & Rights
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    All video lectures, curated playlist recordings, and PDF notes hosted or linked through the portal remain the intellectual property of their respective original teachers, faculty, and educational creators.
                  </p>
                </div>

                <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
                    3. Free Access Guarantee
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    Access to course catalogs, streaming lectures, and PDF viewers is 100% free. No user is required to pay any recurring fee or subscription to access core content.
                  </p>
                </div>

                <div style={{ background: 'var(--bg-card-subtle)', padding: '14px 16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
                    4. Takedown & Copyright Queries
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    If you are an educator or rights holder wishing to update, modify, or request the removal of any listed course material, please reach out directly via Telegram @bookwormislie for immediate assistance.
                  </p>
                </div>
              </div>
            </>
          )}
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
            <CheckCircle2 width={13} height={13} style={{ color: 'var(--green)' }} />
            <span>Compliant with Indian IT Rules & Fair Use</span>
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
            I Understand
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
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
