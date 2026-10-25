'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Course } from '@/types';
import { countCourseStats } from '@/lib/coursesData';
import { getSubjectThumbnail } from '@/lib/subjectThumbnails';
import {
  Calculator,
  BookOpen,
  Brain,
  Globe,
  Layers,
  Search,
  Video,
  FileText,
  ArrowRight,
  ArrowLeft,
  User,
  Sparkles,
  LayoutGrid,
  List,
  GraduationCap,
  Trophy,
  CheckCircle2,
  X,
  Compass,
  Award,
  Monitor,
  Landmark,
} from 'lucide-react';

export type GovtDisciplineId = 'banking' | 'maths' | 'english' | 'reasoning' | 'gk' | 'computer' | 'complete-ssc';

interface GovtDisciplineDef {
  id: GovtDisciplineId;
  title: string;
  shortTitle: string;
  subjectMatches: string[];
  description: string;
  icon: React.ComponentType<{ width?: number; height?: number; className?: string; style?: React.CSSProperties }>;
  accentColor: string;
  accentDim: string;
  accentGradient: string;
  featuredEducators: string[];
}

export const GOVT_DISCIPLINES: GovtDisciplineDef[] = [
  {
    id: 'banking',
    title: 'Banking Exams (IBPS, SBI, RBI, RRB)',
    shortTitle: 'Banking Exams',
    subjectMatches: ['Banking'],
    description: 'SBI PO/Clerk, IBPS PO/Clerk, RRB, and RBI preparation with Complete Quantitative Aptitude & Speed Maths.',
    icon: Landmark,
    accentColor: '#0ea5e9',
    accentDim: 'rgba(14, 165, 233, 0.12)',
    accentGradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    featuredEducators: ['Aashish Arora Sir', 'Banking Quant Faculty'],
  },
  {
    id: 'maths',
    title: 'Quantitative Aptitude / Mathematics',
    shortTitle: 'Mathematics',
    subjectMatches: ['Maths'],
    description: 'Complete Arithmetic, Advanced Algebra, Geometry, Trigonometry, and Calculation Speed mastery.',
    icon: Calculator,
    accentColor: '#6366f1',
    accentDim: 'rgba(99, 102, 241, 0.12)',
    accentGradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    featuredEducators: ['Gagan Pratap Sir', 'Abhinay Sharma Sir', 'Maths Faculty'],
  },
  {
    id: 'english',
    title: 'English Language & Comprehension',
    shortTitle: 'English',
    subjectMatches: ['English'],
    description: 'Comprehensive Grammar rules, Vocabulary flashcards, Cloze tests, and Reading Comprehension.',
    icon: BookOpen,
    accentColor: '#10b981',
    accentDim: 'rgba(16, 185, 129, 0.12)',
    accentGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    featuredEducators: ['Gopal Verma Sir', 'English Faculty'],
  },
  {
    id: 'reasoning',
    title: 'General Intelligence & Reasoning',
    shortTitle: 'Reasoning',
    subjectMatches: ['Reasoning'],
    description: 'Verbal, Non-Verbal, Analytical puzzles, Syllogisms, Critical thinking, and Speed test series.',
    icon: Brain,
    accentColor: '#f59e0b',
    accentDim: 'rgba(245, 158, 11, 0.12)',
    accentGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    featuredEducators: ['Piyush Varshney Sir', 'Reasoning Faculty'],
  },
  {
    id: 'gk',
    title: 'General Studies (GK/GS)',
    shortTitle: 'General Studies (GK/GS)',
    subjectMatches: ['General Knowledge'],
    description: 'Static GK, General Science, Indian History, Polity, Geography, and Revision lectures.',
    icon: Globe,
    accentColor: '#06b6d4',
    accentDim: 'rgba(6, 182, 212, 0.12)',
    accentGradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    featuredEducators: ['Parmar Sir'],
  },
  {
    id: 'computer',
    title: 'Computer Awareness & Special',
    shortTitle: 'Computer Awareness',
    subjectMatches: ['Computer'],
    description: 'Computer fundamentals, hardware/software, networking, MS Office, and SSC qualifying syllabus.',
    icon: Monitor,
    accentColor: '#3b82f6',
    accentDim: 'rgba(59, 130, 246, 0.12)',
    accentGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    featuredEducators: ['Yatendra Sir'],
  },
  {
    id: 'complete-ssc',
    title: 'Complete SSC / Combined Batches',
    shortTitle: 'Combined Batches',
    subjectMatches: ['SSC Complete'],
    description: 'All 4 Subjects (Maths + English + Reasoning + GS) bundled in integrated, exam-targeted programs.',
    icon: Trophy,
    accentColor: '#8b5cf6',
    accentDim: 'rgba(139, 92, 246, 0.12)',
    accentGradient: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
    featuredEducators: ['Selection Faculty', 'Multiple Teachers', 'SSC Faculty'],
  },
];

