'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Course, LectureItem } from '@/types';
import { countCourseStats } from '@/lib/coursesData';
import { ArrowLeft, Folder, Search, LayoutGrid, List, Video, FileText, CheckCircle2, Play } from 'lucide-react';

interface CourseModalProps {
  course: Course | null;
  onClose: () => void;
  onPlayVideo: (playlist: LectureItem[], index: number) => void;
  onOpenPdf: (itemOrUrl: LectureItem | string, playlist?: LectureItem[], index?: number) => void;
  watchedUrls: Set<string>;
  initialFolderTabId?: string | null;
  onFolderTabChange?: (tabId: string | null) => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  course,
  onClose,
  onPlayVideo,
  onOpenPdf,
  watchedUrls,
  initialFolderTabId,
  onFolderTabChange,
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

  // Resolve thumbnail for a lecture (using uploaded stutosed thumbnail)
  const getLectureThumb = (item: LectureItem) => {
    return item.thumb || '/thumbnails/all_lecture_thumbnail.jpg';
  };

  return (
    <div id="course-overlay" className="open" role="dialog" aria-modal="true">
      {/* OVERLAY TOP BAR */}
      <div className="overlay-bar">
        <button
          className="btn-back"
          onClick={() => {
            if (course.isFolderMode && activeFolderTabId) {
              setActiveFolderTabId(null);
              setActiveModuleFilter('All Modules');
              onFolderTabChange?.(null);
            } else {
              onClose();
            }
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {course.isFolderMode && activeFolderTabId ? 'Courses' : 'Back'}
        </button>

        <div
          className="overlay-bar-title"
          style={{
            display: isSearchExpanded && window.innerWidth <= 600 ? 'none' : 'block',
          }}
        >
          {course.isFolderMode && selectedFolderTab
            ? `${course.name} • ${selectedFolderTab.label}`
            : course.name}
        </div>

        {/* RIGHT CONTROLS: SEARCH & VIEW MODE SWITCHER */}
        {(!course.isFolderMode || activeFolderTabId) && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* VIEW MODE TOGGLE (LIST / GRID) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: '2px',
                gap: '2px',
              }}
            >
              <button
                onClick={() => handleViewModeChange('list')}
                title="List View"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  background: viewMode === 'list' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'list' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <List width={15} height={15} />
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                title="Grid View"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  background: viewMode === 'grid' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'grid' ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <LayoutGrid width={15} height={15} />
              </button>
            </div>

            {/* EXPANDABLE SEARCH ICON & BAR */}
            <div
              ref={searchContainerRef}
              style={{
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                flex: isSearchExpanded && window.innerWidth <= 600 ? 1 : 'initial',
              }}
            >
              {isSearchExpanded || filterSearch.trim() ? (
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    width: window.innerWidth <= 600 ? '100%' : 'clamp(180px, 30vw, 260px)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: 'fadeIn 0.2s ease-out',
                  }}
                >
                  <Search
                    width={14}
                    height={14}
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
                      height: '36px',
                      padding: '0 12px 0 34px',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--accent)',
                      color: 'var(--text)',
                      fontSize: '13px',
                      outline: 'none',
                      boxShadow: '0 2px 8px rgba(204, 120, 92, 0.15)',
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsSearchExpanded(true);
                    setTimeout(() => searchInputRef.current?.focus(), 50);
                  }}
                  aria-label="Search"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                  className="search-icon-btn"
                >
                  <Search width={16} height={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* OVERLAY HERO STRIP */}
      <div className="overlay-hero-strip" id="overlay-hero-strip">
        <img
          className="overlay-thumb"
          src={selectedFolderTab?.thumb || course.thumb}
          alt=""
          loading="lazy"
        />
        <div className="overlay-info">
          <div className="overlay-course-name">
            {selectedFolderTab ? selectedFolderTab.label : course.name}
          </div>
          <div className="overlay-course-teacher">
            {course.id === 'beu-1st-year'
              ? 'Bihar Engineering University'
              : [course.teacher, selectedFolderTab ? selectedFolderTab.subname : course.subname]
                  .filter(Boolean)
                  .filter((val, idx, arr) => arr.indexOf(val) === idx)
                  .join(' · ')}
          </div>
          <div className="overlay-chips">
            <div className="overlay-chip">
              <Video width={13} height={13} style={{ color: 'var(--accent)' }} />
              <span>{stats.videos} Videos</span>
            </div>
            <div className="overlay-chip">
              <FileText width={13} height={13} style={{ color: 'var(--accent)' }} />
              <span>{stats.resources} Resources</span>
            </div>
          </div>
        </div>
      </div>

      {/* OVERLAY TABS */}
      {/* 1. Normal Course Tabs (Parmar GK, Pratham, Maths, etc.) */}
      {!course.isFolderMode && (
        <div className="overlay-tabs" id="overlay-tabs">
          {course.isParmar && course.parmarData && (
            Object.keys(course.parmarData).map((subj) => (
              <div
                key={subj}
                onClick={() => setActiveTabId(subj)}
                className={`overlay-tab ${activeTabId === subj ? 'active' : ''}`}
              >
                {subj}
              </div>
            ))
          )}

          {course.isPratham && course.prathamBySubject && (
            <>
              <div
                onClick={() => setActiveTabId('__all__')}
                className={`overlay-tab ${activeTabId === '__all__' ? 'active' : ''}`}
              >
                All Subjects
              </div>
              {Object.keys(course.prathamBySubject).map((subj) => (
                <div
                  key={subj}
                  onClick={() => setActiveTabId(subj)}
                  className={`overlay-tab ${activeTabId === subj ? 'active' : ''}`}
                >
                  {subj}
                </div>
              ))}
            </>
          )}

          {!course.isParmar && !course.isPratham && course.tabs && (
            course.tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`overlay-tab ${activeTabId === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. Folder Mode: Module Tabs Bar inside Subject */}
      {course.isFolderMode && activeFolderTabId && folderModules.length > 1 && (
        <div className="overlay-tabs" id="overlay-tabs">
          {folderModules.map((mod) => (
            <div
              key={mod}
              onClick={() => setActiveModuleFilter(mod)}
              className={`overlay-tab ${activeModuleFilter === mod ? 'active' : ''}`}
            >
              {mod}
            </div>
          ))}
        </div>
      )}

      {/* 3. Folder Mode: Videos / PDFs Media Type Filter (only when inside a folder tab) */}
      {course.isFolderMode && activeFolderTabId && (() => {
        const tab = course.tabs?.find((t) => t.id === activeFolderTabId);
        const items = tab?.items || [];
        const videoCount = items.filter((i) => i.type !== 'pdf').length;
        const pdfCount = items.filter((i) => i.type === 'pdf').length;
        if (pdfCount === 0) return null; // no PDFs = no filter needed
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg)',
              overflowX: 'auto',
            }}
          >
            {([
              { key: 'all' as const, label: `All (${items.length})` },
              { key: 'videos' as const, label: `▶ Videos (${videoCount})` },
              { key: 'pdfs' as const, label: `📄 Notes & PDFs (${pdfCount})` },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveMediaFilter(key)}
                style={{
                  padding: '5px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '100px',
                  border: '1.5px solid',
                  borderColor: activeMediaFilter === key ? 'var(--accent)' : 'var(--border)',
                  background: activeMediaFilter === key ? 'var(--accent)' : 'transparent',
                  color: activeMediaFilter === key ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        );
      })()}

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
                      src={tab.thumb || course.thumb}
                      alt=""
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
                            if (isVideo) {
                              onPlayVideo([{ label: lec.title, url, type: 'hls' }], 0);
                            } else {
                              onOpenPdf({ label: lec.title + ' • Notes', url, type: 'pdf' });
                            }
                          }}
                        >
                          {isVideo ? '▶ Watch' : k.replace('_', ' ').toUpperCase()}
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
                  const thumb = getLectureThumb(item);

                  return (
                    <div
                      key={idx}
                      data-lecture-url={item.url}
                      className={`lecture-card-grid ${isWatched ? 'watched' : ''}`}
                      onClick={() => {
                        saveMemory(item.url);
                        if (isPdf) {
                          onOpenPdf(item, activeItems, idx);
                        } else {
                          onPlayVideo(activeItems, idx);
                        }
                      }}
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
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)',
                            color: isPdf ? '#ff9f7d' : '#85e0a3',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                          }}
                        >
                          {isPdf ? 'PDF' : 'Video'}
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
                            {item.subject || (isPdf ? 'Lecture Notes' : 'Lecture Video')}
                          </span>
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

                  return (
                    <div
                      key={idx}
                      data-lecture-url={item.url}
                      className={`video-row ${isWatched ? 'watched' : ''}`}
                      onClick={() => {
                        saveMemory(item.url);
                        if (isPdf) {
                          onOpenPdf(item, activeItems, idx);
                        } else {
                          onPlayVideo(activeItems, idx);
                        }
                      }}
                    >
                      <div className="video-num">{idx + 1}</div>
                      <div className={`video-icon ${isPdf ? 'vicon-ext' : 'vicon-hls'}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isPdf ? <FileText width={14} height={14} /> : <Play width={13} height={13} fill="currentColor" />}
                      </div>
                      <div className="video-body">
                        <div className="video-title">{item.label}</div>
                        <div className="video-sub">{item.subject || course.name}</div>
                      </div>
                      <div className="watched-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 width={12} height={12} />
                        <span>Watched</span>
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
