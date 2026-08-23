'use client';

import React from 'react';
import { User, LogIn } from 'lucide-react';
import { UserProfile } from '@/types';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
  onOpenAuth: () => void;
  user: UserProfile | null;
  onSelectHome?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenSidebar,
  onOpenAuth,
  user,
  onSelectHome,
}) => {
  return (
    <header id="mobile-header">
      {/* Sidebar Hamburger Menu */}
      <button className="menu-btn" onClick={onOpenSidebar} aria-label="Open menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

      {/* Brand Center */}
      <div
        className="mobile-logo"
        style={{ cursor: 'pointer' }}
        onClick={() => {
          if (onSelectHome) onSelectHome();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <svg className="brand-spike" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3.5" fill="currentColor" />
          <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="0.8" />
          <path d="M12 3.5V1M12 20.5v2.5M3.5 12H1M20.5 12h2.5M6 6L4 4M18 18l2 2M6 18l-2 2M18 6l2-2" />
        </svg>
        <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.4px' }}>stutosed</span>
      </div>

      {/* Top Right Auth Button (Replacing Search Icon) */}
      <button
        onClick={onOpenAuth}
        aria-label="Account / Sign In"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: 'var(--r-pill)',
          background: user ? 'rgba(204,120,92,0.12)' : 'var(--accent)',
          border: user ? '1px solid var(--accent)' : 'none',
          color: user ? 'var(--accent)' : '#ffffff',
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: user ? 'none' : '0 2px 8px rgba(204,120,92,0.25)',
          transition: 'all 0.2s ease',
        }}
      >
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : user ? (
          <User width={14} height={14} />
        ) : (
          <LogIn width={13} height={13} />
        )}
        <span style={{ maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user ? (user.full_name?.split(' ')[0] || 'Profile') : 'Sign In'}
        </span>
      </button>
    </header>
  );
};