interface GovernmentExamsViewProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  theme?: 'light' | 'dark';
  initialDiscipline?: GovtDisciplineId | null;
  onDisciplineChange?: (discipline: GovtDisciplineId | null) => void;
}

export const GovernmentExamsView: React.FC<GovernmentExamsViewProps> = ({
  courses,
  onSelectCourse,
  theme = 'light',
  initialDiscipline = null,
  onDisciplineChange,
}) => {
  // Navigation State: null = Level 1 (Discipline Hub), or a GovtDisciplineId = Level 2 (Sub-Folder)
  const [activeDiscipline, setActiveDiscipline] = useState<GovtDisciplineId | null>(initialDiscipline);
  const [globalSearch, setGlobalSearch] = useState('');
  const [subSearch, setSubSearch] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (initialDiscipline !== undefined) {
      setActiveDiscipline(initialDiscipline);
    }
  }, [initialDiscipline]);

  const handleSelectDiscipline = (discId: GovtDisciplineId | null) => {
    setActiveDiscipline(discId);
    setSelectedFaculty('All');
    setSubSearch('');
    if (onDisciplineChange) {
      onDisciplineChange(discId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Map courses to disciplines
  const disciplineStats = useMemo(() => {
    const map = new Map<GovtDisciplineId, { courses: Course[]; videoCount: number; pdfCount: number }>();

    GOVT_DISCIPLINES.forEach((disc) => {
      const discCourses = courses.filter((c) => disc.subjectMatches.includes(c.subject || ''));
      let vCount = 0;
      let pCount = 0;
      discCourses.forEach((c) => {
        const stats = countCourseStats(c);
        vCount += stats.videos;
        pCount += stats.resources;
      });
      map.set(disc.id, { courses: discCourses, videoCount: vCount, pdfCount: pCount });
    });

    return map;
  }, [courses]);

  // Overall Govt Exams Stats
  const overallStats = useMemo(() => {
    let totalVideos = 0;
    let totalPDFs = 0;
    courses.forEach((c) => {
      const stats = countCourseStats(c);
      totalVideos += stats.videos;
      totalPDFs += stats.resources;
    });
    return {
      totalCourses: courses.length,
      totalVideos,
      totalPDFs,
    };
  }, [courses]);

  // Active discipline definition & courses
  const currentDisciplineDef = useMemo(() => {
    if (!activeDiscipline) return null;
    return GOVT_DISCIPLINES.find((d) => d.id === activeDiscipline) || null;
  }, [activeDiscipline]);

  const currentDisciplineCourses = useMemo(() => {
    if (!currentDisciplineDef) return [];
    return courses.filter((c) => currentDisciplineDef.subjectMatches.includes(c.subject || ''));
  }, [courses, currentDisciplineDef]);

  // Extract unique faculties in the current discipline
  const availableFaculties = useMemo(() => {
    const teachers = new Set<string>();
    currentDisciplineCourses.forEach((c) => {
      if (c.teacher) teachers.add(c.teacher.trim());
    });
    const list = Array.from(teachers);
    return list.length > 1 ? ['All', ...list] : [];
  }, [currentDisciplineCourses]);

  // Scoped filtered courses for Level 2
  const filteredSubCourses = useMemo(() => {
    const q = (subSearch || '').trim().toLowerCase();
    return currentDisciplineCourses.filter((c) => {
      const matchFaculty = selectedFaculty === 'All' || c.teacher?.trim() === selectedFaculty;
      const matchQuery =
        q === '' ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.subname || '').toLowerCase().includes(q) ||
        (c.teacher || '').toLowerCase().includes(q);
      return matchFaculty && matchQuery;
    });
  }, [currentDisciplineCourses, selectedFaculty, subSearch]);

  // Global search results across all govt courses (when searching in Level 1)
  const globalSearchResults = useMemo(() => {
    const q = (globalSearch || '').trim().toLowerCase();
    if (!q) return [];
    return courses.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.subname || '').toLowerCase().includes(q) ||
        (c.teacher || '').toLowerCase().includes(q) ||
        (c.subject || '').toLowerCase().includes(q)
    );
  }, [courses, globalSearch]);

  return (
    <div className="gov-exams-container animate-fade-in" style={{ padding: '8px 0 48px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* =========================================================
            HEADER & BREADCRUMBS
            ========================================================= */}
        <div style={{ marginBottom: '24px' }}>
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
            {activeDiscipline ? (
              <>
                <button
                  onClick={() => handleSelectDiscipline(null)}
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
                  <span>All Govt Subjects</span>
                </button>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{currentDisciplineDef?.shortTitle}</span>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Government Exam Preparation Hub</span>
              </>
            )}
          </div>

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
                  background: activeDiscipline ? currentDisciplineDef?.accentDim : 'rgba(99, 102, 241, 0.12)',
                  color: activeDiscipline ? currentDisciplineDef?.accentColor : '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: activeDiscipline ? `0 4px 14px ${currentDisciplineDef?.accentDim}` : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {activeDiscipline && currentDisciplineDef ? (
                  <currentDisciplineDef.icon width={24} height={24} />
                ) : (
                  <Layers width={24} height={24} />
                )}
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
                  {activeDiscipline && currentDisciplineDef
                    ? currentDisciplineDef.title
                    : 'Government Exam Courses'}
                </h1>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: 'var(--text-muted)',
                    margin: '3px 0 0',
                    lineHeight: 1.45,
                  }}
                >
                  {activeDiscipline && currentDisciplineDef
                    ? currentDisciplineDef.description
                    : 'Structured curriculum folders for SSC CGL, CHSL, MTS, CPO, Railway, and State Examinations.'}
                </p>
              </div>
            </div>

            {/* Overall Quick Stats Badge Cluster */}
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
                <Layers width={14} height={14} style={{ color: 'var(--accent)' }} />
                <span>
                  {activeDiscipline ? currentDisciplineCourses.length : overallStats.totalCourses} Batches
                </span>
              </div>
              <span style={{ color: 'var(--border)' }}>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                <Video width={13} height={13} style={{ color: '#10b981' }} />
                <span>
                  {activeDiscipline
                    ? disciplineStats.get(activeDiscipline)?.videoCount || 0
                    : overallStats.totalVideos}+ Videos
                </span>
              </div>
              <span style={{ color: 'var(--border)' }}>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                <FileText width={13} height={13} style={{ color: '#06b6d4' }} />
                <span>
                  {activeDiscipline
                    ? disciplineStats.get(activeDiscipline)?.pdfCount || 0
                    : overallStats.totalPDFs}+ PDFs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            LEVEL 1: CATEGORY SELECTION HUB
            ========================================================= */}
        {!activeDiscipline && (
          <div className="gov-level-1-hub">
            {/* Global Search Bar */}
            <div style={{ marginBottom: '28px' }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '720px',
                  margin: '0 auto',
                }}
              >
                <Search
                  width={18}
                  height={18}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="search"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Quick search all Govt courses, teachers, or topics (e.g. Gagan Sir, Geometry, English)..."
                  style={{
                    width: '100%',
                    padding: '13px 44px 13px 46px',
                    borderRadius: 'var(--r-pill)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    fontSize: '14px',
                    color: 'var(--text)',
                    boxShadow: 'var(--sh-card)',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
                {globalSearch && (
                  <button
                    onClick={() => setGlobalSearch('')}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <X width={16} height={16} />
                  </button>
                )}
              </div>
            </div>

            {/* IF GLOBAL SEARCH IS ACTIVE: Show Instant Search Results */}
            {globalSearch.trim() !== '' ? (
              <div style={{ marginBottom: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                    Search Results ({globalSearchResults.length} batches found)
                  </h2>
                  <button
                    onClick={() => setGlobalSearch('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Clear Search & View Subject Folders
                  </button>
                </div>

                {globalSearchResults.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '48px 24px',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--r-xl)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>No courses match &ldquo;{globalSearch}&rdquo;</p>
                    <p style={{ margin: '6px 0 0', fontSize: '13px' }}>Try searching by educator name or subject.</p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '18px',
                    }}
                  >
                    {globalSearchResults.map((course) => (
                      <CourseCardItem
                        key={course.id}
                        course={course}
                        onSelectCourse={onSelectCourse}
                        theme={theme}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '16px' }}>
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
                    Explore by Subject Discipline
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Select a subject folder below to discover specialized faculty batches and focused study material.
                  </p>
                </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                      gap: '20px',
                    }}
                  >
                    {GOVT_DISCIPLINES.map((disc) => {
                      const stat = disciplineStats.get(disc.id) || { courses: [], videoCount: 0, pdfCount: 0 };
                      const DiscIcon = disc.icon;

                      return (
                        <div
                          key={disc.id}
                          onClick={() => handleSelectDiscipline(disc.id)}
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
                          {/* Corner Glow Accent */}
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '4px',
                              background: disc.accentGradient,
                            }}
                          />

                          <div>
                            {/* Card Top: Icon & Folder Badge */}
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
                                  background: disc.accentDim,
                                  color: disc.accentColor,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <DiscIcon width={24} height={24} />
                              </div>

                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: 'var(--r-pill)',
                                  background: disc.accentDim,
                                  color: disc.accentColor,
                                }}
                              >
                                {stat.courses.length} Batches
                              </span>
                            </div>

                            {/* Title & Description */}
                            <h3
                              style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '18px',
                                fontWeight: 700,
                                color: 'var(--text)',
                                margin: '0 0 6px',
                                lineHeight: 1.3,
                              }}
                            >
                              {disc.title}
                            </h3>

                            <p
                              style={{
                                fontSize: '13px',
                                color: 'var(--text-muted)',
                                margin: '0 0 16px',
                                lineHeight: 1.45,
                              }}
                            >
                              {disc.description}
                            </p>

                            {/* Featured Educators Pills */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                              {disc.featuredEducators.map((edu) => (
                                <span
                                  key={edu}
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
                                  {edu}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Card Footer: Metadata Counts & Arrow Action */}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                <Video width={12} height={12} style={{ color: disc.accentColor }} />
                                <span>{stat.videoCount} Videos</span>
                              </span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                <FileText width={12} height={12} style={{ color: disc.accentColor }} />
                                <span>{stat.pdfCount} PDFs</span>
                              </span>
                            </div>

                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: disc.accentColor,
                                fontWeight: 700,
                              }}
                            >
                              <span>Explore</span>
                              <ArrowRight width={14} height={14} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
            )}
          </div>
        )}

        {/* =========================================================
            LEVEL 2: CONTENT DISCOVERY (DISCIPLINE SUB-VIEW)
            ========================================================= */}
        {activeDiscipline && currentDisciplineDef && (
          <div className="gov-level-2-subview animate-fade-in">
            {/* Toolbar: Faculty Filter Pills, In-Discipline Search, View Mode Toggle */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-xl)',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: 'var(--sh-card)',
              }}
            >
              {/* Left: Faculty Filter Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginRight: '4px' }}>
                  Faculty:
                </span>
                {availableFaculties.map((fac) => {
                  const isSelected = selectedFaculty === fac;
                  return (
                    <button
                      key={fac}
                      onClick={() => setSelectedFaculty(fac)}
                      style={{
                        cursor: 'pointer',
                        padding: '5px 13px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        borderRadius: 'var(--r-pill)',
                        border: isSelected ? `1px solid ${currentDisciplineDef.accentColor}` : '1px solid var(--border)',
                        background: isSelected ? currentDisciplineDef.accentColor : 'var(--bg-card-subtle)',
                        color: isSelected ? '#ffffff' : 'var(--text-muted)',
                        boxShadow: isSelected ? `0 2px 8px ${currentDisciplineDef.accentDim}` : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {fac === 'All' ? 'All Educators' : fac}
                    </button>
                  );
                })}
              </div>

              {/* Right: Search & View Mode Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search
                    width={14}
                    height={14}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="search"
                    placeholder={`Filter ${currentDisciplineDef.shortTitle}...`}
                    value={subSearch}
                    onChange={(e) => setSubSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 28px 7px 32px',
                      borderRadius: 'var(--r-pill)',
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      color: 'var(--text)',
                      outline: 'none',
                    }}
                  />
                  {subSearch && (
                    <button
                      onClick={() => setSubSearch('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      <X width={12} height={12} />
                    </button>
                  )}
                </div>

                {/* View Mode Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--bg-card-subtle)',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    padding: '2px',
                  }}
                >
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                    style={{
                      background: viewMode === 'grid' ? 'var(--bg-card)' : 'none',
                      border: 'none',
                      borderRadius: 'var(--r-sm)',
                      padding: '5px 8px',
                      color: viewMode === 'grid' ? 'var(--text)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      boxShadow: viewMode === 'grid' ? 'var(--sh-card)' : 'none',
                    }}
                  >
                    <LayoutGrid width={15} height={15} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    title="List View"
                    style={{
                      background: viewMode === 'list' ? 'var(--bg-card)' : 'none',
                      border: 'none',
                      borderRadius: 'var(--r-sm)',
                      padding: '5px 8px',
                      color: viewMode === 'list' ? 'var(--text)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      boxShadow: viewMode === 'list' ? 'var(--sh-card)' : 'none',
                    }}
                  >
                    <List width={15} height={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Courses Display */}
            {filteredSubCourses.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 24px',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--r-xl)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>No batches found in this category.</p>
                <p style={{ margin: '6px 0 16px', fontSize: '13px' }}>
                  Try resetting your faculty or search filters.
                </p>
                <button
                  onClick={() => {
                    setSelectedFaculty('All');
                    setSubSearch('');
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--r-pill)',
                    background: 'var(--accent)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                  gap: '20px',
                }}
              >
                {filteredSubCourses.map((course) => (
                  <CourseCardItem
                    key={course.id}
                    course={course}
                    onSelectCourse={onSelectCourse}
                    theme={theme}
                    disciplineColor={currentDisciplineDef.accentColor}
                  />
                ))}
              </div>
            ) : (
              /* COMPACT LIST VIEW */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {filteredSubCourses.map((course) => (
                  <CourseListItem
                    key={course.id}
                    course={course}
                    onSelectCourse={onSelectCourse}
                    theme={theme}
                    disciplineColor={currentDisciplineDef.accentColor}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* =====================================================================
   SUB-COMPONENT 1: COURSE CARD ITEM (Grid View with Elevated Metadata)
   ===================================================================== */
interface CourseCardItemProps {
  course: Course;
  onSelectCourse: (course: Course) => void;
  theme: 'light' | 'dark';
  disciplineColor?: string;
  isCombinedHighlight?: boolean;
}

const CourseCardItem: React.FC<CourseCardItemProps> = ({
  course,
  onSelectCourse,
  theme,
  disciplineColor,
  isCombinedHighlight = false,
}) => {
  const stats = countCourseStats(course);
  const thumbUrl = getSubjectThumbnail(course.subject || course.name, course.thumb, course.id, theme);

  return (
    <div
      onClick={() => onSelectCourse(course)}
      className="course-card-enhanced"
      style={{
        background: 'var(--bg-card)',
        border: isCombinedHighlight
          ? '1px solid rgba(139, 92, 246, 0.35)'
          : '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--sh-card)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
      }}
    >
      {/* Thumbnail with overlay badge */}
      <div style={{ position: 'relative', width: '100%', height: '148px', overflow: 'hidden', background: 'var(--bg-card-subtle)' }}>
        <img
          src={thumbUrl}
          alt={course.name}
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            const fallback = `/thumbnails/default_course_${theme === 'dark' ? 'dark' : 'light'}.svg`;
            if (!target.src.includes('default_course')) {
              target.src = fallback;
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.35s ease',
          }}
        />

        {/* Top-Right Tag */}
        {isCombinedHighlight && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              padding: '3px 8px',
              borderRadius: 'var(--r-pill)',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Sparkles width={10} height={10} style={{ color: '#f59e0b' }} />
            <span>All-In-One</span>
          </div>
        )}

        {/* Subject Pill overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            padding: '3px 9px',
            borderRadius: 'var(--r-pill)',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(6px)',
            color: disciplineColor || '#ffffff',
            fontSize: '10.5px',
            fontWeight: 700,
          }}
        >
          {course.subject || 'Govt Exam'}
        </div>
      </div>

      {/* Course Body */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Course Name */}
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '15.5px',
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 6px',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {course.name}
          </h3>

          {/* Faculty / Instructor Line */}
          {course.teacher && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '14px',
              }}
            >
              <User width={13} height={13} style={{ color: disciplineColor || 'var(--accent)' }} />
              <span>{course.teacher}</span>
            </div>
          )}
        </div>

        <div>
          {/* Metadata Metrics Cluster: Video Count & PDF Count */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: 'var(--r-md)',
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border)',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 600, color: 'var(--text)' }}>
              <Video width={13} height={13} style={{ color: '#10b981' }} />
              <span>{stats.videos} Videos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 600, color: 'var(--text)' }}>
              <FileText width={13} height={13} style={{ color: '#06b6d4' }} />
              <span>{stats.resources} PDFs</span>
            </div>
          </div>

          {/* Open Course Action Hint */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontWeight: 700,
              color: disciplineColor || 'var(--accent)',
              paddingTop: '4px',
            }}
          >
            <span>Open Syllabus</span>
            <ArrowRight width={14} height={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* =====================================================================
   SUB-COMPONENT 2: COURSE LIST ITEM (Dense View for High Legibility)
   ===================================================================== */
interface CourseListItemProps {
  course: Course;
  onSelectCourse: (course: Course) => void;
  theme: 'light' | 'dark';
  disciplineColor?: string;
}

const CourseListItem: React.FC<CourseListItemProps> = ({
  course,
  onSelectCourse,
  theme,
  disciplineColor,
}) => {
  const stats = countCourseStats(course);
  const thumbUrl = getSubjectThumbnail(course.subject || course.name, course.thumb, course.id, theme);

  return (
    <div
      onClick={() => onSelectCourse(course)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        gap: '16px',
        boxShadow: 'var(--sh-card)',
        transition: 'all 0.2s ease',
      }}
      className="course-list-item-hover"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <img
          src={thumbUrl}
          alt={course.name}
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            const fallback = `/thumbnails/default_course_${theme === 'dark' ? 'dark' : 'light'}.svg`;
            if (!target.src.includes('default_course')) target.src = fallback;
          }}
          style={{
            width: '64px',
            height: '42px',
            borderRadius: 'var(--r-md)',
            objectFit: 'cover',
            flexShrink: 0,
            border: '1px solid var(--border)',
          }}
        />

        <div style={{ minWidth: 0 }}>
          <h4
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14.5px',
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {course.name}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {course.teacher && <span>👤 {course.teacher}</span>}
            {course.subname && <span>• {course.subname}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        {/* Stats Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '5px 12px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border)',
            fontSize: '11.5px',
            fontWeight: 600,
            color: 'var(--text)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Video width={12} height={12} style={{ color: '#10b981' }} />
            <span>{stats.videos} vids</span>
          </span>
          <span style={{ color: 'var(--border)' }}>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FileText width={12} height={12} style={{ color: '#06b6d4' }} />
            <span>{stats.resources} pdfs</span>
          </span>
        </div>

        <button
          style={{
            background: 'none',
            border: 'none',
            color: disciplineColor || 'var(--accent)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 700,
            fontSize: '12.5px',
            cursor: 'pointer',
          }}
        >
          <span>Open</span>
          <ArrowRight width={14} height={14} />
        </button>
      </div>
    </div>
  );
};
