'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Course, LectureItem } from '@/types';
import { INITIAL_COURSES, loadCourseDetails } from '@/lib/coursesData';
import { getSubjectThumbnail, getDynamicThumbnailUrl } from '@/lib/subjectThumbnails';
import { getLectureTopicDescription } from '@/lib/topicDescriptions';
import {
  isCourseBookmarked,
  toggleCourseBookmark,
  isVideoSaved,
  toggleSaveVideo,
} from '@/lib/libraryStorage';

const GateWatchWorkspace = dynamic(
  () => import('./GateWatchWorkspace').then((m) => m.GateWatchWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="watch-page-container">
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
            <div className="player-spinner" style={{ width: '28px', height: '28px' }} />
            <span>Loading GATE lecture workspace…</span>
          </div>
        </div>
      </div>
    ),
  }
);
import {
  Cpu,
  Layers,
  GraduationCap,
  Folder,
  ArrowRight,
  ArrowLeft,
  Video,
  FileText,
  Search,
  X,
  LayoutGrid,
  List,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  FolderPlus,
  FolderHeart,
  Share2,
  ListVideo,
  Moon,
  Sun,
} from 'lucide-react';

export type GateViewStep = 'branches' | 'institutes' | 'subjects' | 'lectures';

export interface GateEngineeringViewProps {
  course: Course | null;
  onSelectCourse?: (course: Course) => void;
  onPlayVideo?: (playlist: LectureItem[], index: number) => void;
  theme?: 'light' | 'dark';
  watchedUrls?: Set<string>;
  step?: GateViewStep;
  branch?: string | null;
  institute?: string | null;
  subject?: string | null;
  onStepChange?: (
    step: GateViewStep,
    branch: string | null,
    institute: string | null,
    subject: string | null,
    urlPath: string
  ) => void;
  onMarkWatched?: (url: string, courseId?: string, label?: string) => void;
}

function formatLectureTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}



