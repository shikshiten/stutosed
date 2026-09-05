'use client';

/**
 * Student Library & Bookmarks Storage Engine
 * Persists bookmarked batches and saved lectures organized by batch folders.
 */

export interface SavedVideoItem {
  id: string; // unique URL or ID
  label: string;
  url: string;
  courseId: string;
  courseName: string;
  courseCategory?: string;
  subject?: string;
  savedAt: number;
  type?: string;
  servers?: any[];
  links?: Record<string, string>;
}

export interface CourseVideoFolder {
  courseId: string;
  courseName: string;
  category?: string;
  videos: SavedVideoItem[];
}

const BOOKMARK_KEY = 'stutosed_bookmarked_courses';
const SAVED_VIDEOS_KEY = 'stutosed_saved_videos';

/**
 * ── BOOKMARKED COURSES (BATCHES) ──
 */
export function getBookmarkedCourseIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isCourseBookmarked(courseId: string): boolean {
  return getBookmarkedCourseIds().includes(courseId);
}

export function toggleCourseBookmark(courseId: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getBookmarkedCourseIds();
  const exists = current.includes(courseId);
  const next = exists ? current.filter((id) => id !== courseId) : [...current, courseId];
  try {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('stutosed_library_updated'));
  } catch {}
  return !exists;
}

/**
 * ── SAVED VIDEOS (ORGANIZED BY BATCH FOLDERS) ──
 */
export function getSavedVideos(): SavedVideoItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_VIDEOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isVideoSaved(urlOrId: string): boolean {
  if (!urlOrId) return false;
  return getSavedVideos().some((v) => v.id === urlOrId || v.url === urlOrId);
}

export function toggleSaveVideo(video: Omit<SavedVideoItem, 'savedAt'>): boolean {
  if (typeof window === 'undefined') return false;
  const current = getSavedVideos();
  const exists = current.some((v) => v.id === video.id || v.url === video.url);

  let next: SavedVideoItem[];
  if (exists) {
    next = current.filter((v) => v.id !== video.id && v.url !== video.url);
  } else {
    next = [{ ...video, savedAt: Date.now() }, ...current];
  }

  try {
    localStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('stutosed_library_updated'));
  } catch {}

  return !exists;
}

export function removeSavedVideo(idOrUrl: string): void {
  if (typeof window === 'undefined') return;
  const current = getSavedVideos();
  const next = current.filter((v) => v.id !== idOrUrl && v.url !== idOrUrl);
  try {
    localStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('stutosed_library_updated'));
  } catch {}
}

/**
 * Group saved videos into Batch Folders automatically
 */
export function getSavedVideosGroupedByBatch(): CourseVideoFolder[] {
  const videos = getSavedVideos();
  const groupMap = new Map<string, CourseVideoFolder>();

  for (const video of videos) {
    const key = video.courseId || video.courseName || 'Other Batches';
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        courseId: video.courseId,
        courseName: video.courseName,
        category: video.courseCategory,
        videos: [],
      });
    }
    groupMap.get(key)!.videos.push(video);
  }

  return Array.from(groupMap.values()).sort((a, b) =>
    a.courseName.localeCompare(b.courseName, undefined, { numeric: true })
  );
}
