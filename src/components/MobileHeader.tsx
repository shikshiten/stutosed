'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { AppView } from '@/components/Sidebar';
import { ProfileMenu } from '@/components/ProfileMenu';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
  onOpenAuth: () => void;
  user: UserProfile | null;
  userName: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSelectView: (view: AppView) => void;
  onSignOut: () => void;
  watchedCount: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenSidebar,
  onOpenAuth,
  user,
  userName,
  theme,
  onToggleTheme,
  onSelectView,
  onSignOut,
  watchedCount,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header id="mobile-header" className={isScrolled ? 'scrolled' : ''}>
      {/* Left: Hamburger Drawer Menu (36x36px) */}
      <button className="menu-btn" onClick={onOpenSidebar} aria-label="Open navigation menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

      {/* Center: Redesigned Floating Brand Identity */}
      <div
        className="mobile-logo"
        style={{ cursor: 'pointer' }}
        onClick={() => {
          onSelectView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <div className="brand-logo-pill">
          <img
            src="/favicon.svg"
            alt="stutosed"
            width={20}
            height={20}
            style={{ display: 'block', flexShrink: 0 }}
          />
          <span style={{ fontFamily: 'var(--font-brand)', fontWeight: 700, letterSpacing: '-0.3px' }}>stutosed</span>
        </div>
      </div>

      {/* Right: Profile Avatar & Dropdown Menu */}
      <div style={{ flexShrink: 0 }}>
        <ProfileMenu
          user={user}
          userName={userName}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onSelectView={onSelectView}
          onOpenAuth={onOpenAuth}
          onSignOut={onSignOut}
          watchedCount={watchedCount}
        />
      </div>

      <style>{`
        .brand-logo-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--r-pill);
          background: var(--bg-card-subtle);
          border: 1px solid var(--border);
          box-shadow: var(--sh-card);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease;
        }
        .brand-logo-pill:hover {
          transform: scale(1.03);
          border-color: var(--accent);
        }
      `}</style>
    </header>
  );
};
