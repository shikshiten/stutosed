'use client';

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  MessageSquare,
  Copy,
  Check,
  Send,
  ExternalLink,
  CheckCircle2,
  Tv,
} from 'lucide-react';

export interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseName?: string;
  lectureTitle?: string;
  lectureUrl?: string;
  serverName?: string;
  theme?: 'light' | 'dark';
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  onClose,
  courseName = 'Lecture Series',
  lectureTitle = 'Current Lecture',
  lectureUrl = '',
  serverName,
  theme,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(
    'Video is not loading / stuck on connecting'
  );
  const [userNote, setUserNote] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const reasons = [
    'Video is not loading / stuck on connecting',
    'Playback unavailable (Upstream server error)',
    'Video buffering constantly / broken stream',
    'Audio/Video out of sync or missing',
  ];

  const formattedReport = `[Stutosed Playback Issue Report]
• Course: ${courseName}
• Lecture: ${lectureTitle}
${serverName ? `• Server: ${serverName}\n` : ''}${lectureUrl ? `• URL: ${lectureUrl}\n` : ''}• Issue: ${selectedReason}
${userNote.trim() ? `• Note: ${userNote.trim()}\n` : ''}• Time: ${new Date().toLocaleString()}
• Platform: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Web'}`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(formattedReport);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const telegramBotUrl = `https://t.me/chatstubot?text=${encodeURIComponent(
    `Hello Developer, I am facing an issue playing a lecture on Stutosed:\n\n${formattedReport}\n\nPlease check this lecture source.`
  )}`;

  const handleSubmitQuick = () => {
    try {
      const existingRaw = localStorage.getItem('stutosed_user_complaints');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.push({
        courseName,
        lectureTitle,
        lectureUrl,
        serverName,
        reason: selectedReason,
        note: userNote,
        timestamp: Date.now(),
      });
      localStorage.setItem('stutosed_user_complaints', JSON.stringify(existing));
    } catch {}

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(10, 10, 12, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'modalFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: 'var(--bg-card, #1a1a1f)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 24px rgba(239, 68, 68, 0.15)',
          overflow: 'hidden',
          position: 'relative',
          color: 'var(--text, #f1f5f9)',
        }}
      >
        {/* Top Warning Accent Line */}
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, #ef4444, #f59e0b, #ec4899)',
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: '18px 22px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.16)',
                border: '1px solid rgba(239, 68, 68, 0.32)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0,
              }}
            >
              <AlertTriangle width={18} height={18} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text, #ffffff)',
                  letterSpacing: '-0.3px',
                }}
              >
                Complain to Developer
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                Report broken video playback or server timeout
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Close"
          >
            <X width={18} height={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '18px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Lecture Context Banner */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent, #6366f1)', fontWeight: 700, textTransform: 'uppercase' }}>
              <Tv width={13} height={13} />
              <span>{courseName}</span>
            </div>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 600,
                color: 'var(--text, #ffffff)',
                lineHeight: 1.4,
              }}
            >
              {lectureTitle}
            </div>
            <div style={{ fontSize: '11.5px', color: '#ef4444', fontWeight: 600, marginTop: '2px' }}>
              Status: Abhi playback iski available nahi hai
            </div>
          </div>

          {/* Issue Reason Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-muted, #94a3b8)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Select What Happened
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {reasons.map((r) => {
                const isSelected = selectedReason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedReason(r)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: isSelected
                        ? '1px solid rgba(239, 68, 68, 0.65)'
                        : '1px solid var(--border, rgba(255, 255, 255, 0.08))',
                      background: isSelected
                        ? 'rgba(239, 68, 68, 0.12)'
                        : 'rgba(255, 255, 255, 0.02)',
                      color: isSelected ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                      fontSize: '12.5px',
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: isSelected
                          ? '4px solid #ef4444'
                          : '1.5px solid rgba(255, 255, 255, 0.3)',
                        flexShrink: 0,
                      }}
                    />
                    <span>{r}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional User Note */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-muted, #94a3b8)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Additional Note (Optional)
            </label>
            <textarea
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="e.g. Stops playing after 20 seconds, or link returned 404..."
              rows={2}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
                borderRadius: '10px',
                color: 'var(--text, #ffffff)',
                fontSize: '12.5px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Submission Success Toast Banner */}
          {isSubmitted && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 width={16} height={16} />
              <span>Complaint registered! The developer team will fix this lecture shortly.</span>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div
          style={{
            padding: '14px 22px 18px',
            borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Main Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Telegram Direct Send */}
            <a
              href={telegramBotUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px 16px',
                borderRadius: '11px',
                background: '#0088cc',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0, 136, 204, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              <Send width={15} height={15} />
              <span>Send on Telegram</span>
            </a>

            {/* Quick Submit */}
            <button
              type="button"
              onClick={handleSubmitQuick}
              disabled={isSubmitted}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px 16px',
                borderRadius: '11px',
                background: 'rgba(239, 68, 68, 0.9)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              <MessageSquare width={15} height={15} />
              <span>Submit Complaint</span>
            </button>
          </div>

          {/* Secondary Options: Copy Details or Join Channel */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11.5px',
              paddingTop: '4px',
            }}
          >
            <button
              type="button"
              onClick={handleCopy}
              style={{
                background: 'transparent',
                border: 'none',
                color: isCopied ? '#34d399' : 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 600,
                padding: 0,
              }}
            >
              {isCopied ? <Check width={13} height={13} /> : <Copy width={13} height={13} />}
              <span>{isCopied ? 'Copied report to clipboard!' : 'Copy issue details'}</span>
            </button>

            <a
              href="https://t.me/stutosed"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--text-muted, #94a3b8)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11.5px',
                fontWeight: 500,
              }}
            >
              <span>Developer Channel (@stutosed)</span>
              <ExternalLink width={11} height={11} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
