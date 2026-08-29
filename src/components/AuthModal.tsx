'use client';

import React, { useState, useMemo } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSignOut: () => void;
  isCompulsory?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignOut,
  isCompulsory = false,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score === 2 || score === 3) return { score: 2, label: 'Medium', color: '#f59e0b' };
    return { score: 3, label: 'Strong', color: '#22c55e' };
  }, [password]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
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

    // Validation
    if (isSignUp) {
      if (!fullName.trim()) {
        setMessage({ text: 'Please enter your Full Name', type: 'error' });
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setMessage({ text: 'Password must be at least 8 characters', type: 'error' });
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setMessage({ text: 'Passwords do not match', type: 'error' });
        setLoading(false);
        return;
      }
    }

    try {
      const supabase = createClient();
      if (isSignUp) {
        const cleanName = fullName.trim();
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: cleanName,
              display_name: cleanName,
            },
          },
        });
        if (error) throw error;
        try {
          localStorage.setItem('stutosed_user_name', cleanName);
        } catch {}
        setMessage({ text: 'Account created! Please check your email to confirm or sign in.', type: 'success' });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        if (data?.user?.user_metadata?.full_name) {
          try {
            localStorage.setItem('stutosed_user_name', data.user.user_metadata.full_name);
          } catch {}
        }
        setMessage({ text: 'Welcome back! Signed in successfully.', type: 'success' });
        setTimeout(() => onClose(), 600);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Authentication failed. Please try again.', type: 'error' });
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
        background: 'rgba(18, 17, 16, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'authFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      onClick={(e) => {
        // If not compulsory, allow clicking outside to close
        if (!isCompulsory && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-2xl)',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Decorative Brand Gradient Bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--accent), var(--beu-blue), var(--govt-indigo))' }} />

        {/* Close Button (only if not strictly compulsory login) */}
        {!isCompulsory && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
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
        )}

        <div style={{ padding: '32px 28px 24px' }}>
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(204, 120, 92, 0.2) 0%, rgba(204, 120, 92, 0.05) 70%, transparent 100%)',
                border: '1.5px solid rgba(204, 120, 92, 0.35)',
                color: 'var(--accent)',
                marginBottom: '12px',
                position: 'relative',
                boxShadow: '0 0 24px rgba(204, 120, 92, 0.25)',
              }}
            >
              <svg viewBox="0 0 48 48" width="38" height="38" fill="none">
                <g style={{ transformOrigin: '24px 24px', animation: 'spinRays 20s linear infinite' }}>
                  <line x1="24" y1="3" x2="24" y2="8" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="24" y1="40" x2="24" y2="45" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="3" y1="24" x2="8" y2="24" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="40" y1="24" x2="45" y2="24" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="9" y1="9" x2="13" y2="13" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="35" y1="35" x2="39" y2="39" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="9" y1="39" x2="13" y2="35" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                  <line x1="35" y1="13" x2="39" y2="9" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                </g>
                <circle cx="24" cy="24" r="14" stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.6" />
                <circle cx="24" cy="24" r="7" fill="var(--accent)" />
                <circle cx="24" cy="24" r="2.5" fill="#ffffff" />
              </svg>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '23px',
                fontWeight: 700,
                color: 'var(--text)',
                margin: '0 0 4px',
                letterSpacing: '-0.3px',
              }}
            >
              {user ? 'Your Student Account' : isSignUp ? 'Create Student Account' : 'Sign In to stutosed'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              {user
                ? 'Your learning progress is synced with your account.'
                : 'Free & permanent access to all courses, lectures & PDF notes.'}
            </p>
          </div>

          {/* Feedback Banner */}
          {message && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--r-md)',
                fontSize: '12px',
                fontWeight: 500,
                marginBottom: '16px',
                background: message.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                color: message.type === 'error' ? '#ef4444' : '#22c55e',
                border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
              }}
            >
              {message.type === 'error' ? (
                <AlertCircle width={16} height={16} style={{ flexShrink: 0 }} />
              ) : (
                <CheckCircle2 width={16} height={16} style={{ flexShrink: 0 }} />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {user ? (
            /* Logged In View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <div
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent) 0%, #e08264 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 700,
                  }}
                >
                  {user.full_name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
                    {user.full_name || 'Student'}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--green)', fontWeight: 600 }}>
                    <ShieldCheck width={13} height={13} />
                    <span>Cloud Progress Synced</span>
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
                  padding: '11px',
                  borderRadius: 'var(--r-md)',
                  background: 'rgba(239,68,68,0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.2)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            /* Auth Form (Google & Email/Password) */
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
                  padding: '12px 16px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: 'var(--sh-card)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="google-signin-btn"
              >
                <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Clean Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
                  or continue with email
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Full Name Field (Sign Up Only) */}
                {isSignUp && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Full Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User width={15} height={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Advik"
                        className="auth-input-field"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail width={15} height={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="advik@stutosed.com"
                      className="auth-input-field"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock width={15} height={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
                      className="auth-input-field"
                      style={{ paddingRight: '36px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff width={15} height={15} /> : <Eye width={15} height={15} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator (Sign Up Only) */}
                  {isSignUp && password && (
                    <div style={{ marginTop: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Password Strength:</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: passwordStrength.color }}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--border)', borderRadius: 'var(--r-pill)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${(passwordStrength.score / 3) * 100}%`,
                            background: passwordStrength.color,
                            transition: 'all 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field (Sign Up Only) */}
                {isSignUp && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Confirm Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock width={15} height={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="auth-input-field"
                        style={{ paddingRight: '36px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff width={15} height={15} /> : <Eye width={15} height={15} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--accent)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '6px',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: '0 4px 16px var(--accent-glow)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="auth-submit-btn"
                >
                  {loading ? 'Processing…' : isSignUp ? 'Create Free Account' : 'Sign In'}
                </button>
              </form>

              {/* Bottom Toggle Between Sign In & Sign Up (Zero Guest Mode) */}
              <div
                style={{
                  textAlign: 'center',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  {isSignUp ? 'Already have an account? ' : 'New to stutosed? '}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setMessage(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  {isSignUp ? 'Sign In' : 'Create an Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes authFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes spinRays {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .auth-input-field {
          width: 100%;
          height: 42px;
          padding: 10px 14px 10px 36px;
          border-radius: var(--r-md);
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 14px;
          font-family: var(--font-sans);
          outline: none;
          transition: all 0.2s ease;
        }
        .auth-input-field:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(204, 120, 92, 0.15);
        }
        .google-signin-btn:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-hover);
          transform: translateY(-1px);
        }
        .auth-submit-btn:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
        }
        .auth-submit-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
};