export const GateEngineeringView: React.FC<GateEngineeringViewProps> = ({
  course: initialCourse,
  onSelectCourse,
  onPlayVideo,
  theme = 'light',
  watchedUrls = new Set(),
  step: stepProp,
  branch: branchProp,
  institute: instituteProp,
  subject: subjectProp,
  onStepChange,
  onMarkWatched,
}) => {
  const [loadedCourse, setLoadedCourse] = useState<Course | null>(initialCourse);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  useEffect(() => {
    if (initialCourse?.tabs && initialCourse.tabs.length > 0) {
      setLoadedCourse(initialCourse);
      return;
    }
    const targetId = initialCourse?.id || 'gate-ece-made-easy-signal-system';
    setLoadingDetails(true);
    let isCancelled = false;
    loadCourseDetails(targetId).then((detailed) => {
      if (!isCancelled && detailed) {
        setLoadedCourse(detailed);
      }
      if (!isCancelled) {
        setLoadingDetails(false);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [initialCourse]);

  const course = loadedCourse || initialCourse;

  // Navigation drill-down state:
  // Step 1: 'branches' (ECE)
  // Step 2: 'institutes' (Made Easy under ECE)
  // Step 3: 'subjects' (Signal and System under Made Easy)
  // Step 4: 'lectures' (All 36 lectures of Signal and System)
  const [currentStep, setCurrentStep] = useState<GateViewStep>(stepProp || 'branches');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(branchProp ?? 'ECE');
  const [selectedInstitute, setSelectedInstitute] = useState<string | null>(instituteProp ?? 'Made Easy');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(subjectProp ?? 'Signal and System');
  const [activeLectureIndex, setActiveLectureIndex] = useState<number>(0);

  const [lectureSearch, setLectureSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sync with incoming step/branch/institute/subject prop
  useEffect(() => {
    if (stepProp && stepProp !== currentStep) {
      setCurrentStep(stepProp);
    }
  }, [stepProp, currentStep]);

  useEffect(() => {
    if (branchProp !== undefined) setSelectedBranch(branchProp);
  }, [branchProp]);

  useEffect(() => {
    if (instituteProp !== undefined) setSelectedInstitute(instituteProp);
  }, [instituteProp]);

  useEffect(() => {
    if (subjectProp !== undefined) setSelectedSubject(subjectProp);
  }, [subjectProp]);

  // Load and remember gate navigation step & view mode
  useEffect(() => {
    try {
      if (!stepProp) {
        const savedStep = sessionStorage.getItem('stutosed_gate_step') as GateViewStep | null;
        if (savedStep && ['branches', 'institutes', 'subjects', 'lectures'].includes(savedStep)) {
          setCurrentStep(savedStep);
        }
      }
      const savedMode = localStorage.getItem('stutosed_lecture_view_mode') as 'grid' | 'list' | null;
      if (savedMode === 'grid' || savedMode === 'list') {
        setViewMode(savedMode);
      }
    } catch {}
  }, [stepProp]);

  const setGateStep = (step: GateViewStep) => {
    setCurrentStep(step);
    try {
      sessionStorage.setItem('stutosed_gate_step', step);
    } catch {}
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('stutosed_lecture_view_mode', mode);
    } catch {}
  };

  // Extract all 36 lectures from the course tabs
  const allLectures: LectureItem[] = useMemo(() => {
    if (course?.tabs && course.tabs.length > 0 && course.tabs[0].items?.length > 0) {
      return course.tabs[0].items;
    }
    return [];
  }, [course]);

  // Filter lectures based on search query
  const filteredLectures = useMemo(() => {
    const q = lectureSearch.toLowerCase().trim();
    if (!q) return allLectures;
    return allLectures.filter(
      (lec) =>
        (lec.label || '').toLowerCase().includes(q) ||
        (lec.subject || '').toLowerCase().includes(q)
    );
  }, [allLectures, lectureSearch]);

  const handleOpenEce = () => {
    setSelectedBranch('ECE');
    setGateStep('institutes');
    onStepChange?.('institutes', 'ECE', null, null, '/ece');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMadeEasy = () => {
    setSelectedInstitute('Made Easy');
    setGateStep('subjects');
    onStepChange?.('subjects', 'ECE', 'Made Easy', null, '/ece/madeeasy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSignalSystem = () => {
    setSelectedSubject('Signal and System');
    setActiveLectureIndex(0);
    setGateStep('lectures');
    onStepChange?.('lectures', 'ECE', 'Made Easy', 'Signal and System', '/ece/madeeasy/signal-system');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dedicated 2-Column Watch Experience for Signal & System (matching screenshot & /watch format)
  if (currentStep === 'lectures') {
    if (loadingDetails || allLectures.length === 0) {
      return (
        <div className="watch-page-container">
          <header className="watch-top-nav">
            <div className="nav-left-cell">
              <button
                className="watch-nav-btn"
                onClick={() => {
                  setGateStep('subjects');
                  setSelectedSubject(null);
                  onStepChange?.('subjects', 'ECE', 'Made Easy', null, '/ece/madeeasy');
                }}
                title="Back to Made Easy Subjects"
              >
                <ArrowLeft width={18} height={18} />
                <span className="btn-label-desktop">Back</span>
              </button>
            </div>
            <div className="nav-center-cell">
              <span className="nav-course-brand">{course?.name || 'Signal and System — Made Easy'}</span>
            </div>
            <div className="nav-right-cell" />
          </header>
          <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
              <div className="player-spinner" style={{ width: '28px', height: '28px' }} />
              <span>Loading GATE lecture…</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <GateWatchWorkspace
        allLectures={allLectures}
        activeLectureIndex={activeLectureIndex}
        onSelectLecture={(idx) => setActiveLectureIndex(idx)}
        onBackToSubjects={() => {
          setGateStep('subjects');
          setSelectedSubject(null);
          onStepChange?.('subjects', 'ECE', 'Made Easy', null, '/ece/madeeasy');
        }}
        courseId={course?.id || 'gate-ece-made-easy-signal-system'}
        courseName={course?.name || 'Signal and System — Made Easy'}
        theme={theme}
        watchedUrls={watchedUrls}
        onMarkWatched={onMarkWatched}
      />
    );
  }

  return (
    <div className="gate-view-container animate-fade-in" style={{ padding: '8px 0 48px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* =========================================================
            HEADER & BREADCRUMBS
            ========================================================= */}
        <div style={{ marginBottom: '28px' }}>
          {/* Breadcrumb Navigation Trail */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              marginBottom: '10px',
              flexWrap: 'wrap',
            }}
          >
            {currentStep === 'branches' && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>GATE Engineering Hub</span>
            )}

            {currentStep === 'institutes' && (
              <>
                <button
                  onClick={() => {
                    setGateStep('branches');
                    setSelectedBranch(null);
                    onStepChange?.('branches', null, null, null, '/gate');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ArrowLeft width={14} height={14} />
                  <span>All GATE Branches</span>
                </button>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>ECE</span>
              </>
            )}

            {currentStep === 'subjects' && (
              <>
                <button
                  onClick={() => {
                    setGateStep('branches');
                    setSelectedBranch(null);
                    onStepChange?.('branches', null, null, null, '/gate');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ArrowLeft width={14} height={14} />
                  <span>GATE</span>
                </button>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <button
                  onClick={() => {
                    setGateStep('institutes');
                    setSelectedInstitute(null);
                    onStepChange?.('institutes', 'ECE', null, null, '/ece');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  ECE Branches
                </button>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>Made Easy</span>
              </>
            )}
          </div>

          {/* Section Title & Description */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--r-lg)',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.2)',
                }}
              >
                <Cpu width={24} height={24} />
              </div>

              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    margin: 0,
                    lineHeight: 1.25,
                  }}
                >
                  {currentStep === 'branches' && 'GATE Engineering Preparation'}
                  {currentStep === 'institutes' && 'ECE — Electronics & Communication'}
                  {currentStep === 'subjects' && 'Made Easy — GATE ECE'}
                </h1>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: 'var(--text-muted)',
                    margin: '3px 0 0',
                    lineHeight: 1.45,
                  }}
                >
                  {currentStep === 'branches' &&
                    'Syllabus-aligned preparation for Electronics, Electrical, Mechanical & Computer Science branches.'}
                  {currentStep === 'institutes' &&
                    'Select coaching provider to explore specialized modules for Electronics & Communication Engineering.'}
                  {currentStep === 'subjects' &&
                    'Curated subject playlists and full-length video courses from Made Easy faculty.'}
                </p>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-pill)',
                padding: '6px 14px',
                boxShadow: 'var(--sh-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
                <Layers width={14} height={14} style={{ color: '#f59e0b' }} />
                <span>1 Branch (ECE)</span>
              </div>
              <span style={{ color: 'var(--border)' }}>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                <Video width={13} height={13} style={{ color: '#10b981' }} />
                <span>36 Lectures</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            STEP 1: BRANCH SELECTION (ECE FOLDER APPEARS)
            ========================================================= */}
        {currentStep === 'branches' && (
          <div className="gate-branches-step animate-fade-in">
            <div style={{ marginBottom: '18px' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                Select Engineering Branch
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Explore comprehensive coaching modules curated by engineering disciplines.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {/* ECE FOLDER CARD */}
              <div
                onClick={handleOpenEce}
                className="subject-discipline-card"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-xl)',
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'var(--sh-card)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Accent Line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  }}
                />

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--r-lg)',
                        background: 'rgba(245, 158, 11, 0.12)',
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Cpu width={24} height={24} />
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 'var(--r-pill)',
                        background: 'rgba(245, 158, 11, 0.12)',
                        color: '#f59e0b',
                      }}
                    >
                      Active Track
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '19px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      margin: '0 0 6px',
                    }}
                  >
                    ECE (Electronics & Communication)
                  </h3>

                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      margin: '0 0 16px',
                      lineHeight: 1.45,
                    }}
                  >
                    Signals & Systems, Network Theory, Electronic Devices, Analog & Digital Circuits, Communication Systems, and Control Systems.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--bg-card-subtle)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      Made Easy Faculty
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--bg-card-subtle)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      36 Lectures
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    <Video width={12} height={12} style={{ color: '#f59e0b' }} />
                    <span>36 Video Lectures</span>
                  </span>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#f59e0b',
                      fontWeight: 700,
                    }}
                  >
                    <span>Open ECE Folder</span>
                    <ArrowRight width={14} height={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 2: INSTITUTE SELECTION (MADE EASY FOLDER APPEARS)
            ========================================================= */}
        {currentStep === 'institutes' && (
          <div className="gate-institutes-step animate-fade-in">
            <div style={{ marginBottom: '18px' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                ECE Coaching Tracks
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Select coaching provider folder to view organized subject modules.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {/* MADE EASY FOLDER CARD */}
              <div
                onClick={handleOpenMadeEasy}
                className="subject-discipline-card"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-xl)',
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'var(--sh-card)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  }}
                />

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--r-lg)',
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <GraduationCap width={24} height={24} />
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 'var(--r-pill)',
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: '#6366f1',
                      }}
                    >
                      Made Easy GATE
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '19px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      margin: '0 0 6px',
                    }}
                  >
                    Made Easy
                  </h3>

                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      margin: '0 0 16px',
                      lineHeight: 1.45,
                    }}
                  >
                    Premier GATE preparation modules curated and delivered by renowned Made Easy faculty.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--bg-card-subtle)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      Signal & System (36 Lectures)
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    <Video width={12} height={12} style={{ color: '#6366f1' }} />
                    <span>36 Video Lectures</span>
                  </span>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#6366f1',
                      fontWeight: 700,
                    }}
                  >
                    <span>Open Made Easy Folder</span>
                    <ArrowRight width={14} height={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 3: SUBJECT SELECTION (SIGNAL AND SYSTEM FOLDER APPEARS)
            ========================================================= */}
        {currentStep === 'subjects' && (
          <div className="gate-subjects-step animate-fade-in">
            <div style={{ marginBottom: '18px' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                Made Easy Subjects
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Select a subject folder below to open the lecture playlist and video player.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {/* SIGNAL AND SYSTEM FOLDER CARD */}
              <div
                onClick={handleOpenSignalSystem}
                className="subject-discipline-card"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-xl)',
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'var(--sh-card)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover, #ff5722) 100%)',
                  }}
                />

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--r-lg)',
                        background: 'rgba(255, 107, 74, 0.12)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Folder width={24} height={24} />
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 'var(--r-pill)',
                        background: 'rgba(255, 107, 74, 0.12)',
                        color: 'var(--accent)',
                      }}
                    >
                      36 Lectures
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '19px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      margin: '0 0 6px',
                    }}
                  >
                    Signal and System
                  </h3>

                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      margin: '0 0 16px',
                      lineHeight: 1.45,
                    }}
                  >
                    Complete Signals and Systems curriculum covering CT/DT Signals, Operations, Fourier Series, Laplace Transform, Z-Transform, Sampling, and Digital Filters.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--bg-card-subtle)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      Made Easy Faculty
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--bg-card-subtle)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      HLS High-Speed Stream
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    <Video width={12} height={12} style={{ color: 'var(--accent)' }} />
                    <span>36 Video Lectures</span>
                  </span>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--accent)',
                      fontWeight: 700,
                    }}
                  >
                    <span>Open Lectures Playlist</span>
                    <ArrowRight width={14} height={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
