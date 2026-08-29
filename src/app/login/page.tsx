'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { getAvatarGradient, getInitials } from '@/components/ProfileMenu';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score === 2 || score === 3) return { score: 2, label: 'Medium', color: '#f59e0b' };
    return { score: 3, label: 'Strong', color: '#22c55e' };
  }, [password]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: any) => {
      if (data?.user) {
        const name = data.user.user_metadata?.full_name || localStorage.getItem('stutosed_user_name') || 'Student';
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          full_name: name,
          avatar_url: data.user.user_metadata?.avatar_url || '/profile_icon.jpg',
        });
      }
    });
  }, []);

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
        setMessage({ text: error.message, type: 'error' });
      }
    } catch (e: any) {
      setMessage({ text: e.message || 'Supabase authentication error.', type: 'error' });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isSignUp) {
      if (!fullName.trim()) {
        setMessage({ text: 'Please enter your Full Name', type: 'error' });
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
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
        router.push('/');
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Authentication failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setMessage({ text: 'Signed out successfully.', type: 'success' });
  };

  const userName = user?.full_name || 'Student';
  const initials = getInitials(userName);
  const avatarBg = getAvatarGradient(userName);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-2xl)', padding: '36px 32px', boxShadow: 'var(--sh-card)' }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text)', marginBottom: '16px' }}>
            <svg
              className="brand-spike"
              viewBox="0 0 24 24"
              width="32"
              height="32"
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
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}>stutosed</span>
          </Link>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '4px 0' }}>
            {user ? 'Your Account' : isSignUp ? 'Create Student Account' : 'Sign In to stutosed'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {user ? 'Manage your synced progress' : 'Compulsory login to access courses, videos & PDF notes.'}
          </p>
        </div>

        {message && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--r-md)',
              fontSize: '12px',
              marginBottom: '16px',
              background: message.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
              color: message.type === 'error' ? '#ef4444' : '#22c55e',
              border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
            }}
          >
            {message.type === 'error' ? <AlertCircle width={16} height={16} /> : <CheckCircle2 width={16} height={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: avatarBg,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 700,
                border: '2px solid var(--accent)',
              }}
            >
              {initials}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text)' }}>{userName}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--green)', marginTop: '2px', fontWeight: 600 }}>
                <ShieldCheck width={13} height={13} />
                <span>Cloud Progress Synced</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-md)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 600, cursor: 'pointer', marginTop: '12px' }}
            >
              Sign Out
            </button>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              <span>Return to Courses</span>
              <ArrowRight width={14} height={14} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
            >
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
                or continue with email
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                      style={{ width: '100%', height: '42px', padding: '10px 14px 10px 36px', borderRadius: 'var(--r-md)', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                </div>
              )}

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
                    style={{ width: '100%', height: '42px', padding: '10px 14px 10px 36px', borderRadius: 'var(--r-md)', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

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
                    style={{ width: '100%', height: '42px', padding: '10px 36px 10px 36px', borderRadius: 'var(--r-md)', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff width={15} height={15} /> : <Eye width={15} height={15} />}
                  </button>
                </div>

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
                      style={{ width: '100%', height: '42px', padding: '10px 36px 10px 36px', borderRadius: 'var(--r-md)', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff width={15} height={15} /> : <Eye width={15} height={15} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-md)', background: 'var(--accent)', color: '#ffffff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', marginTop: '6px', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px var(--accent-glow)' }}
              >
                {loading ? 'Processing…' : isSignUp ? 'Create Free Account' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', paddingTop: '14px', borderTop: '1px solid var(--border)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {isSignUp ? 'Already have an account? ' : 'New to stutosed? '}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage(null);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                {isSignUp ? 'Sign In' : 'Create an Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
