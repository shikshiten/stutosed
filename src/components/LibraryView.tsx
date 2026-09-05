'use client';

import React, { useState, useEffect } from 'react';
import { Course, LectureItem } from '@/types';
import { INITIAL_COURSES } from '@/lib/coursesData';
import {
  getBookmarkedCourseIds,
  toggleCourseBookmark,
  getSavedVideosGroupedByBatch,
  removeSavedVideo,
  CourseVideoFolder,
  SavedVideoItem,
} from '@/lib/libraryStorage';
import {
  BookmarkCheck,
  FolderHeart,
  Play,
  Trash2,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Folder,
  Layers,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface LibraryViewProps {
  onSelectCourse: (course: Course) => void;
  onPlayVideo: (playlist: LectureItem[], index: number, courseName: string) => void;
  onBackHome: () => void;
  onExploreCourses: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onSelectCourse,
  onPlayVideo,
  onBackHome,
  onExploreCourses,
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'saved-videos'>('saved-videos');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [batchFolders, setBatchFolders] = useState<CourseVideoFolder[]>([]);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);

  // Sync state from localStorage and listen to real-time updates
  const reloadLibrary = () => {
    const bIds = getBookmarkedCourseIds();
    setBookmarkedIds(bIds);

    const folders = getSavedVideosGroupedByBatch();
    setBatchFolders(folders);

    // Auto-expand first folder if none expanded
    if (folders.length > 0 && !expandedFolderId) {
      setExpandedFolderId(folders[0].courseId);
    }
  };

  useEffect(() => {
    reloadLibrary();

    const handleUpdate = () => reloadLibrary();
    window.addEventListener('stutosed_library_updated', handleUpdate);
    return () => window.removeEventListener('stutosed_library_updated', handleUpdate);
  }, []);

  const bookmarkedCourses = INITIAL_COURSES.filter((c) => bookmarkedIds.includes(c.id));
  const totalSavedVideos = batchFolders.reduce((acc, f) => acc + f.videos.length, 0);

  const handlePlaySavedLecture = (folder: CourseVideoFolder, videoIdx: number) => {
    const playlist: LectureItem[] = folder.videos.map((v) => ({
      id: v.id,
      label: v.label,
      url: v.url,
      type: (v.type as any) || 'stream',
      servers: v.servers,
      links: v.links,
    }));
    onPlayVideo(playlist, videoIdx, folder.courseName);
  };

  return (
    <div className="library-view-container animate-fade-in">
      {/* Top Navigation Header */}
      <div className="library-header-bar">
        <button className="library-back-btn" onClick={onBackHome}>
          <ArrowLeft width={18} height={18} />
          <span>Back to Home</span>
        </button>

        <div className="library-header-title-box">
          <div className="library-badge">
            <BookmarkCheck width={14} height={14} />
            <span>Personalized Learning Hub</span>
          </div>
          <h1 className="library-main-title">My Study Library</h1>
          <p className="library-subtitle">
            Aapke bookmarked batches aur batch-wise saved video lectures yahan automatically organized hain.
          </p>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="library-tabs-dock">
        <button
          className={`library-tab-pill ${activeTab === 'saved-videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved-videos')}
        >
          <FolderHeart width={16} height={16} />
          <span>Saved Videos by Batch</span>
          <span className="tab-count-tag">{totalSavedVideos}</span>
        </button>

        <button
          className={`library-tab-pill ${activeTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          <BookmarkCheck width={16} height={16} />
          <span>Bookmarked Batches</span>
          <span className="tab-count-tag">{bookmarkedCourses.length}</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: SAVED VIDEOS (ORGANIZED INTO AUTOMATIC BATCH FOLDERS)
          ========================================================================= */}
      {activeTab === 'saved-videos' && (
        <div className="library-section">
          {batchFolders.length === 0 ? (
            <div className="library-empty-state">
              <div className="empty-icon-wrap">
                <FolderHeart width={36} height={36} color="var(--accent)" />
              </div>
              <h3>Koi Saved Video Nahi Hai</h3>
              <p>
                Jab aap kisi bhi lecture ko dekhte waqt <b>Save Video</b> par click karenge,
                toh woh automatic apne batch folder me save ho jayega.
              </p>
              <button className="library-action-btn" onClick={onExploreCourses}>
                <BookOpen width={16} height={16} />
                <span>Explore All Batches</span>
              </button>
            </div>
          ) : (
            <div className="batch-folders-list">
              {batchFolders.map((folder) => {
                const isExpanded = expandedFolderId === folder.courseId;
                const matchedCourse = INITIAL_COURSES.find((c) => c.id === folder.courseId);

                return (
                  <div key={folder.courseId} className="batch-folder-card">
                    {/* Folder Header Banner */}
                    <div
                      className={`folder-card-header ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => setExpandedFolderId(isExpanded ? null : folder.courseId)}
                    >
                      <div className="folder-meta-left">
                        <div className="folder-icon-box">
                          <Folder width={22} height={22} color="var(--accent)" />
                        </div>
                        <div>
                          <div className="folder-batch-name">{folder.courseName}</div>
                          <div className="folder-stats-sub">
                            <span>{folder.videos.length} Saved Lectures</span>
                            {folder.category && (
                              <>
                                <span className="dot">•</span>
                                <span style={{ textTransform: 'capitalize' }}>{folder.category}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="folder-toggle-right">
                        {matchedCourse && (
                          <button
                            className="folder-open-batch-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCourse(matchedCourse);
                            }}
                            title="Open Full Batch Course"
                          >
                            <span>Open Full Batch</span>
                            <ChevronRight width={14} height={14} />
                          </button>
                        )}
                        <div className={`folder-arrow ${isExpanded ? 'open' : ''}`}>▼</div>
                      </div>
                    </div>

                    {/* Folder Videos Drawer */}
                    {isExpanded && (
                      <div className="folder-videos-drawer animate-fade-in">
                        {folder.videos.map((vid, idx) => (
                          <div key={vid.id || idx} className="saved-video-row">
                            <div className="saved-video-left">
                              <span className="saved-video-idx">#{idx + 1}</span>
                              <div className="saved-video-info">
                                <div className="saved-video-title">{vid.label}</div>
                                {vid.subject && (
                                  <span className="saved-video-subject-pill">{vid.subject}</span>
                                )}
                              </div>
                            </div>

                            <div className="saved-video-actions">
                              <button
                                className="saved-video-play-btn"
                                onClick={() => handlePlaySavedLecture(folder, idx)}
                              >
                                <Play width={14} height={14} fill="currentColor" />
                                <span>Play Now</span>
                              </button>
                              <button
                                className="saved-video-remove-btn"
                                onClick={() => removeSavedVideo(vid.id || vid.url)}
                                title="Remove from saved"
                              >
                                <Trash2 width={15} height={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: BOOKMARKED BATCHES (COURSES)
          ========================================================================= */}
      {activeTab === 'bookmarks' && (
        <div className="library-section">
          {bookmarkedCourses.length === 0 ? (
            <div className="library-empty-state">
              <div className="empty-icon-wrap">
                <BookmarkCheck width={36} height={36} color="var(--accent)" />
              </div>
              <h3>Koi Bookmarked Batch Nahi Hai</h3>
              <p>
                Aap kisi bhi Batch ke card par ya video page par <b>Bookmark Batch</b> click karke use yahan pin kar sakte hain.
              </p>
              <button className="library-action-btn" onClick={onExploreCourses}>
                <BookOpen width={16} height={16} />
                <span>Explore All Batches</span>
              </button>
            </div>
          ) : (
            <div className="bookmarked-courses-grid">
              {bookmarkedCourses.map((course) => (
                <div key={course.id} className="bookmarked-course-card">
                  <div
                    className="bookmarked-course-click"
                    onClick={() => onSelectCourse(course)}
                  >
                    <div className="bookmarked-card-thumb">
                      <img
                        src={course.thumb || '/assets/courses/placeholder.jpg'}
                        alt={course.name}
                        className="bookmarked-thumb-img"
                      />
                      <span className="bookmarked-category-chip">
                        {(course.category === 'beu' || course.id.startsWith('beu')) ? 'BEU Engineering' : 'Govt Exams'}
                      </span>
                    </div>

                    <div className="bookmarked-card-body">
                      <h3 className="bookmarked-card-title">{course.name}</h3>
                      <p className="bookmarked-card-desc">
                        {course.desc || course.subname || 'Comprehensive structured academic batch.'}
                      </p>
                    </div>
                  </div>

                  <div className="bookmarked-card-footer">
                    <button
                      className="bookmarked-open-btn"
                      onClick={() => onSelectCourse(course)}
                    >
                      <BookOpen width={14} height={14} />
                      <span>Open Batch</span>
                    </button>
                    <button
                      className="bookmarked-remove-btn"
                      onClick={() => toggleCourseBookmark(course.id)}
                      title="Remove Bookmark"
                    >
                      <Trash2 width={15} height={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
