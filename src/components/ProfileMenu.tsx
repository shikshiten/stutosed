'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, BookOpen, CheckCircle2, HelpCircle, Moon, Sun, ChevronDown, Sparkles, ShieldCheck } from 'lucide-react';
import { UserProfile } from '@/types';
import { AppView } from '@/components/Sidebar';

interface ProfileMenuProps {
  user: UserProfile | null;
  userName: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSelectView: (view: AppView) => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  watchedCount: number;
}

// Generate consistent pleasing background gradient from user's name
export function getAvatarGradient(name: string): string {
  const gradients = [
    'linear-gradient(135deg, #cc785c 0%, #e08264 100%)',
    'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

// Get user initials (max 2 letters)
export function getInitials(name: string): string {
  if (!name) return 'S';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  user,
  userName,
  theme,
  onToggleTheme,
  onSelectView,
  onOpenAuth,
  onSignOut,
  watchedCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // If user is not logged in, trigger auth modal
  if (!user) {
    return (
      <button
        onClick={onOpenAuth}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '7px 14px',
          borderRadius: 'var(--r-pill)',
          background: 'var(--accent)',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 10px var(--accent-glow)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Sparkles width={14} height={14} />
        <span>Sign In</span>
      </button>
    );
  }

  const initials = getInitials(userName);
  const avatarBg = getAvatarGradient(userName);
  const hasAvatar = !!user.avatar_url && user.avatar_url !== '/profile_icon.jpg' && !imgError;

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User Account Menu"
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '3px 8px 3px 3px',
          borderRadius: 'var(--r-pill)',
          background: 'var(--bg-card-subtle)',
          border: isOpen ? '1px solid var(--accent)' : '1px solid var(--border)',
          color: 'var(--text)',
          cursor: 'pointer',
          boxShadow: 'var(--sh-card)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Avatar Ring */}
        {hasAvatar ? (
          <img
            src={user.avatar_url!}
            alt={userName}
            onError={() => setImgError(true)}
            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: avatarBg,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            {initials}
          </div>
        )}

        {/* User Name in Desktop Header */}
        <span
          className="header-username-label"
          style={{
            fontSize: '13px',
            fontWeight: 600,
            maxWidth: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {userName}
        </span>

        <ChevronDown
          width={13}
          height={13}
          style={{
            color: 'var(--text-dim)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Full Feature-Rich Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '235px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)',
            boxShadow: '0 12px 36px -4px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.1)',
            padding: '7px',
            zIndex: 1000,
            animation: 'dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* User Header Summary with Real Photo if available */}
          <div
            style={{
              padding: '10px 12px',
              marginBottom: '4px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {hasAvatar ? (
              <img
                src={user.avatar_url!}
                alt={userName}
                onError={() => setImgError(true)}
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid var(--accent)' }}
              />
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: avatarBg,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
            )}

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>
                <ShieldCheck width={12} height={12} />
                <span>Verified Student</span>
              </div>
            </div>
          </div>

          {/* Restored Full Suite of Action Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button
              onClick={() => {
                onSelectView('profile');
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: 'var(--r-md)',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text)',
                width: '100%',
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
              className="dropdown-menu-item"
            >
              <User width={15} height={15} style={{ color: 'var(--accent)' }} />
              <span>My Profile</span>
            </button>

            <button
              onClick={() => {
                onSelectView('profile');
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--r-md)',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text)',
                width: '100%',
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
              className="dropdown-menu-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 width={15} height={15} style={{ color: 'var(--green)' }} />
                <span>My Progress</span>
              </div>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg)', padding: '2px 6px', borderRadius: 'var(--r-sm)' }}>
                {watchedCount}
              </span>
            </button>

            <button
              onClick={() => {
                onSelectView('courses');
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: 'var(--r-md)',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text)',
                width: '100%',
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
              className="dropdown-menu-item"
            >
              <BookOpen width={15} height={15} style={{ color: 'var(--beu-blue)' }} />
              <span>Explore Courses</span>
            </button>

            <button
              onClick={() => {
                onToggleTheme();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--r-md)',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text)',
                width: '100%',
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
              className="dropdown-menu-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {theme === 'light' ? (
                  <Moon width={15} height={15} style={{ color: 'var(--accent)' }} />
                ) : (
                  <Sun width={15} height={15} style={{ color: 'var(--orange)' }} />
                )}
                <span>Theme</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', background: 'var(--bg)', padding: '1px 6px', borderRadius: 'var(--r-sm)' }}>
                {theme === 'light' ? 'Light' : 'Dark'}
              </span>
            </button>

            <button
              onClick={() => {
                onSelectView('help');
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: 'var(--r-md)',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text)',
                width: '100%',
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
              className="dropdown-menu-item"
            >
              <HelpCircle width={15} height={15} style={{ color: 'var(--govt-indigo)' }} />
              <span>Help & Community</span>
            </button>
          </div>

          <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

          {/* Sign Out Button */}
          <button
            onClick={() => {
              onSignOut();
              setIsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: 'var(--r-md)',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--red)',
              width: '100%',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
            className="dropdown-signout-item"
          >
            <LogOut width={15} height={15} />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .dropdown-menu-item:hover {
          background: var(--bg-card-hover);
        }
        .dropdown-signout-item:hover {
          background: rgba(220, 38, 38, 0.1);
        }
        @media (max-width: 600px) {
          .header-username-label {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
