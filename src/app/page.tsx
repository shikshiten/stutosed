'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, AppView } from '@/components/Sidebar';
import { MobileHeader } from '@/components/MobileHeader';
import { CourseGrid } from '@/components/CourseGrid';
import { CourseModal } from '@/components/CourseModal';
import { VideoPlayer } from '@/components/VideoPlayer';
import { AuthModal } from '@/components/AuthModal';
import { INITIAL_COURSES, getTotalStats, getCourseById } from '@/lib/coursesData';
import { Course, LectureItem, UserProfile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import {
  BookOpen,
  Send,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  User,
  ShieldCheck,
  Flame,
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Landmark,
} from 'lucide-react';

const WATCHED_KEY = 'onafbu_watched_v1';
const LAST_PLAYED_KEY = 'stutosed_last_played_v1';

export default function HomePage() {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Video Player state
  const [playerPlaylist, setPlayerPlaylist] = useState<LectureItem[] | null>(null);
  const [playerIndex, setPlayerIndex] = useState<number>(0);

  // Auth & Watched state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userName, setUserName] = useState<string>('Student');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [watchedUrls, setWatchedUrls] = useState<Set<string>>(new Set());

  // Last Played / Resume Memory
  const [lastPlayed, setLastPlayed] = useState<{
    courseId: string;
    courseName: string;
    courseThumb: string;
    lectureTitle: string;
    url: string;
    timestamp: number;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Initial load: Theme, Watched URLs, Avatar, and Last Played from localStorage
  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem('stutosed-theme') as 'light' | 'dark') || 'light';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);

      const savedWatched = JSON.parse(localStorage.getItem(WATCHED_KEY) || '{}');
      setWatchedUrls(new Set(Object.keys(savedWatched)));

      const savedName = localStorage.getItem('stutosed_user_name');
      if (savedName) setUserName(savedName);

      const savedLast = localStorage.getItem(LAST_PLAYED_KEY);
      if (savedLast) {
        setLastPlayed(JSON.parse(savedLast));
      }

      // First-time visitor prompt
      const hasVisited = localStorage.getItem('stutosed_visited_v1');
      if (!hasVisited) {
        setTimeout(() => {
          setIsAuthOpen(true);
        }, 600);
      }
    } catch {}
  }, []);

  // Supabase User Auth listener
  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }: any) => {
        if (data?.user) {
          const name = data.user.user_metadata?.full_name || localStorage.getItem('stutosed_user_name') || data.user.email?.split('@')[0] || 'Student';
          setUserName(name);
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            full_name: name,
            avatar_url: '/profile_icon.jpg',
          });
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_: any, session: any) => {
        if (session?.user) {
          const name = session.user.user_metadata?.full_name || localStorage.getItem('stutosed_user_name') || session.user.email?.split('@')[0] || 'Student';
          setUserName(name);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: name,
            avatar_url: '/profile_icon.jpg',
          });
        } else {
          setUser(null);
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe?.();
      };
    } catch {}
  }, []);

  // Mobile Back Button / Layered History Management
  useEffect(() => {
    const handlePopState = () => {
      // Layer 1: If Video Player is open, close it first
      if (playerPlaylist) {
        setPlayerPlaylist(null);
        return;
      }
      // Layer 2: If Course Modal is open, close it next
      if (selectedCourse) {
        setSelectedCourse(null);
        return;
      }
      // Layer 3: If in a sub-view (courses, profile, help), return to home
      if (activeView !== 'home') {
        setActiveView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [playerPlaylist, selectedCourse, activeView]);

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('stutosed-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Mark URL as watched
  const handleMarkWatched = (url: string) => {
    setWatchedUrls((prev) => {
      const next = new Set(prev);
      next.add(url);

      try {
        const savedWatched = JSON.parse(localStorage.getItem(WATCHED_KEY) || '{}');
        savedWatched[url] = Date.now();
        localStorage.setItem(WATCHED_KEY, JSON.stringify(savedWatched));
      } catch {}

      return next;
    });
  };

  // Open Course Modal with history state push
  const handleOpenCourse = (course: Course) => {
    window.history.pushState({ modal: 'course', courseId: course.id }, '');
    setSelectedCourse(course);
  };

  // Open Video Player with history state push and record last played
  const handlePlayVideo = (playlist: LectureItem[], index: number) => {
    window.history.pushState({ modal: 'player', index }, '');
    setPlayerPlaylist(playlist);
    setPlayerIndex(index);

    const current = playlist[index];
    if (current?.url) {
      handleMarkWatched(current.url);
      if (selectedCourse) {
        const memoryObj = {
          courseId: selectedCourse.id,
          courseName: selectedCourse.name,
          courseThumb: selectedCourse.thumb,
          lectureTitle: current.label,
          url: current.url,
          timestamp: Date.now(),
        };
        setLastPlayed(memoryObj);
        try {
          localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(memoryObj));
        } catch {}
      }
    }
  };

  // Resume last played lecture
  const handleResumeLastPlayed = () => {
    if (!lastPlayed) return;
    const course = getCourseById(lastPlayed.courseId);
    if (!course) return;

    // Find the lecture item in the course
    let targetList: LectureItem[] = [];
    let targetIdx = 0;

    if (course.tabs) {
      for (const tab of course.tabs) {
        const idx = tab.items.findIndex((i) => i.url === lastPlayed.url);
        if (idx !== -1) {
          targetList = tab.items;
          targetIdx = idx;
          break;
        }
      }
    }

    if (targetList.length === 0 && course.tabs?.[0]?.items) {
      targetList = course.tabs[0].items;
      targetIdx = 0;
    }

    setSelectedCourse(course);
    handlePlayVideo(targetList, targetIdx);
  };

  // Open PDF
  const handleOpenPdf = (url: string) => {
    handleMarkWatched(url);
    window.open(url, '_blank');
  };

  const stats = getTotalStats();

  return (
    <div>
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        watchedCount={watchedUrls.size}
        totalVideos={stats.totalVideos}
        user={user}
        activeView={activeView}
        onSelectView={(v) => {
          window.history.pushState({ view: v }, '');
          setActiveView(v);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Layout */}
      <div id="main-content-layout">
        {/* Mobile Header */}
        <MobileHeader
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          user={user}
          onSelectHome={() => {
            window.history.pushState({ view: 'home' }, '');
            setActiveView('home');
            setSelectedCourse(null);
            setPlayerPlaylist(null);
          }}
        />

        {/* ============================================================
            VIEW 1: HOME VIEW (Dashboard with Resume Card & Quick Links)
            ============================================================ */}
        {activeView === 'home' && (
          <div className="animate-fade-in">
            {/* HERO SECTION */}
            <section id="hero">
              <div className="hero-ambient"></div>
              <div className="hero-content">
                <div className="hero-eyebrow">
                  <span className="eyebrow-dot"></span>
                  Your Complete Study Companion
                </div>
                <h1 className="hero-title" style={{ fontFamily: 'var(--font-display)' }}>
                  Study Smart.<br />
                  Score <span className="hero-accent">Higher.</span>
                </h1>
                <p className="hero-lead">
                  All your SSC & B.Tech lectures, notes and resources — organized in one secure place.
                </p>

                <div className="hero-actions">
                  <button
                    className="btn-primary"
                    onClick={() => {
                      const el = document.getElementById('explore-categories');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        window.history.pushState({ view: 'courses' }, '');
                        setActiveView('courses');
                      }
                    }}
                  >
                    <BookOpen width={16} height={16} />
                    Explore Courses
                  </button>

                  <button
                    className="btn-ghost"
                    onClick={() => {
                      window.history.pushState({ view: 'help' }, '');
                      setActiveView('help');
                    }}
                  >
                    <HelpCircle width={16} height={16} />
                    Help & Support
                  </button>
                </div>

                <div className="hero-stats" id="hero-stats">
                  <div className="hero-stat">
                    <div className="stat-num">{stats.totalVideos.toLocaleString()}+</div>
                    <div className="stat-label">Video Lectures</div>
                  </div>
                  <div className="hero-stat-divider"></div>
                  <div className="hero-stat">
                    <div className="stat-num">{stats.totalPDFs.toLocaleString()}+</div>
                    <div className="stat-label">Resources</div>
                  </div>
                  <div className="hero-stat-divider"></div>
                  <div className="hero-stat">
                    <div className="stat-num">{stats.totalCourses}</div>
                    <div className="stat-label">Courses</div>
                  </div>
                  <div className="hero-stat-divider"></div>
                  <div className="hero-stat">
                    <div className="stat-num">{watchedUrls.size}</div>
                    <div className="stat-label">Watched</div>
                  </div>
                </div>
              </div>
            </section>

            {/* CONTINUE WATCHING / RECENTLY OPENED SECTION */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flame width={20} height={20} color="var(--accent)" />
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                    Continue Learning
                  </h2>
                </div>

                <button
                  onClick={() => {
                    window.history.pushState({ view: 'courses' }, '');
                    setActiveView('courses');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  All Courses <ArrowRight width={14} height={14} />
                </button>
              </div>

              {lastPlayed ? (
                /* Last Played Course Card */
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-lg)',
                    padding: '20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px',
                    boxShadow: 'var(--sh-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '260px' }}>
                    <img
                      src={lastPlayed.courseThumb}
                      alt=""
                      style={{ width: '84px', height: '56px', borderRadius: 'var(--r-md)', objectFit: 'cover', border: '1px solid var(--border)' }}
                    />
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.5px' }}>
                        {lastPlayed.courseName.replace(/PARMAR GK 3\.0/g, 'Parmar GK 3.0').replace(/\s*RATNA\s*/gi, ' ').trim()}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: '2px 0' }}>
                        {lastPlayed.lectureTitle.replace(/\s*RATNA\s*/gi, ' ').trim()}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Last studied recently • Click to resume
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleResumeLastPlayed}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      background: 'var(--accent)',
                      color: '#ffffff',
                      borderRadius: 'var(--r-pill)',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(204,120,92,0.3)',
                    }}
                  >
                    <Play width={14} height={14} fill="#fff" />
                    Resume Lecture
                  </button>
                </div>
              ) : (
                /* Empty state when no lecture played yet */
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--r-lg)',
                    padding: '32px 20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📖</div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>
                    Ready to start learning?
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                    Explore our course catalog and pick a lecture to begin.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      const el = document.getElementById('explore-categories');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      else {
                        window.history.pushState({ view: 'courses' }, '');
                        setActiveView('courses');
                      }
                    }}
                    style={{ padding: '8px 18px', fontSize: '12px' }}
                  >
                    Browse Categories ↓
                  </button>
                </div>
              )}
            </div>

            {/* DEDICATED TWO CORE STUDY DOMAINS / PORTALS */}
            <div id="explore-categories" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 36px' }}>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontWeight: 700 }}>
                  Curated Learning Tracks
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, margin: '2px 0 0', color: 'var(--text)' }}>
                  Explore Course Sections
                </h2>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '20px',
                }}
              >
                {/* Domain Card 1: Government Exam Prep */}
                <div
                  onClick={() => {
                    window.history.pushState({ view: 'gov-exams' }, '');
                    setActiveView('gov-exams');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="domain-portal-card"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-xl)',
                    padding: '24px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'var(--sh-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: 'var(--r-lg)',
                        background: 'rgba(204,120,92,0.15)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '26px',
                      }}
                    >
                      🏛️
                    </div>
                    <span
                      style={{
                        background: 'rgba(204,120,92,0.12)',
                        color: 'var(--accent)',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 'var(--r-pill)',
                        border: '1px solid rgba(204,120,92,0.25)',
                      }}
                    >
                      9 Batches • 1,400+ Classes
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
                    Government Exam Section
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 18px' }}>
                    Complete preparation for SSC CGL, CHSL, MTS, Railway & State exams with Parmar GK 3.0, Static GK, Maths, Reasoning & English.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>SSC</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>General Studies</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Aptitude</span>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
                      <span>Explore Govt Exams</span> →
                    </div>
                  </div>
                </div>

                {/* Domain Card 2: Bihar Engineering University (BEU) */}
                <div
                  onClick={() => {
                    window.history.pushState({ view: 'beu-engineering' }, '');
                    setActiveView('beu-engineering');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="domain-portal-card"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-xl)',
                    padding: '24px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'var(--sh-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: 'var(--r-lg)',
                        background: 'rgba(59,130,246,0.15)',
                        color: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '26px',
                      }}
                    >
                      🎓
                    </div>
                    <span
                      style={{
                        background: 'rgba(59,130,246,0.12)',
                        color: '#3b82f6',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 'var(--r-pill)',
                        border: '1px solid rgba(59,130,246,0.25)',
                      }}
                    >
                      1st Sem Live • 45 Lectures
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
                    Bihar Engineering University (BEU)
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 18px' }}>
                    Curriculum-aligned B.Tech semester courses featuring Engineering Chemistry, Technical Sciences, module-wise tabs & resources.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>B.Tech</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>1st Year</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Engineering</span>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#3b82f6' }}>
                      <span>Explore BEU Courses</span> →
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* REDESIGNED HELP & COMMUNITY BOX */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 60px' }}>
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-xl)',
                  padding: '32px 24px',
                  textAlign: 'center',
                  boxShadow: 'var(--sh-card)',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(204,120,92,0.12)', color: 'var(--accent)', marginBottom: '12px' }}>
                  <HelpCircle width={28} height={28} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
                  Need Help or Have Questions?
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                  Get direct support for lecture queries, study material issues, or course updates via our official community channels.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
                  {/* Telegram Channel Pill */}
                  <a
                    href="https://t.me/stutosed"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 22px',
                      borderRadius: 'var(--r-pill)',
                      background: '#229ED9',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      boxShadow: '0 3px 10px rgba(34,158,217,0.3)',
                    }}
                  >
                    <Send width={15} height={15} />
                    Telegram Channel
                  </a>

                  {/* Developer DM Pill */}
                  <a
                    href="https://t.me/bookwormislie"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 22px',
                      borderRadius: 'var(--r-pill)',
                      background: 'var(--accent)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      boxShadow: '0 3px 10px rgba(204,120,92,0.3)',
                    }}
                  >
                    <MessageSquare width={15} height={15} />
                    Contact Developer
                  </a>

                  {/* Discord Pill */}
                  <button
                    onClick={() => alert('Discord server invite will be added soon! Join our Telegram channel in the meantime.')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 22px',
                      borderRadius: 'var(--r-pill)',
                      background: '#5865F2',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 3px 10px rgba(88,101,242,0.3)',
                    }}
                  >
                    <ExternalLink width={15} height={15} />
                    Discord Community
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            VIEW 2A: GOVERNMENT EXAM PREP VIEW (Dedicated Domain)
            ============================================================ */}
        {activeView === 'gov-exams' && (
          <div className="animate-fade-in" style={{ padding: '24px 0 60px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <button
                  onClick={() => {
                    window.history.pushState({ view: 'home' }, '');
                    setActiveView('home');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ← Home
                </button>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Government Exams</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ fontSize: '24px' }}>🏛️</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  Government Exam Prep
                </h1>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                Comprehensive syllabus courses for SSC CGL, CHSL, MTS, Railway, and State Government examinations.
              </p>
            </div>

            <CourseGrid
              courses={INITIAL_COURSES.filter((c) => c.id !== 'beu-1st-year')}
              onSelectCourse={(course) => handleOpenCourse(course)}
              searchInputRef={searchInputRef}
            />
          </div>
        )}

        {/* ============================================================
            VIEW 2B: BIHAR ENGINEERING UNIVERSITY (BEU) VIEW (Dedicated Domain)
            ============================================================ */}
        {activeView === 'beu-engineering' && (
          <div className="animate-fade-in" style={{ padding: '24px 0 60px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <button
                  onClick={() => {
                    window.history.pushState({ view: 'home' }, '');
                    setActiveView('home');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ← Home
                </button>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>BEU Engineering</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ fontSize: '24px' }}>🎓</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  Bihar Engineering University (BEU)
                </h1>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                Syllabus-aligned B.Tech engineering semester courses, subject folders, and technical science lectures.
              </p>
            </div>

            <CourseGrid
              courses={INITIAL_COURSES.filter((c) => c.id === 'beu-1st-year')}
              onSelectCourse={(course) => handleOpenCourse(course)}
              searchInputRef={searchInputRef}
            />
          </div>
        )}

        {/* ============================================================
            VIEW 2C: ALL COURSES CATALOG VIEW (Dedicated full-page courses)
            ============================================================ */}
        {activeView === 'courses' && (
          <div className="animate-fade-in" style={{ padding: '24px 0 60px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <BookOpen width={24} height={24} color="var(--accent)" />
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  All Course Catalog
                </h1>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                Explore all courses across Government Exam preparation and Bihar Engineering University.
              </p>
            </div>

            <CourseGrid
              courses={INITIAL_COURSES}
              onSelectCourse={(course) => handleOpenCourse(course)}
              searchInputRef={searchInputRef}
            />
          </div>
        )}

        {/* ============================================================
            VIEW 3: PROFILE & AVATAR VIEW
            ============================================================ */}
        {activeView === 'profile' && (
          <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px 60px' }}>
            {/* USER OVERVIEW CARD */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-xl)',
                padding: '28px',
                marginBottom: '24px',
                boxShadow: 'var(--sh-card)',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                flexWrap: 'wrap',
              }}
            >
              <img
                src="/profile_icon.jpg"
                alt="Profile"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  border: '3px solid var(--accent)',
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontWeight: 700, marginBottom: '4px' }}>
                  {user ? 'Verified Account' : 'Student Account'}
                </div>

                {isEditingName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Enter your name"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--r-md)',
                        background: 'var(--bg)',
                        border: '1px solid var(--accent)',
                        color: 'var(--text)',
                        fontSize: '15px',
                        fontWeight: 700,
                        outline: 'none',
                        maxWidth: '220px',
                      }}
                      autoFocus
                    />
                    <button
                      onClick={async () => {
                        if (!nameInput.trim()) return;
                        const newName = nameInput.trim();
                        setUserName(newName);
                        try {
                          localStorage.setItem('stutosed_user_name', newName);
                          if (user) {
                            setUser({ ...user, full_name: newName });
                            const supabase = createClient();
                            await supabase.auth.updateUser({ data: { full_name: newName } });
                          }
                        } catch {}
                        setIsEditingName(false);
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--r-md)',
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--r-md)',
                        background: 'none',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '2px 0 6px' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                      {userName}
                    </h2>
                    <button
                      onClick={() => {
                        setNameInput(userName);
                        setIsEditingName(true);
                      }}
                      style={{
                        background: 'rgba(204,120,92,0.1)',
                        border: '1px solid rgba(204,120,92,0.2)',
                        color: 'var(--accent)',
                        borderRadius: 'var(--r-pill)',
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      Edit Name ✏️
                    </button>
                  </div>
                )}

                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {user ? 'Cloud Progress Sync Active' : 'Progress saved locally in browser'}
                </div>
              </div>

              <div>
                {user ? (
                  <button
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      setUser(null);
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 'var(--r-md)',
                      background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.2)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="btn-primary"
                    style={{ padding: '8px 18px', fontSize: '12px' }}
                  >
                    Sign In to Sync
                  </button>
                )}
              </div>
            </div>

            {/* WATCH STATS & SYNC DETAILS */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)',
                padding: '24px',
                boxShadow: 'var(--sh-card)',
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>
                Learning Progress
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--bg)', padding: '14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent)' }}>{watchedUrls.size}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Classes Watched</div>
                </div>

                <div style={{ background: 'var(--bg)', padding: '14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>{stats.totalVideos}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Classes Available</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Want to reset watched markers?</span>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear your watched classes history?')) {
                      localStorage.removeItem(WATCHED_KEY);
                      setWatchedUrls(new Set());
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Clear History
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            VIEW 4: HELP & CONTACT VIEW (Dedicated)
            ============================================================ */}
        {activeView === 'help' && (
          <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px 60px' }}>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-xl)',
                padding: '36px 28px',
                textAlign: 'center',
                boxShadow: 'var(--sh-card)',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(204,120,92,0.12)', color: 'var(--accent)', marginBottom: '14px' }}>
                <HelpCircle width={32} height={32} />
              </div>

              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
                Help & Contact Us
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                Get direct assistance for lecture queries, resource requests, study materials, or technical support.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '420px', margin: '0 auto' }}>
                {/* Official Telegram Channel */}
                <a
                  href="https://t.me/stutosed"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderRadius: 'var(--r-pill)',
                    background: '#229ED9',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(34,158,217,0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Send width={18} height={18} />
                    <span>Official Telegram Channel</span>
                  </div>
                  <ArrowRight width={16} height={16} />
                </a>

                {/* Contact Developer DM */}
                <a
                  href="https://t.me/bookwormislie"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderRadius: 'var(--r-pill)',
                    background: 'var(--accent)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(204,120,92,0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageSquare width={18} height={18} />
                    <span>Contact Developer (@bookwormislie)</span>
                  </div>
                  <ArrowRight width={16} height={16} />
                </a>

                {/* Discord Community */}
                <button
                  onClick={() => alert('Discord server link will be updated shortly! Please connect via our Telegram channel.')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderRadius: 'var(--r-pill)',
                    background: '#5865F2',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(88,101,242,0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ExternalLink width={18} height={18} />
                    <span>Discord Community</span>
                  </div>
                  <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '100px' }}>Soon</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer id="site-footer">
          <div className="footer-inner">
            <div className="footer-logo" style={{ fontFamily: 'var(--font-display)' }}>
              <svg
                className="brand-spike"
                viewBox="0 0 24 24"
                width="22"
                height="22"
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
              stutosed
            </div>
            <p className="footer-tagline">Your complete SSC & B.Tech preparation companion.</p>
            <p className="footer-copy">© Made by Shikshiten. All content belongs to respective educators.</p>
            <p className="footer-contact">
              Official Channel:{' '}
              <a href="https://t.me/stutosed" target="_blank" rel="noopener noreferrer">
                @stutosed
              </a>{' '}
              • Support:{' '}
              <a href="https://t.me/bookwormislie" target="_blank" rel="noopener noreferrer">
                @bookwormislie
              </a>
            </p>
          </div>
        </footer>
      </div>

      {/* Course View Modal */}
      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onPlayVideo={handlePlayVideo}
          onOpenPdf={handleOpenPdf}
          watchedUrls={watchedUrls}
        />
      )}

      {/* Video Player Modal */}
      {playerPlaylist && (
        <VideoPlayer
          playlist={playerPlaylist}
          currentIndex={playerIndex}
          courseName={selectedCourse?.name || 'Lecture'}
          onClose={() => setPlayerPlaylist(null)}
          onNavigate={(newIdx) => {
            setPlayerIndex(newIdx);
            if (playerPlaylist[newIdx]?.url) {
              handleMarkWatched(playerPlaylist[newIdx].url);
            }
          }}
        />
      )}

      {/* Supabase Google Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          try {
            localStorage.setItem('stutosed_visited_v1', 'true');
          } catch {}
          setIsAuthOpen(false);
        }}
        user={user}
        onSignOut={async () => {
          try {
            const supabase = createClient();
            await supabase.auth.signOut();
            setUser(null);
          } catch {}
        }}
      />
    </div>
  );
}
