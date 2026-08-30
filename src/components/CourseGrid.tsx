'use client';

import React, { useState, useMemo } from 'react';
import { Course } from '@/types';
import { countCourseStats } from '@/lib/coursesData';
import { getSubjectThumbnail } from '@/lib/subjectThumbnails';
import { Search, Video, FileText, ArrowRight, Layers } from 'lucide-react';

interface CourseGridProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  theme?: 'light' | 'dark';
}

export const CourseGrid: React.FC<CourseGridProps> = ({
  courses,
  onSelectCourse,
  searchInputRef,
  theme,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  // Extract unique subjects safely
  const subjects = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.subject) set.add(c.subject);
    });
    const list = Array.from(set);
    return list.length > 1 ? ['All', ...list] : [];
  }, [courses]);

  // Filter courses based on search & subject safely
  const filteredCourses = useMemo(() => {
    const s = (search || '').trim().toLowerCase();
    return courses.filter((c) => {
      const matchesSubject = selectedSubject === 'All' || !c.subject || c.subject === selectedSubject;
      const matchesSearch =
        s === '' ||
        (c.name || '').toLowerCase().includes(s) ||
        (c.subname || '').toLowerCase().includes(s) ||
        (c.teacher || '').toLowerCase().includes(s) ||
        (c.subject || '').toLowerCase().includes(s);
      return matchesSubject && matchesSearch;
    });
  }, [courses, selectedSubject, search]);

  return (
    <>
      {/* SEARCH BAR */}
      <div id="search-bar">
        <div className="search-wrap">
          <Search className="search-icon-el" width={17} height={17} />
          <input
            ref={searchInputRef}
            id="search-input"
            type="search"
            placeholder="Search courses, topics, subjects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {/* COURSES GRID SECTION */}
      <section id="courses-section">
        <div className="section-head">
          <div className="section-tag">
            <Layers width={13} height={13} />
            <span>All Courses</span>
          </div>
          <h2 className="section-title">Pick Your Subject</h2>
          <p className="section-sub">Curated batches from expert educators</p>

          {/* Subject Filter Pills (only show if multiple subjects exist) */}
          {subjects.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
              {subjects.map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
                  className="tag"
                  style={{
                    cursor: 'pointer',
                    padding: '7px 18px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: 'var(--r-pill)',
                    border: selectedSubject === subj ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: selectedSubject === subj ? 'var(--accent)' : 'var(--bg-card)',
                    color: selectedSubject === subj ? '#ffffff' : 'var(--text-muted)',
                    boxShadow: selectedSubject === subj ? '0 2px 10px var(--accent-glow)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {subj}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="courses-grid" id="courses-grid">
          {filteredCourses.length === 0 ? (
            <div className="no-results-grid">
              No courses found matching your search.
            </div>
          ) : (
            filteredCourses.map((course) => {
              const stats = countCourseStats(course);
              const thumbUrl = getSubjectThumbnail(course.subject || course.name, course.thumb, course.id, theme);
              return (
                <div
                  key={course.id}
                  className="course-card"
                  onClick={() => onSelectCourse(course)}
                >
                  <img
                    className="course-thumb"
                    src={thumbUrl}
                    alt={course.name || 'Course'}
                    loading="lazy"
                  />
                  <div className="course-body">
                    <div className="course-tags">
                      <span className="tag tag-vid" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Video width={11} height={11} />
                        <span>{stats.videos} VIDEOS</span>
                      </span>
                      <span className="tag tag-pdf" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FileText width={11} height={11} />
                        <span>{stats.resources} PDFS</span>
                      </span>
                    </div>
                    <h3 className="course-name">{course.name}</h3>
                    {course.teacher && <div className="course-teacher">{course.teacher}</div>}
                    {course.subname && (!course.teacher || course.subname.trim().toLowerCase() !== course.teacher.trim().toLowerCase()) && (
                      <div className="course-meta">{course.subname}</div>
                    )}
                    <div className="course-open-hint">
                      <span>Open Course</span>
                      <ArrowRight width={14} height={14} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </>
  );
};
