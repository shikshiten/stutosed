'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Course, LectureItem } from '@/types';
import { countCourseStats } from '@/lib/coursesData';
import { getSubjectThumbnail } from '@/lib/subjectThumbnails';
import { getWorkerProxyUrl } from '@/lib/proxyConfig';
import { ArrowLeft, Folder, Search, LayoutGrid, List, Video, FileText, CheckCircle2, Play, Download, ExternalLink, Menu } from 'lucide-react';

interface CourseModalProps {
  course: Course | null;
  onClose: () => void;
  onPlayVideo: (playlist: LectureItem[], index: number) => void;
  onOpenPdf: (itemOrUrl: LectureItem | string, playlist?: LectureItem[], index?: number) => void;
  watchedUrls: Set<string>;
  initialFolderTabId?: string | null;
  onFolderTabChange?: (tabId: string | null) => void;
  theme?: 'light' | 'dark';
  onOpenSidebar?: () => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  course,
  onClose,
  onPlayVideo,
  onOpenPdf,
  watchedUrls,
  initialFolderTabId,
  onFolderTabChange,
  theme,
  onOpenSidebar,
}) => {
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [activeFolderTabId, setActiveFolderTabId] = useState<string | null>(initialFolderTabId || null);
  const [activeModuleFilter, setActiveModuleFilter] = useState<string>('All Modules');
  const [activeMediaFilter, setActiveMediaFilter] = useState<'all' | 'videos' | 'pdfs'>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [expandedParmarIdx, setExpandedParmarIdx] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Load saved view mode preference (defaults to grid)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('stutosed_lecture_view_mode') as 'list' | 'grid';
      if (saved === 'list' || saved === 'grid') setViewMode(saved);
    } catch {}
  }, []);

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    try {
      localStorage.setItem('stutosed_lecture_view_mode', mode);
    } catch {}
  };

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!course) return;
    setFilterSearch('');
    setIsSearchExpanded(false);
    setExpandedParmarIdx(null);
    setActiveModuleFilter('All Modules');

    if (course.isFolderMode) {
      if (initialFolderTabId) {
        setActiveFolderTabId(initialFolderTabId);
        setActiveTabId(initialFolderTabId);
      } else {
        setActiveFolderTabId(null);
        if (course.tabs && course.tabs.length > 0) {
          setActiveTabId(course.tabs[0].id);
        }
      }
    } else if (course.isParmar && course.parmarData) {
      const keys = Object.keys(course.parmarData);
      setActiveTabId(keys[0] || '');
    } else if (course.isPratham && course.prathamBySubject) {
      setActiveTabId('__all__');
    } else if (course.tabs && course.tabs.length > 0) {
      setActiveTabId(course.tabs[0].id);
    }

    // Auto-resume memory setup for non-folder courses
    if (!course.isFolderMode) {
      const memoryRaw = localStorage.getItem(`stutosed-last-lec-${course.id}`);
      if (memoryRaw) {
        try {
          const mem = JSON.parse(memoryRaw);
          if (mem.tabId) {
            setActiveTabId(mem.tabId);
          }
          setTimeout(() => {
            if (mem.url) {
              const el = document.querySelector(`[data-lecture-url="${CSS.escape(mem.url)}"]`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }, 300);
        } catch {}
      }
    }
  }, [course]);

  // Sync folder tab when initialFolderTabId prop changes from back navigation / popstate
  useEffect(() => {
    if (course?.isFolderMode) {
      setActiveFolderTabId(initialFolderTabId || null);
      if (initialFolderTabId) {
        setActiveTabId(initialFolderTabId);
      }
    }
  }, [initialFolderTabId, course?.isFolderMode]);

  // Click outside to collapse search if empty
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        if (!filterSearch.trim()) {
          setIsSearchExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterSearch]);

  // Selected folder tab (if inside folder mode)
  const selectedFolderTab = course?.isFolderMode && activeFolderTabId
    ? course.tabs?.find((t) => t.id === activeFolderTabId)
    : null;

  // Extract distinct modules / subjects for folder mode (e.g. ECE/EE/EEE or Engineering Chemistry)
  const folderModules = useMemo(() => {
    if (!selectedFolderTab) return [];
    const set = new Set<string>();
    selectedFolderTab.items.forEach((it) => {
      if (it.subject) set.add(it.subject);
    });
    const list = Array.from(set);
    const isModuleNaming = list.some((s) => s.toLowerCase().startsWith('module'));
    const allLabel = isModuleNaming ? 'All Modules' : 'All Subjects';
    return [allLabel, ...list];
  }, [selectedFolderTab]);

  const activeItems = useMemo(() => {
    if (!course) return [];
    const search = filterSearch.toLowerCase().trim();

    if (course.isPratham && course.prathamBySubject) {
      if (activeTabId === '__all__') {
        const all: LectureItem[] = [];
        Object.entries(course.prathamBySubject).forEach(([subj, items]) => {
          if (subj === 'No Topic') return;
          items.forEach((it) => all.push({ ...it, subject: subj }));
        });
        return search
          ? all.filter(
              (i) =>
                (i.label || '').toLowerCase().includes(search) ||
                (i.subject || '').toLowerCase().includes(search)
            )
          : all;
      } else {
        const items = course.prathamBySubject[activeTabId] || [];
        return search ? items.filter((i) => (i.label || '').toLowerCase().includes(search)) : items;
      }
    }

    if (course.isFolderMode && activeFolderTabId) {
      const tab = course.tabs?.find((t) => t.id === activeFolderTabId);
      let items = tab ? tab.items : [];

      // Filter by module/subject if selected
      if (activeModuleFilter !== 'All Modules' && activeModuleFilter !== 'All Subjects') {
        items = items.filter((i) => i.subject === activeModuleFilter);
      }

      // Filter by media type (Videos / Notes & PDFs)
      if (activeMediaFilter === 'videos') {
        items = items.filter((i) => i.type !== 'pdf');
      } else if (activeMediaFilter === 'pdfs') {
        items = items.filter((i) => i.type === 'pdf');
      }

      return search
        ? items.filter(
            (i) =>
              (i.label || '').toLowerCase().includes(search) ||
              (i.subject || '').toLowerCase().includes(search)
          )
        : items;
    }

    if (course.tabs) {
      const tab = course.tabs.find((t) => t.id === activeTabId);
      const items = tab ? tab.items : [];
      return search
        ? items.filter(
            (i) =>
              (i.label || '').toLowerCase().includes(search) ||
              (i.subject || '').toLowerCase().includes(search)
          )
        : items;
    }

    return [];
  }, [course, activeTabId, activeFolderTabId, activeModuleFilter, activeMediaFilter, filterSearch]);

  if (!course) return null;
  const stats = countCourseStats(course);

  const saveMemory = (url: string) => {
    localStorage.setItem(
      `stutosed-last-lec-${course.id}`,
      JSON.stringify({
        tabId: course.isFolderMode ? activeFolderTabId : activeTabId,
        url,
        timestamp: Date.now(),
      })
    );
  };

  // Centralized Canonical Subject Thumbnail Resolver
  const getLectureThumb = (item: LectureItem) => {
    const currentTab = course.tabs?.find((t) => t.id === activeTabId) || selectedFolderTab;
    return getSubjectThumbnail(
      item.subject || item.label,
      item.thumb || currentTab?.thumb || course.thumb,
      currentTab?.label || currentTab?.id || course.subject || course.name,
      theme
    );
  };

  // Detect YouTube video URLs
  const isYouTubeItem = (item: LectureItem) => {
    const u = item.url || '';
    return item.type === 'youtube' || u.includes('youtube.com') || u.includes('youtu.be');
  };

  // Direct download PDF handler
  const handleDownloadPdf = async (e: React.MouseEvent, item: LectureItem) => {
    e.stopPropagation();
    const filename = `${item.label.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || 'document'}.pdf`;
    const downloadApiUrl = getWorkerProxyUrl(item.url, 'pdf');
    try {
      const res = await fetch(downloadApiUrl);
      if (!res.ok) throw new Error('Download error');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(downloadApiUrl, '_blank');
    }
  };

  // Centralized lecture item click handler (direct YouTube open, PDF modal, or video player)
  const handleItemClick = (item: LectureItem, idx: number) => {
    saveMemory(item.url);
    if (isYouTubeItem(item)) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (item.type === 'pdf') {
      onOpenPdf(item, activeItems, idx);
    } else {
      onPlayVideo(activeItems, idx);
    }
  };

  return (
    <div id="course-overlay" className="open" role="dialog" aria-modal="true">
      {/* 1. TOP STICKY APP BAR */}
      <div className="overlay-bar">
        {/* Left: Hamburger Drawer Menu Button */}
        <button
          className="overlay-icon-btn"
          onClick={onOpenSidebar}
          aria-label="Open navigation sidebar"
          title="Open Menu"
        >
          <Menu width={20} height={20} strokeWidth={2.2} />
        </button>

        {/* Right: Expandable Search Bar */}
        <div
          ref={searchContainerRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            marginLeft: 'auto',
            width: isSearchExpanded ? 'min(320px, calc(100vw - 80px))' : 'auto',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {isSearchExpanded || filterSearch.trim() ? (
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Search
                width={15}
                height={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: 'var(--accent)',
                  pointerEvents: 'none',
                }}
              />
              <input
                ref={searchInputRef}
                id="overlay-search"
                type="search"
                placeholder="Search topics, lectures…"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                onBlur={() => {
                  if (!filterSearch.trim()) {
                    setIsSearchExpanded(false);
                  }
                }}
                autoFocus
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 34px 0 36px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--accent)',
                  color: 'var(--text)',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(204, 120, 92, 0.15)',
                }}
              />
              {filterSearch && (
                <button
                  onClick={() => setFilterSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '2px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                setIsSearchExpanded(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              aria-label="Search"
              title="Search lectures"
              className="overlay-icon-btn"
            >
              <Search width={18} height={18} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      {/* 2. COURSE IDENTITY & BACK BUTTON */}
      <div className="overlay-course-header">
        <button
          className="overlay-header-back-btn"
          onClick={() => {
            if (course.isFolderMode && activeFolderTabId) {
              setActiveFolderTabId(null);
              setActiveModuleFilter('All Modules');
              onFolderTabChange?.(null);
            } else {
              onClose();
            }
          }}
          title={course.isFolderMode && activeFolderTabId ? 'Back to Subject Folders' : 'Close Course'}
          aria-label="Back"
        >
          <ArrowLeft width={18} height={18} strokeWidth={2.4} />
        </button>

        <div className="overlay-header-titles">
          <h2 className="overlay-header-title">
            {course.id === 'beu-1st-year' ? '1st year' : course.name}
          </h2>
          <div className="overlay-header-sub">
            {course.id === 'beu-1st-year'
              ? `${selectedFolderTab ? selectedFolderTab.label + ' · ' : ''}Bihar Engineering University`
              : [course.teacher, selectedFolderTab ? selectedFolderTab.subname : course.subname]
                  .filter(Boolean)
                  .filter((val, idx, arr) => arr.indexOf(val) === idx)
                  .join(' · ')}
          </div>
        </div>
      </div>

      {/* 3. HORIZONTAL PILL TABS (NO SCROLLBAR SLIDER) */}
      {/* Normal course tabs */}
      {!course.isFolderMode && (
        <div className="overlay-pill-tabs no-scrollbar" id="overlay-tabs">
          {course.isParmar && course.parmarData && (
            Object.keys(course.parmarData).map((subj) => (
              <button
                key={subj}
                onClick={() => setActiveTabId(subj)}
                className={`pill-tab-item ${activeTabId === subj ? 'active' : ''}`}
              >
                {subj}
              </button>
            ))
          )}

          {course.isPratham && course.prathamBySubject && (
            <>
              <button
                onClick={() => setActiveTabId('__all__')}
                className={`pill-tab-item ${activeTabId === '__all__' ? 'active' : ''}`}
              >
                All subjects
              </button>
              {Object.keys(course.prathamBySubject).map((subj) => (
                <button
                  key={subj}
                  onClick={() => setActiveTabId(subj)}
                  className={`pill-tab-item ${activeTabId === subj ? 'active' : ''}`}
                >
                  {subj}
                </button>
              ))}
            </>
          )}

          {!course.isParmar && !course.isPratham && course.tabs && (
            course.tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`pill-tab-item ${activeTabId === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))
          )}
        </div>
      )}

      {/* Folder mode subject module tabs */}
      {course.isFolderMode && activeFolderTabId && folderModules.length > 1 && (
        <div className="overlay-pill-tabs no-scrollbar" id="overlay-tabs">
          {folderModules.map((mod) => (
            <button
              key={mod}
              onClick={() => setActiveModuleFilter(mod)}
              className={`pill-tab-item ${activeModuleFilter === mod ? 'active' : ''}`}
            >
              {mod}
            </button>
          ))}
        </div>
      )}

      {/* 4. CONTROLS STRIP (VIEW TOGGLE & LECTURE COUNT) */}
      {(!course.isFolderMode || activeFolderTabId) && (
        <div className="overlay-controls-strip">
          <div className="controls-left-group">
            <div className="view-mode-segmented">
              <button
                onClick={() => handleViewModeChange('list')}
                title="List View"
                aria-label="List View"
                className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              >
                <List width={16} height={16} strokeWidth={2.2} />
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                title="Grid View"
                aria-label="Grid View"
                className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              >
                <LayoutGrid width={16} height={16} strokeWidth={2.2} />
              </button>
            </div>
            <span className="lecture-count-badge">
              {activeItems.length} {activeItems.length === 1 ? 'lecture' : 'lectures'}
            </span>
          </div>

          {/* Media Type Filter (All / Videos / Notes & PDFs) */}
          {course.isFolderMode && activeFolderTabId && (() => {
            const tab = course.tabs?.find((t) => t.id === activeFolderTabId);
            const items = tab?.items || [];
            const pdfCount = items.filter((i) => i.type === 'pdf').length;
            if (pdfCount === 0) return null;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {([
                  { key: 'all' as const, label: 'All' },
                  { key: 'videos' as const, label: 'Videos' },
                  { key: 'pdfs' as const, label: 'PDFs' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveMediaFilter(key)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      borderRadius: 'var(--r-pill)',
                      border: '1px solid',
                      borderColor: activeMediaFilter === key ? 'var(--accent)' : 'var(--border)',
                      background: activeMediaFilter === key ? 'var(--accent)' : 'transparent',
                      color: activeMediaFilter === key ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* OVERLAY CONTENT */}
      <div className="overlay-content" id="overlay-content">
        {/* CASE 1: FOLDER MODE ROOT (Show Subject Folders Grid) */}
        {course.isFolderMode && !activeFolderTabId ? (
          <div style={{ padding: '24px 20px 48px', maxWidth: '840px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Folder width={20} height={20} style={{ color: 'var(--accent)' }} />
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                Courses
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {course.tabs?.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => {
                    setActiveFolderTabId(tab.id);
                    setActiveTabId(tab.id);
                    onFolderTabChange?.(tab.id);
                    const isModuleNaming = tab.items.some((it) => it.subject?.toLowerCase().startsWith('module'));
                    setActiveModuleFilter(isModuleNaming ? 'All Modules' : 'All Subjects');
                    setActiveMediaFilter('all');
                  }}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-xl)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: 'var(--sh-card)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  className="subject-folder-card"
                >
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      overflow: 'hidden',
                      position: 'relative',
                      background: 'var(--bg-card-hover)',
                    }}
                  >
                    <img
                      src={getSubjectThumbnail(tab.label, tab.thumb || course.thumb, tab.id, theme)}
                      alt=""
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('all_course_thumbnail.jpg')) {
                          target.src = '/thumbnails/all_course_thumbnail.jpg';
                        }
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        background: 'rgba(0,0,0,0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 'var(--r-pill)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Video width={12} height={12} />
                      <span>{tab.items.length} Lectures</span>
                    </div>
                  </div>

                  <div style={{ padding: '18px 20px' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '18px',
                        fontWeight: 700,
                        color: 'var(--text)',
                        marginBottom: '6px',
                      }}
                    >
                      {tab.label}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      {tab.subname || `${tab.items.length} Lectures Available`}
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--accent)',
                      }}
                    >
                      <span>Open Subject</span> →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : course.isParmar && course.parmarData ? (
          /* CASE 2: PARMAR ACCORDION */
          <div className="parmar-subj-block">
            {((course.parmarData[activeTabId] || { lectures: [] }).lectures).map((lec, idx) => {
              const isOpen = expandedParmarIdx === idx;
              return (
                <div key={idx} className={`parmar-lec ${isOpen ? 'open' : ''}`}>
                  <div
                    className="parmar-lec-header"
                    onClick={() => setExpandedParmarIdx(isOpen ? null : idx)}
                  >
                    <div className="parmar-lec-name">{lec.title}</div>
                    <div className="parmar-lec-toggle">▼</div>
                  </div>
                  <div className="parmar-lec-links">
                    {Object.entries(lec.links).map(([k, url]) => {
                      const isVideo = k === 'url';
                      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
                      let btnClass = 'plk plk-watch';
                      if (k === 'en_pdf') btnClass = 'plk plk-en';
                      if (k === 'hi_pdf') btnClass = 'plk plk-hi';
                      if (k === 'quiz') btnClass = 'plk plk-quiz';
                      if (k === 'notes') btnClass = 'plk plk-dl';

                      return (
                        <button
                          key={k}
                          className={btnClass}
                          onClick={() => {
                            saveMemory(url);
                            if (isYouTube) {
                              window.open(url, '_blank', 'noopener,noreferrer');
                            } else if (isVideo) {
                              onPlayVideo([{ label: lec.title, url, type: 'hls' }], 0);
                            } else {
                              onOpenPdf({ label: lec.title + ' • Notes', url, type: 'pdf' });
                            }
                          }}
                        >
                          {isYouTube ? '▶ Open YouTube' : isVideo ? '▶ Watch' : k.replace('_', ' ').toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* CASE 3: VIDEO & RESOURCE LIST / GRID */
          <div>
            {course.isFolderMode && activeFolderTabId && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                }}
              >
                <button
                  onClick={() => {
                    setActiveFolderTabId(null);
                    setActiveModuleFilter('All Modules');
                    onFolderTabChange?.(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <ArrowLeft width={16} height={16} />
                  <span>Back to Courses</span>
                </button>

                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Showing {activeItems.length} lectures
                </span>
              </div>
            )}

            {activeItems.length === 0 ? (
              <div className="no-results">No resources found in this category.</div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW */
              <div className="lecture-grid-container">
                {activeItems.map((item, idx) => {
                  const isWatched = watchedUrls.has(item.url);
                  const isPdf = item.type === 'pdf';
                  const isYt = isYouTubeItem(item);
                  const thumb = getLectureThumb(item);

                  return (
                    <div
                      key={idx}
                      data-lecture-url={item.url}
                      className={`lecture-card-grid ${isWatched ? 'watched' : ''}`}
                      onClick={() => handleItemClick(item, idx)}
                    >
                      {/* 16:9 Thumbnail Cover */}
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '16/9',
                          overflow: 'hidden',
                          background: 'var(--bg-card-hover)',
                        }}
                      >
                        <img
                          src={thumb}
                          alt=""
                          className="grid-thumb-img"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.includes('all_lecture_thumbnail.jpg')) {
                              target.src = '/thumbnails/all_lecture_thumbnail.jpg';
                            }
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 80%)',
                          }}
                        />

                        {/* Lecture Index Badge */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            background: 'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(4px)',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 'var(--r-pill)',
                            border: '1px solid rgba(255,255,255,0.15)',
                          }}
                        >
                          #{idx + 1}
                        </div>

                        {/* Watched Badge */}
                        {isWatched && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              background: 'rgba(93,184,114,0.95)',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 'var(--r-pill)',
                            }}
                          >
                            ✓ Watched
                          </div>
                        )}

                        {/* Subject Tag on bottom of thumbnail */}
                        {item.subject && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              left: '10px',
                              color: 'rgba(255,255,255,0.9)',
                              fontSize: '11px',
                              fontWeight: 600,
                              textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                            }}
                          >
                            {item.subject}
                          </div>
                        )}

                        {/* Subtle type badge on thumbnail */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '10px',
                            background: 'rgba(0,0,0,0.65)',
                            backdropFilter: 'blur(4px)',
                            color: isPdf ? '#ff9f7d' : isYt ? '#ff6b6b' : '#85e0a3',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                          }}
                        >
                          {isPdf ? 'PDF Notes' : isYt ? 'YouTube' : 'Video'}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div
                        style={{
                          padding: '14px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          flex: 1,
                          justifyContent: 'space-between',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text)',
                            lineHeight: 1.35,
                            marginBottom: '8px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {item.label}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '8px',
                            borderTop: '1px solid var(--border)',
                          }}
                        >
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                            {item.subject || (isPdf ? 'Document Notes' : isYt ? 'YouTube Lecture' : 'Video Lecture')}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isPdf && (
                              <button
                                onClick={(e) => handleDownloadPdf(e, item)}
                                title="Download PDF directly"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: 'var(--accent)',
                                  background: 'var(--bg)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 'var(--r-sm)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Download width={12} height={12} />
                                <span>Download</span>
                              </button>
                            )}

                            {isYt && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#ff4b4b',
                                }}
                              >
                                <ExternalLink width={11} height={11} /> Open
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW (Clean rows as originally designed) */
              <div className="video-list">
                {activeItems.map((item, idx) => {
                  const isWatched = watchedUrls.has(item.url);
                  const isPdf = item.type === 'pdf';
                  const isYt = isYouTubeItem(item);

                  return (
                    <div
                      key={idx}
                      data-lecture-url={item.url}
                      className={`video-row ${isWatched ? 'watched' : ''}`}
                      onClick={() => handleItemClick(item, idx)}
                    >
                      <div className="video-num">{idx + 1}</div>
                      <div
                        className={`video-icon ${isPdf ? 'vicon-ext' : 'vicon-hls'}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isYt ? '#ff4b4b' : undefined,
                        }}
                      >
                        {isPdf ? (
                          <FileText width={14} height={14} />
                        ) : isYt ? (
                          <ExternalLink width={13} height={13} />
                        ) : (
                          <Play width={13} height={13} fill="currentColor" />
                        )}
                      </div>
                      <div className="video-body">
                        <div className="video-title">{item.label}</div>
                        <div className="video-sub">
                          {item.subject || course.name} {isYt && '• YouTube Direct'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isPdf && (
                          <button
                            onClick={(e) => handleDownloadPdf(e, item)}
                            title="Download PDF"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: 'var(--r-sm)',
                              border: '1px solid var(--border)',
                              background: 'var(--bg-card)',
                              color: 'var(--accent)',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Download width={12} height={12} />
                            <span>Download</span>
                          </button>
                        )}

                        <div className="watched-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 width={12} height={12} />
                          <span>Watched</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
