'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sidebar, AppView } from '@/components/Sidebar';
import { MobileHeader } from '@/components/MobileHeader';
import { CourseGrid } from '@/components/CourseGrid';
import { CourseModal } from '@/components/CourseModal';
import { VideoPlayer } from '@/components/VideoPlayer';
import { AuthModal } from '@/components/AuthModal';
import { PdfViewerModal } from '@/components/PdfViewerModal';
import { getAvatarGradient, getInitials } from '@/components/ProfileMenu';
import { ChangelogModal, CURRENT_APP_VERSION } from '@/components/ChangelogModal';
import { PrivacyTermsModal } from '@/components/PrivacyTermsModal';
import { INITIAL_COURSES, getTotalStats, getCourseById } from '@/lib/coursesData';
import { Course, LectureItem, UserProfile } from '@/types';
import { getWorkerProxyUrl } from '@/lib/proxyConfig';
import { createClient } from '@/lib/supabase/client';
import {
  BookOpen,
  Send,
  Sparkles,
  Play,
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
  Edit3,
  Compass,
  Calendar,
  Layers,
  FileText,
  Lock,
  Scale,
  Sunrise,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';

const WATCHED_KEY = 'onafbu_watched_v1';
const LAST_PLAYED_KEY = 'stutosed_last_played_v1';

// Animated Counter Sub-Component for Hero Stats
const StatCounter: React.FC<{ value: number; label: string; suffix?: string }> = ({
  value,
  label,
  suffix = '+',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTimestamp: number | null = null;
    const duration = 1400;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(ease * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [started, value]);

  return (
    <div className="hero-stat" ref={ref}>
      <div className="stat-num">
        {displayValue.toLocaleString()}
        {suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default function HomePage() {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);

  // Video Player state
  const [playerPlaylist, setPlayerPlaylist] = useState<LectureItem[] | null>(null);
  const [playerIndex, setPlayerIndex] = useState<number>(0);

  // PDF Viewer Modal state
  const [pdfModalData, setPdfModalData] = useState<{
    item: LectureItem;
    playlist?: LectureItem[];
    currentIndex?: number;
  } | null>(null);

  // Auth & Watched state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthCompulsory, setIsAuthCompulsory] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userName, setUserName] = useState<string>('Student');
  const [memberSince, setMemberSince] = useState<string>('August 2026');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [watchedUrls, setWatchedUrls] = useState<Set<string>>(new Set());

  // Changelog Modal state
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  // Privacy & Terms Modal state
  const [privacyModalState, setPrivacyModalState] = useState<{
    isOpen: boolean;
    tab: 'privacy' | 'terms';
  }>({ isOpen: false, tab: 'privacy' });

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

  // Dynamic Time-Based Greeting calculation
  const greetingData = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        greeting: `Good Morning, ${userName}`,
        subtext: "Let's start strong today. Ready to conquer your study goals?",
        timeSlot: 'morning' as const,
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: `Good Afternoon, ${userName}`,
        subtext: 'Keep up the study momentum. Every lecture completed is a step forward.',
        timeSlot: 'afternoon' as const,
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        greeting: `Good Evening, ${userName}`,
        subtext: "Finish today's study target and review your notes before you wrap up.",
        timeSlot: 'evening' as const,
      };
    } else {
      return {
        greeting: `Late Night Focus, ${userName}`,
        subtext: 'Quiet hours, sharp focus. Power through your study session.',
        timeSlot: 'night' as const,
      };
    }
  }, [userName]);

  // Helper to sync URL search parameters, sessionStorage, and browser history
  const syncNavigationState = (
    view: AppView,
    courseId: string | null = null,
    folderId: string | null = null,
    isPush: boolean = true
  ) => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams();
      if (view && view !== 'home') {
        params.set('view', view);
        sessionStorage.setItem('stutosed_active_view', view);
      } else {
        sessionStorage.removeItem('stutosed_active_view');
      }

      if (courseId) {
        params.set('course', courseId);
        sessionStorage.setItem('stutosed_open_course', courseId);
      } else {
        sessionStorage.removeItem('stutosed_open_course');
      }

      if (folderId) {
        params.set('folder', folderId);
        sessionStorage.setItem('stutosed_open_folder', folderId);
      } else {
        sessionStorage.removeItem('stutosed_open_folder');
      }

      const queryString = params.toString();
      const nextUrl = queryString ? `/?${queryString}` : '/';
      const historyState = { view, courseId, folderId };

      if (isPush) {
        window.history.pushState(historyState, '', nextUrl);
      } else {
        window.history.replaceState(historyState, '', nextUrl);
      }
    } catch {}
  };

  // Initial load: Theme, Watched URLs, Avatar, Last Played, and URL/Session View Restoration
  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem('stutosed-theme') as 'light' | 'dark') || 'light';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);

      const savedWatched = JSON.parse(localStorage.getItem(WATCHED_KEY) || '{}');
      setWatchedUrls(new Set(Object.keys(savedWatched)));

      const savedName = localStorage.getItem('stutosed_user_name');
      if (savedName) setUserName(savedName);

      const savedMemberSince = localStorage.getItem('stutosed_member_since');
      if (savedMemberSince) {
        setMemberSince(savedMemberSince);
      } else {
        const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        setMemberSince(monthYear);
        localStorage.setItem('stutosed_member_since', monthYear);
      }

      const savedLast = localStorage.getItem(LAST_PLAYED_KEY);
      if (savedLast) {
        setLastPlayed(JSON.parse(savedLast));
      }

      // Restore view & course from URL query params or sessionStorage on refresh
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = (urlParams.get('view') as AppView) || (sessionStorage.getItem('stutosed_active_view') as AppView) || 'home';
        const courseParam = urlParams.get('course') || sessionStorage.getItem('stutosed_open_course');
        const folderParam = urlParams.get('folder') || sessionStorage.getItem('stutosed_open_folder');

        if (viewParam && ['beu-engineering', 'gov-exams', 'courses', 'profile', 'help', 'home'].includes(viewParam)) {
          setActiveView(viewParam);
        }

        if (courseParam) {
          const course = getCourseById(courseParam);
          if (course) {
            setSelectedCourse(course);
            if (folderParam) {
              setOpenFolderId(folderParam);
            }
          }
        }

        // Seed initial history state
        const currentSearch = window.location.search;
        window.history.replaceState(
          { view: viewParam, courseId: courseParam || null, folderId: folderParam || null },
          '',
          currentSearch || '/'
        );
      }
    } catch {}
  }, []);

  // Supabase User Auth listener & PKCE code exchange
  useEffect(() => {
    try {
      const supabase = createClient();

      // Handle OAuth PKCE code parameter in URL if redirected here directly
      if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
          supabase.auth.exchangeCodeForSession(code).then(() => {
            urlParams.delete('code');
            const newQuery = urlParams.toString();
            const cleanUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '');
            window.history.replaceState({}, '', cleanUrl);
          }).catch(() => {});
        }
      }

      supabase.auth.getUser().then(({ data }: any) => {
        if (data?.user) {
          const metaName = data.user.user_metadata?.full_name || data.user.user_metadata?.display_name || data.user.user_metadata?.name;
          const fallbackName = localStorage.getItem('stutosed_user_name') || 'Student';
          const resolvedName = metaName || fallbackName;
          setUserName(resolvedName);

          const joinedDate = data.user.created_at
            ? new Date(data.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : 'August 2026';
          setMemberSince(joinedDate);

          const photoUrl =
            data.user.user_metadata?.avatar_url ||
            data.user.user_metadata?.picture ||
            data.user.identities?.[0]?.identity_data?.avatar_url ||
            data.user.identities?.[0]?.identity_data?.picture ||
            null;

          setUser({
            id: data.user.id,
            email: data.user.email || '',
            full_name: resolvedName,
            avatar_url: photoUrl,
          });
          setIsAuthOpen(false);
        } else {
          // If not logged in, maintain guest session without forcing auth modal
          setUser(null);
          setUserName('Guest');
          setIsAuthCompulsory(false);
          setIsAuthOpen(false);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_: any, session: any) => {
        if (session?.user) {
          const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.display_name || session.user.user_metadata?.name;
          const fallbackName = localStorage.getItem('stutosed_user_name') || 'Student';
          const resolvedName = metaName || fallbackName;
          setUserName(resolvedName);

          const joinedDate = session.user.created_at
            ? new Date(session.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : 'August 2026';
          setMemberSince(joinedDate);

          const photoUrl =
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            session.user.identities?.[0]?.identity_data?.avatar_url ||
            session.user.identities?.[0]?.identity_data?.picture ||
            null;

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: resolvedName,
            avatar_url: photoUrl,
          });
          setIsAuthOpen(false);
        } else {
          setUser(null);
          setIsAuthCompulsory(true);
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe?.();
      };
    } catch {}
  }, []);

  // Mobile & Desktop Layered Browser Back Button Management
  useEffect(() => {
    const handlePopState = () => {
      // Layer 1: If Mobile Sidebar is open, close it
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return;
      }

      // Layer 2: If Changelog or Privacy modal is open, close it
      if (isChangelogOpen) {
        setIsChangelogOpen(false);
        return;
      }
      if (privacyModalState.isOpen) {
        setPrivacyModalState((prev) => ({ ...prev, isOpen: false }));
        return;
      }

      // Layer 3: If PDF Viewer Modal is open, close it
      if (pdfModalData) {
        setPdfModalData(null);
        return;
      }

      // Layer 4: If Video Player is open, close it (returns to lecture list)
      if (playerPlaylist) {
        setPlayerPlaylist(null);
        return;
      }

      // Layer 5: If in a sub-folder inside Course Modal, go back to folder root
      if (openFolderId) {
        setOpenFolderId(null);
        syncNavigationState(activeView, selectedCourse?.id || null, null, false);
        return;
      }

      // Layer 6: If Course Modal is open, close it (returns to Category / Home)
      if (selectedCourse) {
        setSelectedCourse(null);
        setOpenFolderId(null);
        syncNavigationState(activeView, null, null, false);
        return;
      }

      // Layer 7: If in a sub-view (beu-engineering, gov-exams, courses, profile, help), return to home
      if (activeView !== 'home') {
        setActiveView('home');
        syncNavigationState('home', null, null, false);
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isSidebarOpen,
    isChangelogOpen,
    privacyModalState.isOpen,
    pdfModalData,
    playerPlaylist,
    openFolderId,
    selectedCourse,
    activeView,
  ]);

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

  // Navigation handlers
  const handleViewChange = (newView: AppView) => {
    if (newView === activeView && !selectedCourse && !openFolderId) return;

    setActiveView(newView);
    setSelectedCourse(null);
    setOpenFolderId(null);
    setPlayerPlaylist(null);
    setPdfModalData(null);
    syncNavigationState(newView, null, null, true);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Open Course Modal
  const handleOpenCourse = (course: Course) => {
    setSelectedCourse(course);
    setOpenFolderId(null);
    syncNavigationState(activeView, course.id, null, true);
  };

  const handleCloseCourse = () => {
    setSelectedCourse(null);
    setOpenFolderId(null);
    syncNavigationState(activeView, null, null, false);
  };

  const handleFolderTabChange = (folderId: string | null) => {
    setOpenFolderId(folderId);
    syncNavigationState(activeView, selectedCourse?.id || null, folderId, folderId !== null);
  };

  // Open Video Player with history state push and record last played
  const handlePlayVideo = (playlist: LectureItem[], index: number) => {
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

      // If YouTube URL, open directly in YouTube in a new tab
      if (
        current.url.includes('youtube.com') ||
        current.url.includes('youtu.be') ||
        current.type === 'youtube'
      ) {
        window.open(current.url, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    window.history.pushState({ modal: 'player', index }, '');
    setPlayerPlaylist(playlist);
    setPlayerIndex(index);
  };

  // Resume last played lecture
  const handleResumeLastPlayed = () => {
    if (!lastPlayed) return;
    const course = getCourseById(lastPlayed.courseId);
    if (!course) return;

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

  // Open PDF directly in new tab for crystal clear native fonts and reader fidelity
  const handleOpenPdf = (
    itemOrUrl: LectureItem | string,
    playlist?: LectureItem[],
    index?: number
  ) => {
    let item: LectureItem;
    if (typeof itemOrUrl === 'string') {
      item = { label: 'Document', url: itemOrUrl, type: 'pdf' };
      handleMarkWatched(itemOrUrl);
    } else {
      item = itemOrUrl;
      handleMarkWatched(item.url);
    }

    // Determine cleanest target URL
    const servers = item.servers && item.servers.length > 0 ? item.servers : [];
    const albaServer = servers.find(
      (s) => s.name?.toUpperCase().includes('ALBA') || s.url?.includes('streamvaultpro.cc')
    );
    let viewUrl = albaServer?.downloadUrl || albaServer?.url || item.downloadUrl || item.url || '';
    if (viewUrl.includes('/0:/stream/')) {
      viewUrl = viewUrl.replace('/0:/stream/', '/0:/dl/');
    }

    if (viewUrl.includes('crwilladmin.com') || viewUrl.endsWith('.pdf')) {
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } else if (viewUrl) {
      const proxiedUrl = getWorkerProxyUrl(viewUrl, 'pdf');
      window.open(proxiedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const stats = getTotalStats();
  const initials = getInitials(userName);
  const avatarBg = getAvatarGradient(userName);

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
        userName={userName}
        activeView={activeView}
        onSelectView={(v) => handleViewChange(v)}
        onOpenAuth={() => {
          setIsAuthCompulsory(false);
          setIsAuthOpen(true);
        }}
      />

      {/* Main Content Layout */}
      <div id="main-content-layout">
        {/* Mobile Header */}
        <MobileHeader
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenAuth={() => {
            setIsAuthCompulsory(false);
            setIsAuthOpen(true);
          }}
          user={user}
          userName={userName}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onSelectView={(v) => handleViewChange(v)}
          onSignOut={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            setUser(null);
            setUserName('Guest');
            setIsAuthCompulsory(false);
            setIsAuthOpen(false);
          }}
          watchedCount={watchedUrls.size}
        />

        {/* ============================================================
            VIEW 1: HOME VIEW (Dashboard with Greeting Banner & Portals)
            ============================================================ */}
        {activeView === 'home' && (
          <div className="animate-fade-in">
            {/* HERO SECTION */}
            <section id="hero">
              <div className="hero-ambient"></div>
              {/* Soft Animated Floating Mesh Blob */}
              <div
                className="hero-ambient-blob"
                style={{
                  top: '10%',
                  left: '25%',
                  background: 'radial-gradient(circle, var(--accent) 0%, rgba(204,120,92,0) 70%)',
                }}
              />
              <div
                className="hero-ambient-blob"
                style={{
                  bottom: '10%',
                  right: '25%',
                  background: 'radial-gradient(circle, var(--beu-blue) 0%, rgba(59,130,246,0) 70%)',
                  animationDelay: '-7s',
                }}
              />

              <div className="hero-content">
                {/* Trust & Credibility Badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: 'var(--r-pill)', background: 'var(--bg-card-subtle)', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '20px' }}>
                  <ShieldCheck width={15} height={15} style={{ color: 'var(--green)' }} />
                  <span>Trusted by Students Across India</span>
                  <span style={{ color: 'var(--border)' }}>•</span>
                  <span style={{ color: 'var(--accent)' }}>100% Free & Open</span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div className="hero-eyebrow">
                    <span className="eyebrow-dot"></span>
                    Your Complete Study Companion
                  </div>
                </div>

                <h1 className="hero-title" style={{ fontFamily: 'var(--font-display)' }}>
                  Study Smart.<br />
                  Score <span className="hero-accent">Higher.</span>
                </h1>
                <p className="hero-lead">
                  All your SSC, Competitive Exams & BEU B.Tech lectures, notes and resources — organized in one clean, ad-free portal.
                </p>

                <div className="hero-actions">
                  <button
                    className="btn-primary"
                    onClick={() => {
                      const el = document.getElementById('explore-categories');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        handleViewChange('courses');
                      }
                    }}
                  >
                    <BookOpen width={16} height={16} />
                    Explore Courses
                  </button>

                  <button
                    className="btn-ghost"
                    onClick={() => handleViewChange('help')}
                  >
                    <HelpCircle width={16} height={16} />
                    Help & Community
                  </button>
                </div>

                {/* Animated Count-Up Stats */}
                <div className="hero-stats" id="hero-stats">
                  <StatCounter value={stats.totalVideos} label="Video Lectures" />
                  <div className="hero-stat-divider"></div>
                  <StatCounter value={stats.totalPDFs} label="PDF Notes" />
                  <div className="hero-stat-divider"></div>
                  <StatCounter value={stats.totalCourses} label="Full Batches" suffix="" />
                  <div className="hero-stat-divider"></div>
                  <div className="hero-stat">
                    <div className="stat-num" style={{ color: 'var(--green)' }}>100%</div>
                    <div className="stat-label">Free & Ad-Free</div>
                  </div>
                </div>
              </div>
            </section>

            {/* PERSONALIZED TIME-BASED GREETING BANNER */}
            {user && (
              <div style={{ maxWidth: '1100px', margin: '0 auto 28px', padding: '0 24px' }}>
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-xl)',
                    padding: '20px 24px',
                    boxShadow: 'var(--sh-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 300px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: user?.avatar_url ? 'transparent' : avatarBg,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '17px',
                        fontWeight: 700,
                        flexShrink: 0,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                        border: '2px solid var(--border)',
                      }}
                    >
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={userName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        initials
                      )}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            background: 'var(--bg-card-subtle)',
                            border: '1px solid var(--border)',
                            flexShrink: 0,
                          }}
                        >
                          {greetingData.timeSlot === 'morning' && (
                            <Sunrise width={14} height={14} style={{ color: '#f59e0b' }} />
                          )}
                          {greetingData.timeSlot === 'afternoon' && (
                            <Sun width={14} height={14} style={{ color: '#eab308' }} />
                          )}
                          {greetingData.timeSlot === 'evening' && (
                            <Sunset width={14} height={14} style={{ color: '#f97316' }} />
                          )}
                          {greetingData.timeSlot === 'night' && (
                            <Moon width={14} height={14} style={{ color: '#818cf8' }} />
                          )}
                        </div>
                        <h2
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '18px',
                            fontWeight: 700,
                            color: 'var(--text)',
                            margin: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            lineHeight: 1.3,
                          }}
                        >
                          <span>{greetingData.greeting}</span>
                          <svg
                            className="brand-spike"
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ color: 'var(--accent)', flexShrink: 0 }}
                          >
                            <circle cx="12" cy="12" r="3.5" fill="currentColor" />
                            <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="0.8" />
                            <path d="M12 3.5V1M12 20.5v2.5M3.5 12H1M20.5 12h2.5M6 6L4 4M18 18l2 2M6 18l-2 2M18 6l2-2" />
                          </svg>
                        </h2>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '3px 0 0', lineHeight: 1.45 }}>
                        {greetingData.subtext}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewChange('profile')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: 'var(--r-pill)',
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--accent)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <span>View Progress</span>
                    <ArrowRight width={14} height={14} />
                  </button>
                </div>
              </div>
            )}

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
                  onClick={() => handleViewChange('courses')}
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
                /* Illustrated Empty State Component */
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--r-xl)',
                    padding: '40px 24px',
                    textAlign: 'center',
                    boxShadow: 'var(--sh-card)',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'rgba(204,120,92,0.12)',
                      color: 'var(--accent)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '14px',
                    }}
                  >
                    <BookOpen width={26} height={26} strokeWidth={2} />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
                    Ready to Start Learning?
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                    Select a Government Exam batch or BEU B.Tech 1st Year course below to begin watching lectures and track your progress.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      const el = document.getElementById('explore-categories');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      else handleViewChange('courses');
                    }}
                    style={{ padding: '10px 22px', fontSize: '13px' }}
                  >
                    <Compass width={15} height={15} />
                    Explore Course Portals
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
                    handleViewChange('gov-exams');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="domain-portal-card"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-xl)',
                    padding: '28px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'var(--sh-card)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div style={{ position: 'absolute', right: '-15px', top: '-15px', opacity: 0.04, pointerEvents: 'none' }}>
                    <Landmark width={160} height={160} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: 'var(--r-lg)',
                        background: 'var(--govt-dim)',
                        color: 'var(--govt-indigo)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Landmark width={26} height={26} strokeWidth={2} />
                    </div>
                    <span
                      style={{
                        background: 'var(--govt-dim)',
                        color: 'var(--govt-indigo)',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '5px 12px',
                        borderRadius: 'var(--r-pill)',
                        border: '1px solid rgba(99,102,241,0.2)',
                      }}
                    >
                      9 Batches • 1,400+ Classes
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
                    Government Exam Section
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 20px' }}>
                    Complete preparation for SSC CGL, CHSL, MTS, Railway & State exams with Parmar GK 3.0, Static GK, Maths, Reasoning & English.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--r-pill)', background: 'var(--govt-dim)', border: '1px solid rgba(99,102,241,0.18)', color: 'var(--govt-indigo)', fontWeight: 600 }}>SSC CGL/CHSL</span>
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--r-pill)', background: 'var(--govt-dim)', border: '1px solid rgba(99,102,241,0.18)', color: 'var(--govt-indigo)', fontWeight: 600 }}>General Studies</span>
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--r-pill)', background: 'var(--govt-dim)', border: '1px solid rgba(99,102,241,0.18)', color: 'var(--govt-indigo)', fontWeight: 600 }}>Aptitude</span>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
                      <span>Explore</span>
                      <ArrowRight width={14} height={14} />
                    </div>
                  </div>
                </div>

                {/* Domain Card 2: Bihar Engineering University (BEU) */}
                <div
                  onClick={() => {
                    handleViewChange('beu-engineering');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="domain-portal-card"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-xl)',
                    padding: '28px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'var(--sh-card)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div style={{ position: 'absolute', right: '-15px', top: '-15px', opacity: 0.04, pointerEvents: 'none' }}>
                    <GraduationCap width={160} height={160} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: 'var(--r-lg)',
                        background: 'var(--beu-dim)',
                        color: 'var(--beu-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <GraduationCap width={26} height={26} strokeWidth={2} />
                    </div>
                    <span
                      style={{
                        background: 'var(--beu-dim)',
                        color: 'var(--beu-blue)',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '5px 12px',
                        borderRadius: 'var(--r-pill)',
                        border: '1px solid rgba(37,99,235,0.2)',
                      }}
                    >
                      1st Year • 329 Classes & Notes
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
                    Bihar Engineering University (BEU)
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 20px' }}>
                    Curriculum-aligned B.Tech 1st Year courses featuring EE/ECE/EEE, Engineering Chemistry, Mechanical Engineering (UMEED) & resources.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--r-pill)', background: 'var(--beu-dim)', border: '1px solid rgba(37,99,235,0.18)', color: 'var(--beu-blue)', fontWeight: 600 }}>B.Tech</span>
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--r-pill)', background: 'var(--beu-dim)', border: '1px solid rgba(37,99,235,0.18)', color: 'var(--beu-blue)', fontWeight: 600 }}>1st Year</span>
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--r-pill)', background: 'var(--beu-dim)', border: '1px solid rgba(37,99,235,0.18)', color: 'var(--beu-blue)', fontWeight: 600 }}>Engineering</span>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: 'var(--beu-blue)' }}>
                      <span>Explore</span>
                      <ArrowRight width={14} height={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* HELP & COMMUNITY BOX */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 60px' }}>
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-xl)',
                  padding: '36px 28px',
                  textAlign: 'center',
                  boxShadow: 'var(--sh-card)',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(204,120,92,0.12)', color: 'var(--accent)', marginBottom: '14px' }}>
                  <HelpCircle width={28} height={28} strokeWidth={2} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
                  Need Help or Have Questions?
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.55 }}>
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
                      padding: '11px 22px',
                      borderRadius: 'var(--r-pill)',
                      background: '#229ED9',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      boxShadow: '0 3px 12px rgba(34,158,217,0.3)',
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
                      padding: '11px 22px',
                      borderRadius: 'var(--r-pill)',
                      background: 'var(--accent)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      boxShadow: '0 3px 12px rgba(204,120,92,0.3)',
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
                      padding: '11px 22px',
                      borderRadius: 'var(--r-pill)',
                      background: '#5865F2',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 3px 12px rgba(88,101,242,0.3)',
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
                  onClick={() => handleViewChange('home')}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--r-lg)',
                    background: 'var(--govt-dim)',
                    color: 'var(--govt-indigo)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Landmark width={24} height={24} strokeWidth={2} />
                </div>
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
              theme={theme}
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
                  onClick={() => handleViewChange('home')}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--r-lg)',
                    background: 'var(--beu-dim)',
                    color: 'var(--beu-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <GraduationCap width={24} height={24} strokeWidth={2} />
                </div>
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
              theme={theme}
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
              theme={theme}
            />
          </div>
        )}

        {/* ============================================================
            VIEW 3: REDESIGNED USER PROFILE & LEARNING HISTORY
            ============================================================ */}
        {activeView === 'profile' && (
          <div className="animate-fade-in profile-page-container">
            <div className="profile-page-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User width={20} height={20} color="var(--accent)" />
                <h1 className="profile-page-title">
                  Student Profile
                </h1>
              </div>
            </div>

            {/* Profile Overview Card (ZERO EMAIL DISPLAYED) */}
            <div className="profile-overview-card">
              <div className="profile-overview-main">
                {user?.avatar_url && user.avatar_url !== '/profile_icon.jpg' ? (
                  <img
                    src={user.avatar_url}
                    alt={userName}
                    className="profile-avatar-box"
                    style={{ objectFit: 'cover', border: '2px solid var(--accent)' }}
                  />
                ) : (
                  <div
                    className="profile-avatar-box"
                    style={{
                      background: avatarBg,
                      color: '#ffffff',
                    }}
                  >
                    {initials}
                  </div>
                )}

                <div style={{ minWidth: 0, flex: 1 }}>
                  {isEditingName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 'var(--r-md)',
                          border: '1px solid var(--border)',
                          background: 'var(--bg)',
                          color: 'var(--text)',
                          fontSize: '14px',
                          fontWeight: 600,
                          outline: 'none',
                          maxWidth: '160px',
                        }}
                        placeholder="Enter name"
                      />
                      <button
                        onClick={async () => {
                          const clean = nameInput.trim() || 'Student';
                          setUserName(clean);
                          try {
                            localStorage.setItem('stutosed_user_name', clean);
                            const supabase = createClient();
                            await supabase.auth.updateUser({
                              data: { full_name: clean, display_name: clean },
                            });
                          } catch {}
                          setIsEditingName(false);
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 'var(--r-md)',
                          background: 'var(--accent)',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 'var(--r-md)',
                          background: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '12px',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h2 className="profile-user-name">
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
                          padding: '2px 8px',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Edit3 width={11} height={11} />
                        <span>Edit</span>
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--green)', fontWeight: 600 }}>
                      <ShieldCheck width={13} height={13} />
                      <span>Verified Account</span>
                    </div>
                    <span style={{ color: 'var(--border)' }}>•</span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar width={12} height={12} />
                      <span>Member since {memberSince}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-signout-wrap">
                {user ? (
                  <button
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      setUser(null);
                      setIsAuthCompulsory(true);
                      setIsAuthOpen(true);
                    }}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 'var(--r-md)',
                      background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.25)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsAuthCompulsory(false);
                      setIsAuthOpen(true);
                    }}
                    className="btn-primary"
                    style={{ padding: '7px 16px', fontSize: '12px' }}
                  >
                    <Sparkles width={13} height={13} />
                    Sign In
                  </button>
                )}
              </div>
            </div>

            {/* Learning Metrics Grid */}
            <div className="profile-stats-grid">
              <div className="profile-stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)' }}>
                  <CheckCircle2 width={15} height={15} />
                  <span className="stat-header-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Watched</span>
                </div>
                <div className="profile-stat-num">
                  {watchedUrls.size}
                </div>
                <div className="stat-sub-label" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  out of {stats.totalVideos} videos
                </div>
              </div>

              <div className="profile-stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--green)' }}>
                  <ShieldCheck width={15} height={15} />
                  <span className="stat-header-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Completion</span>
                </div>
                <div className="profile-stat-num">
                  {Math.min(Math.round((watchedUrls.size / (stats.totalVideos || 1)) * 100), 100)}%
                </div>
                <div className="stat-sub-label" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  study progress
                </div>
              </div>

              <div className="profile-stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--beu-blue)' }}>
                  <Layers width={15} height={15} />
                  <span className="stat-header-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Batches</span>
                </div>
                <div className="profile-stat-num">
                  {stats.totalCourses}
                </div>
                <div className="stat-sub-label" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  active tracks
                </div>
              </div>

              <div className="profile-stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--orange)' }}>
                  <FileText width={15} height={15} />
                  <span className="stat-header-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>PDF Notes</span>
                </div>
                <div className="profile-stat-num">
                  {stats.totalPDFs}
                </div>
                <div className="stat-sub-label" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  curated notes
                </div>
              </div>
            </div>

            {/* Clear Watched History button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset your watched history?')) {
                    try {
                      localStorage.removeItem(WATCHED_KEY);
                    } catch {}
                    setWatchedUrls(new Set());
                  }
                }}
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  padding: '7px 16px',
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer',
                  background: 'var(--bg-card)',
                  transition: 'all 0.2s',
                }}
              >
                Reset Watched Progress
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            VIEW 4: HELP & COMMUNITY VIEW
            ============================================================ */}
        {activeView === 'help' && (
          <div className="animate-fade-in help-page-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <HelpCircle width={20} height={20} color="var(--accent)" />
              <h1 className="help-page-title">
                Help & Community Support
              </h1>
            </div>

            {/* Frequently Asked Questions */}
            <div className="help-card">
              <h2 className="help-card-title">
                Frequently Asked Questions
              </h2>
              <div className="faq-list">
                <div>
                  <h3 className="faq-question">
                    1. Is everything on this website really 100% free?
                  </h3>
                  <p className="faq-answer">
                    Yes! All lectures, PDF notes, and resources are curated and accessible completely free with no subscriptions or paywalls.
                  </p>
                </div>

                <div>
                  <h3 className="faq-question">
                    2. Why is student login required?
                  </h3>
                  <p className="faq-answer">
                    Creating a student account syncs your watched lecture history, progress percentage, and last-played lectures across all your devices securely.
                  </p>
                </div>

                <div>
                  <h3 className="faq-question">
                    3. How do I report a broken video link or missing notes?
                  </h3>
                  <p className="faq-answer">
                    You can directly report any broken link to the developer via Telegram @bookwormislie or post in our official discussion channel for quick resolution.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Community Channels */}
            <div className="help-card">
              <h2 className="help-card-title">
                Connect Directly with Community
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Official Telegram Channel */}
                <a
                  href="https://t.me/stutosed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="help-channel-btn"
                  style={{
                    background: '#229ED9',
                    color: '#ffffff',
                    boxShadow: '0 2px 10px rgba(34,158,217,0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <Send width={16} height={16} />
                    <span>Official Telegram Channel (@stutosed)</span>
                  </div>
                  <ArrowRight width={15} height={15} />
                </a>

                {/* Contact Developer DM */}
                <a
                  href="https://t.me/bookwormislie"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="help-channel-btn"
                  style={{
                    background: 'var(--accent)',
                    color: '#ffffff',
                    boxShadow: '0 2px 10px rgba(204,120,92,0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <MessageSquare width={16} height={16} />
                    <span>Contact Developer (@bookwormislie)</span>
                  </div>
                  <ArrowRight width={15} height={15} />
                </a>

                {/* Discord Community */}
                <button
                  onClick={() => alert('Discord server link will be updated shortly! Please connect via our Telegram channel.')}
                  className="help-channel-btn"
                  style={{
                    background: '#5865F2',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(88,101,242,0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <ExternalLink width={16} height={16} />
                    <span>Discord Community</span>
                  </div>
                  <span style={{ fontSize: '10.5px', background: 'rgba(255,255,255,0.2)', padding: '2px 7px', borderRadius: '100px' }}>Soon</span>
                </button>
              </div>
            </div>

            {/* Legal & Privacy Center */}
            <div className="help-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                <ShieldCheck width={17} height={17} color="var(--green)" />
                <h2 className="help-card-title" style={{ margin: 0 }}>
                  Privacy, Transparency & Terms
                </h2>
              </div>
              <p className="faq-answer" style={{ marginBottom: '14px' }}>
                stutosed is built on strict student-first principles. We do not sell personal data, we do not host ads, and we respect educational fair use guidelines.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setPrivacyModalState({ isOpen: true, tab: 'privacy' })}
                  className="btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}
                >
                  <ShieldCheck width={13} height={13} />
                  <span>Read Privacy Policy</span>
                </button>
                <button
                  onClick={() => setPrivacyModalState({ isOpen: true, tab: 'terms' })}
                  className="btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}
                >
                  <Scale width={13} height={13} />
                  <span>Terms & Conditions</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* UPGRADED MULTI-COLUMN FOOTER */}
        <footer
          id="site-footer"
          style={{
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border)',
            padding: '48px 24px 32px',
            marginTop: '60px',
          }}
        >
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '40px',
                paddingBottom: '36px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {/* Column 1: Brand & Tagline */}
              {/* Column 1: Brand & Tagline */}
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'var(--font-display)',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <svg className="brand-spike" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
                      <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="0.8" />
                      <path d="M12 3.5V1M12 20.5v2.5M3.5 12H1M20.5 12h2.5M6 6L4 4M18 18l2 2M6 18l-2 2M18 6l2-2" />
                    </svg>
                    <span>stutosed</span>
                  </div>

                  <button
                    onClick={() => setIsChangelogOpen(true)}
                    title="Click to view release notes & changelog"
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 'var(--r-pill)',
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s',
                    }}
                    className="footer-version-btn"
                  >
                    <span>{CURRENT_APP_VERSION}</span>
                    <span style={{ fontSize: '9.5px', opacity: 0.7 }}>Changelog</span>
                  </button>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 16px', maxWidth: '300px', textAlign: 'left' }}>
                  Free, ad-free study portal providing structured lectures, curated video series, and verified PDF notes for competitive exams & B.Tech curricula.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-dim)', textAlign: 'left' }}>
                  <ShieldCheck width={14} height={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
                  <span>Non-Commercial Student Platform</span>
                </div>
              </div>

              {/* Column 2: Navigation Tracks */}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px', textAlign: 'left' }}>
                  Learning Tracks
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                  <li>
                    <button onClick={() => handleViewChange('gov-exams')} className="footer-link-btn">
                      <Landmark width={14} height={14} style={{ color: 'var(--govt-indigo)', flexShrink: 0 }} />
                      <span>Government Exams (SSC CGL/CHSL)</span>
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleViewChange('beu-engineering')} className="footer-link-btn">
                      <GraduationCap width={14} height={14} style={{ color: 'var(--beu-blue)', flexShrink: 0 }} />
                      <span>BEU B.Tech 1st Year Courses</span>
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleViewChange('courses')} className="footer-link-btn">
                      <BookOpen width={14} height={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <span>Complete Course Catalog</span>
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleViewChange('help')} className="footer-link-btn">
                      <HelpCircle width={14} height={14} style={{ flexShrink: 0 }} />
                      <span>Help Center & FAQs</span>
                    </button>
                  </li>
                </ul>
              </div>

              {/* Column 3: Community & Social Channels */}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px', textAlign: 'left' }}>
                  Community & Connect
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a
                    href="https://t.me/stutosed"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 14px',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text)',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Send width={14} height={14} style={{ color: '#229ED9', flexShrink: 0 }} />
                      <span>Telegram Channel</span>
                    </div>
                    <ExternalLink width={13} height={13} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                  </a>

                  <a
                    href="https://t.me/bookwormislie"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 14px',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text)',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare width={14} height={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <span>Contact Developer</span>
                    </div>
                    <ExternalLink width={13} height={13} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom credits */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '24px', fontSize: '12px', color: 'var(--text-dim)', textAlign: 'left' }}>
              <div style={{ textAlign: 'left' }}>
                © {new Date().getFullYear()} stutosed. Designed for students. All course content belongs to respective educators.
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setPrivacyModalState({ isOpen: true, tab: 'privacy' })}
                  className="footer-credit-btn"
                >
                  Privacy Policy
                </button>
                <span style={{ color: 'var(--border)' }}>•</span>
                <button
                  onClick={() => setPrivacyModalState({ isOpen: true, tab: 'terms' })}
                  className="footer-credit-btn"
                >
                  Terms of Service
                </button>
                <span style={{ color: 'var(--border)' }}>•</span>
                <button
                  onClick={() => handleViewChange('help')}
                  className="footer-credit-btn"
                >
                  Support & Help Center
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Course View Modal */}
      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          onClose={handleCloseCourse}
          onPlayVideo={handlePlayVideo}
          onOpenPdf={handleOpenPdf}
          watchedUrls={watchedUrls}
          initialFolderTabId={openFolderId}
          onFolderTabChange={handleFolderTabChange}
          theme={theme}
          onOpenSidebar={() => setIsSidebarOpen(true)}
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

      {/* PDF Viewer Modal */}
      {pdfModalData && (
        <PdfViewerModal
          item={pdfModalData.item}
          courseName={selectedCourse?.name || 'Lecture Notes'}
          onClose={() => setPdfModalData(null)}
          playlist={pdfModalData.playlist}
          currentIndex={pdfModalData.currentIndex}
          onNavigate={(newIdx) => {
            if (pdfModalData.playlist && pdfModalData.playlist[newIdx]) {
              const nextItem = pdfModalData.playlist[newIdx];
              handleMarkWatched(nextItem.url);
              setPdfModalData({
                ...pdfModalData,
                item: nextItem,
                currentIndex: newIdx,
              });
            }
          }}
        />
      )}

      {/* Supabase Google & Email Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        isCompulsory={isAuthCompulsory}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onSignOut={async () => {
          try {
            const supabase = createClient();
            await supabase.auth.signOut();
            setUser(null);
            setUserName('Guest');
            setIsAuthCompulsory(false);
            setIsAuthOpen(false);
          } catch {}
        }}
      />

      {/* Changelog & Version History Modal */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />

      {/* Privacy Policy & Terms of Service Modal */}
      <PrivacyTermsModal
        isOpen={privacyModalState.isOpen}
        initialTab={privacyModalState.tab}
        onClose={() => setPrivacyModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
