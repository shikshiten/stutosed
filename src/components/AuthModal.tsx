'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, UserCheck, Sparkles, LogIn, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSignOut: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignOut,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setMessage({ text: error.message || 'Google Auth failed', type: 'error' });
      }
    } catch (e: any) {
      setMessage({ text: e?.message || 'Authentication error', type: 'error' });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ text: 'Account created! Please check your email to confirm.', type: 'success' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ text: 'Signed in successfully!', type: 'success' });
        setTimeout(() => onClose(), 700);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Authentication failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Decorative Border */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--accent), #e8a55a)' }} />

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
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
          <X width={18} height={18} />
        </button>

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Brand Header with Animated Original Celestial Logo */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div
              className="auth-animated-brand-logo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(204, 120, 92, 0.2) 0%, rgba(204, 120, 92, 0.05) 70%, transparent 100%)',
                border: '1.5px solid rgba(204, 120, 92, 0.35)',
                color: 'var(--accent)',
                marginBottom: '14px',
                position: 'relative',
                boxShadow: '0 0 24px rgba(204, 120, 92, 0.25)',
                animation: 'brandBadgeFloat 4s ease-in-out infinite alternate',
              }}
            >
              <svg
                viewBox="0 0 48 48"
                width="40"
                height="40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Rotating Outer Rays */}
                <g style={{ transformOrigin: '24px 24px', animation: 'spinRays 16s linear infinite' }}>
                  <line x1="24" y1="2" x2="24" y2="7" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
                  <line x1="24" y1="41" x2="24" y2="46" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
                  <line x1="2" y1="24" x2="7" y2="24" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
                  <line x1="41" y1="24" x2="46" y2="24" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
                  <line x1="8.5" y1="8.5" x2="12.5" y2="12.5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
                  <line x1="35.5" y1="35.5" x2="39.5" y2="39.5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
                  <line x1="8.5" y1="39.5" x2="12.5" y2="35.5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
                  <line x1="35.5" y1="12.5" x2="39.5" y2="8.5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
                </g>

                {/* Counter-rotating Outer Orbit Ring */}
                <circle
                  cx="24"
                  cy="24"
                  r="17"
                  stroke="var(--accent)"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.6"
                  style={{ transformOrigin: '24px 24px', animation: 'spinOrbit 10s linear infinite reverse' }}
                />

                {/* Middle Ring */}
                <circle
                  cx="24"
                  cy="24"
                  r="12"
                  stroke="var(--accent)"
                  strokeWidth="1.6"
                  opacity="0.85"
                  style={{ transformOrigin: '24px 24px', animation: 'orbitPulse 3s ease-in-out infinite alternate' }}
                />

                {/* Glowing Core Sun */}
                <circle
                  cx="24"
                  cy="24"
                  r="6.5"
                  fill="var(--accent)"
                  style={{ transformOrigin: '24px 24px', animation: 'corePulse 2s ease-in-out infinite alternate' }}
                />
                <circle
                  cx="24"
                  cy="24"
                  r="2.5"
                  fill="#ffffff"
                  opacity="0.85"
                />
              </svg>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text)',
                margin: '0 0 4px',
              }}
            >
              {user ? 'Your Account' : isSignUp ? 'Create stutosed Account' : 'Welcome to stutosed'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              {user
                ? 'Manage your cloud synced progress'
                : 'Sign in to save watched classes & resume on any device.'}
            </p>
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--r-md)',
                fontSize: '12px',
                marginBottom: '16px',
                textAlign: 'center',
                background: message.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                color: message.type === 'error' ? '#ef4444' : '#22c55e',
                border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
              }}
            >
              {message.text}
            </div>
          )}

          {user ? (
            /* Logged In View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <div
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <img
                  src="/profile_icon.jpg"
                  alt=""
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }}
                />
                <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{user.full_name || 'Student'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email ? `${user.email.slice(0, 2)}••••@${user.email.split('@')[1] || 'mail.com'}` : 'Cloud Progress Synced'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--r-md)',
                  background: 'rgba(239,68,68,0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.2)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            /* Auth Options */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Google OAuth Button */}
              <button
                onClick={handleGoogleLogin}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '2px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>or email</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail width={14} height={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 34px',
                        borderRadius: 'var(--r-md)',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock width={14} height={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 34px',
                        borderRadius: 'var(--r-md)',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--accent)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '2px',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: '0 3px 12px rgba(204, 120, 92, 0.3)',
                  }}
                >
                  {loading ? 'Processing…' : isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              {/* Bottom Toggle & Guest Mode */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  {isSignUp ? 'Already have account? Sign In' : 'New? Create Account'}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <UserCheck width={14} height={14} />
                  Continue as Guest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spinRays {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbitPulse {
          0% { transform: scale(0.93); opacity: 0.7; }
          100% { transform: scale(1.07); opacity: 1; }
        }
        @keyframes corePulse {
          0% { transform: scale(0.88); filter: drop-shadow(0 0 3px var(--accent)); }
          100% { transform: scale(1.15); filter: drop-shadow(0 0 10px var(--accent)); }
        }
        @keyframes brandBadgeFloat {
          0% { transform: translateY(0) scale(1); box-shadow: 0 0 16px rgba(204, 120, 92, 0.2); }
          50% { transform: translateY(-4px) scale(1.03); box-shadow: 0 0 28px rgba(204, 120, 92, 0.45); }
          100% { transform: translateY(0) scale(1); box-shadow: 0 0 16px rgba(204, 120, 92, 0.2); }
        }
      `}</style>
    </div>
  );
};
