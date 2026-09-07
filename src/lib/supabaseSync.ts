'use client';

/**
 * Supabase Cloud Progress & Library Sync Engine
 * Synchronizes student watch history, video playback positions, course memory,
 * and library bookmarks with Supabase PostgreSQL, while providing an instant,
 * offline-resilient localStorage fallback.
 */

import { createClient } from '@/lib/supabase/client';
import { SavedVideoItem } from '@/lib/libraryStorage';

const WATCHED_KEY_V1 = 'onafbu_watched_v1';
const WATCHED_KEY_LEGACY = 'stutosed_watched_lectures';
const LAST_PLAYED_KEY_V1 = 'stutosed_last_played_v1';
const LAST_PLAYED_KEY_LEGACY = 'stutosed_last_played';
const BOOKMARK_KEY = 'stutosed_bookmarked_courses';
const SAVED_VIDEOS_KEY = 'stutosed_saved_videos';

// Throttling timer for video progress upserts (prevent flooding Supabase DB)
const progressThrottleMap = new Map<string, number>();

/**
 * Helper to get currently logged-in user ID without throwing
 */
async function getCurrentUserId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * 1. RECORD LECTURE WATCHED
 * Writes to local storage immediately, then persists to Supabase if authenticated.
 */
export async function syncLectureWatched(
  courseId: string,
  lectureUrl: string,
  lectureTitle?: string
): Promise<void> {
  if (typeof window === 'undefined' || !lectureUrl) return;

  const now = Date.now();

  // 1. Optimistic LocalStorage update
  try {
    const watchedMap = JSON.parse(localStorage.getItem(WATCHED_KEY_V1) || '{}');
    watchedMap[lectureUrl] = now;
    localStorage.setItem(WATCHED_KEY_V1, JSON.stringify(watchedMap));

    const legacyList = JSON.parse(localStorage.getItem(WATCHED_KEY_LEGACY) || '[]');
    if (!legacyList.includes(lectureUrl)) {
      legacyList.push(lectureUrl);
      localStorage.setItem(WATCHED_KEY_LEGACY, JSON.stringify(legacyList));
    }

    window.dispatchEvent(new Event('stutosed_progress_updated'));
  } catch {}

  // 2. Cloud sync if logged in
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const supabase = createClient();
    await supabase.from('user_watch_history').upsert(
      {
        user_id: userId,
        course_id: courseId || 'unknown',
        lecture_url: lectureUrl,
        watched_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lecture_url' }
    );
  } catch (err) {
    // Graceful fallback: table might not be created yet, silently continue
  }
}

/**
 * 2. RECORD COURSE MEMORY (LAST PLAYED)
 */
export async function syncCourseMemory(
  courseId: string,
  tabId: string,
  lectureUrl: string,
  extraMeta?: { courseName?: string; courseThumb?: string; lectureTitle?: string }
): Promise<void> {
  if (typeof window === 'undefined' || !courseId || !lectureUrl) return;

  const mem = {
    courseId,
    courseName: extraMeta?.courseName || '',
    courseThumb: extraMeta?.courseThumb || '',
    lectureTitle: extraMeta?.lectureTitle || '',
    url: lectureUrl,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(LAST_PLAYED_KEY_V1, JSON.stringify(mem));
    localStorage.setItem(LAST_PLAYED_KEY_LEGACY, JSON.stringify(mem));
  } catch {}

  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const supabase = createClient();
    await supabase.from('user_course_memory').upsert(
      {
        user_id: userId,
        course_id: courseId,
        last_tab_id: tabId || 'videos',
        last_lecture_url: lectureUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id' }
    );
  } catch (err) {
    // Graceful fallback
  }
}

/**
 * 3. RECORD VIDEO PLAYBACK PROGRESS (TIMESTAMP SECONDS)
 * Throttled to at most once every 6 seconds per lecture to conserve database egress.
 */
export async function syncVideoProgress(
  lectureKey: string,
  seconds: number,
  duration?: number
): Promise<void> {
  if (typeof window === 'undefined' || !lectureKey || seconds < 3) return;

  const storageKey = `stutosed_progress_${lectureKey}`;

  try {
    localStorage.setItem(storageKey, String(Math.floor(seconds)));
  } catch {}

  const now = Date.now();
  const lastSync = progressThrottleMap.get(lectureKey) || 0;
  if (now - lastSync < 6000) {
    return; // Throttled
  }
  progressThrottleMap.set(lectureKey, now);

  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const supabase = createClient();
    await supabase.from('user_video_progress').upsert(
      {
        user_id: userId,
        lecture_id: lectureKey,
        seconds: Math.floor(seconds),
        duration: duration ? Math.floor(duration) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lecture_id' }
    );
  } catch (err) {
    // Graceful fallback
  }
}

