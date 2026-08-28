'use client';

import React from 'react';
import { Home, BookOpen, Moon, Sun, User, HelpCircle, GraduationCap, Landmark, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UserProfile } from '@/types';
import { getInitials, getAvatarGradient } from '@/components/ProfileMenu';

export type AppView = 'home' | 'courses' | 'gov-exams' | 'beu-engineering' | 'profile' | 'help';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  watchedCount: number;
  totalVideos: number;
  user: UserProfile | null;
  userName: string;
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  watchedCount,
  totalVideos,
  user,
  userName,
  activeView,
  onSelectView,
  onOpenAuth,
}) => {
  const pct = Math.min(Math.round((watchedCount / (totalVideos || 1)) * 100), 100);

  const handleNav = (view: AppView) => {
    onSelectView(view);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const initials = getInitials(userName);
  const avatarBg = getAvatarGradient(userName);

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          className="active"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside id="sidebar-nav" className={isOpen ? 'active' : ''}>
        {/* Brand Header */}
        <div
          className="sidebar-brand"
          onClick={() => handleNav('home')}
          style={{ cursor: 'pointer' }}
        >
          <svg
            className="brand-spike"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3.5" fill="currentColor" />
            <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="0.8" />
            <path d="M12 3.5V1M12 20.5v2.5M3.5 12H1M20.5 12h2.5M6 6L4 4M18 18l2 2M6 18l-2 2M18 6l2-2" />
          </svg>
          <span className="brand-text" style={{ fontFamily: 'var(--font-brand)', fontWeight: 700, letterSpacing: '-0.3px' }}>
            stutosed
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-links" aria-label="Main Navigation">
          <button
            onClick={() => handleNav('home')}
            className={`nav-link ${activeView === 'home' ? 'active' : ''}`}
          >
            <Home width={18} height={18} strokeWidth={2} />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleNav('gov-exams')}
            className={`nav-link ${activeView === 'gov-exams' ? 'active' : ''}`}
          >
            <Landmark width={18} height={18} strokeWidth={2} style={{ color: activeView === 'gov-exams' ? 'var(--accent)' : 'var(--govt-indigo)' }} />
            <span>Govt Exams</span>
          </button>

          <button
            onClick={() => handleNav('beu-engineering')}
            className={`nav-link ${activeView === 'beu-engineering' ? 'active' : ''}`}
          >
            <GraduationCap width={18} height={18} strokeWidth={2} style={{ color: activeView === 'beu-engineering' ? 'var(--accent)' : 'var(--beu-blue)' }} />
            <span>BEU Engineering</span>
          </button>

          <button
            onClick={() => handleNav('courses')}
            className={`nav-link ${activeView === 'courses' ? 'active' : ''}`}
          >
            <BookOpen width={18} height={18} strokeWidth={2} />
            <span>All Courses</span>
          </button>

          <button
            onClick={() => handleNav('profile')}
            className={`nav-link ${activeView === 'profile' ? 'active' : ''}`}
          >
            <User width={18} height={18} strokeWidth={2} />
            <span>Profile</span>
          </button>

          <button
            onClick={() => handleNav('help')}
            className={`nav-link ${activeView === 'help' ? 'active' : ''}`}
          >
            <HelpCircle width={18} height={18} strokeWidth={2} />
            <span>Help & Community</span>
          </button>
        </nav>

        {/* Sidebar Learning Progress Box */}
        <div
          style={{
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: 'var(--sh-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 width={15} height={15} style={{ color: 'var(--green)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Your Progress</span>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 700 }}>{pct}%</span>
          </div>

          {/* Slim animated progress track */}
          <div
            style={{
              height: '6px',
              background: 'var(--border)',
              borderRadius: 'var(--r-pill)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent) 0%, var(--green) 100%)',
                borderRadius: 'var(--r-pill)',
                transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px', color: 'var(--text-dim)' }}>
            <span>{watchedCount} Classes</span>
            <span>{totalVideos} Total</span>
          </div>
        </div>

        {/* Bottom toolbar with light/dark theme switch & Account */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title="Toggle Light / Dark Theme"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {theme === 'light' ? (
                <Sun width={17} height={17} strokeWidth={2} style={{ color: 'var(--orange)' }} />
              ) : (
                <Moon width={17} height={17} strokeWidth={2} style={{ color: 'var(--accent)' }} />
              )}
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{theme === 'light' ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
              Active
            </span>
          </button>

          <button
            onClick={() => {
              if (!user) {
                onOpenAuth();
              } else {
                handleNav('profile');
              }
            }}
            className="theme-toggle-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              {user?.avatar_url && user.avatar_url !== '/profile_icon.jpg' ? (
                <img
                  src={user.avatar_url}
                  alt={userName}
                  style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--accent)' }}
                />
              ) : user ? (
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: avatarBg,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {initials}
                </div>
              ) : (
                <User width={17} height={17} strokeWidth={2} style={{ color: 'var(--accent)' }} />
              )}
              <span style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user ? userName : 'Sign In'}
              </span>
            </div>
            {!user && (
              <Sparkles width={14} height={14} style={{ color: 'var(--accent)' }} />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