/**
 * 4. SYNC BOOKMARKS
 */
export async function syncBookmark(courseId: string, isBookmarked: boolean): Promise<void> {
  if (typeof window === 'undefined' || !courseId) return;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const supabase = createClient();
    if (isBookmarked) {
      await supabase.from('user_bookmarks').upsert(
        {
          user_id: userId,
          course_id: courseId,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,course_id' }
      );
    } else {
      await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);
    }
  } catch {}
}

/**
 * 5. SYNC SAVED VIDEO
 */
export async function syncSavedVideo(video: SavedVideoItem, isSaved: boolean): Promise<void> {
  if (typeof window === 'undefined' || !video?.id) return;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const supabase = createClient();
    const videoKey = video.id || video.url;
    if (isSaved) {
      await supabase.from('user_saved_videos').upsert(
        {
          user_id: userId,
          video_id: videoKey,
          video_data: video,
          saved_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,video_id' }
      );
    } else {
      await supabase
        .from('user_saved_videos')
        .delete()
        .eq('user_id', userId)
        .eq('video_id', videoKey);
    }
  } catch {}
}

/**
 * 6. PULL CLOUD USER DATA ON LOGIN
 * Rehydrates bookmarks, watch history, last played, and progress from Supabase into local storage.
 */
export async function pullCloudUserData(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return;

    const supabase = createClient();

    // Query in parallel
    const [watchRes, memoryRes, progressRes, bookmarkRes, savedRes] = await Promise.allSettled([
      supabase.from('user_watch_history').select('lecture_url, watched_at').eq('user_id', userId),
      supabase.from('user_course_memory').select('course_id, last_tab_id, last_lecture_url, updated_at').eq('user_id', userId),
      supabase.from('user_video_progress').select('lecture_id, seconds').eq('user_id', userId),
      supabase.from('user_bookmarks').select('course_id').eq('user_id', userId),
      supabase.from('user_saved_videos').select('video_data').eq('user_id', userId),
    ]);

    // 1. Merge Watch History
    if (watchRes.status === 'fulfilled' && watchRes.value.data) {
      const cloudWatched = watchRes.value.data;
      const localMap = JSON.parse(localStorage.getItem(WATCHED_KEY_V1) || '{}');
      const legacyList = JSON.parse(localStorage.getItem(WATCHED_KEY_LEGACY) || '[]');
      const legacySet = new Set(legacyList);

      for (const row of cloudWatched) {
        if (!localMap[row.lecture_url]) {
          localMap[row.lecture_url] = new Date(row.watched_at).getTime();
        }
        legacySet.add(row.lecture_url);
      }
      localStorage.setItem(WATCHED_KEY_V1, JSON.stringify(localMap));
      localStorage.setItem(WATCHED_KEY_LEGACY, JSON.stringify(Array.from(legacySet)));
    }

    // 2. Merge Video Playback Progress
    if (progressRes.status === 'fulfilled' && progressRes.value.data) {
      for (const row of progressRes.value.data) {
        if (row.lecture_id && row.seconds) {
          const key = `stutosed_progress_${row.lecture_id}`;
          const currentLocal = localStorage.getItem(key);
          if (!currentLocal || parseFloat(currentLocal) < row.seconds) {
            localStorage.setItem(key, String(row.seconds));
          }
        }
      }
    }

    // 3. Merge Bookmarks
    if (bookmarkRes.status === 'fulfilled' && bookmarkRes.value.data) {
      const localBookmarks: string[] = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]');
      const bmSet = new Set(localBookmarks);
      for (const row of bookmarkRes.value.data) {
        if (row.course_id) bmSet.add(row.course_id);
      }
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(Array.from(bmSet)));
    }

    // 4. Merge Saved Videos
    if (savedRes.status === 'fulfilled' && savedRes.value.data) {
      const localSaved: SavedVideoItem[] = JSON.parse(localStorage.getItem(SAVED_VIDEOS_KEY) || '[]');
      const seenIds = new Set(localSaved.map((v) => v.id || v.url));
      for (const row of savedRes.value.data) {
        const v = row.video_data;
        if (v && !seenIds.has(v.id || v.url)) {
          localSaved.push(v);
          seenIds.add(v.id || v.url);
        }
      }
      localStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(localSaved));
    }

    // Notify listeners to update active views
    window.dispatchEvent(new Event('stutosed_library_updated'));
    window.dispatchEvent(new Event('stutosed_progress_updated'));
  } catch (e) {
    // Silent catch
  }
}
