import 'server-only';
import { createClient } from '@/lib/supabase/server';

export interface WatchHistoryItem {
  lecture_url: string;
  watched_at: string;
  course_id?: string;
}

export interface CourseMemoryItem {
  course_id: string;
  last_tab_id: string;
  last_lecture_url: string;
  updated_at: string;
}

export interface VideoProgressItem {
  lecture_id: string;
  seconds: number;
}

export interface BookmarkItem {
  course_id: string;
}

export interface SavedVideoItem {
  video_data: {
    url: string;
    title: string;
    courseName?: string;
    subjectName?: string;
    savedAt?: number;
    [key: string]: unknown;
  };
}

export async function getWatchHistory(userId: string): Promise<WatchHistoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_watch_history')
    .select('lecture_url, watched_at, course_id')
    .eq('user_id', userId);

  if (error) {
    console.warn('[user-progress.repo] Error fetching watch history:', error.message);
    return [];
  }
  return data ?? [];
}

export async function upsertWatchHistory(
  userId: string,
  courseId: string,
  lectureUrl: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('user_watch_history').upsert(
    {
      user_id: userId,
      course_id: courseId || 'unknown',
      lecture_url: lectureUrl,
      watched_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lecture_url' }
  );

  if (error) {
    console.warn('[user-progress.repo] Error upserting watch history:', error.message);
  }
}

export async function getCourseMemory(userId: string): Promise<CourseMemoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_course_memory')
    .select('course_id, last_tab_id, last_lecture_url, updated_at')
    .eq('user_id', userId);

  if (error) {
    console.warn('[user-progress.repo] Error fetching course memory:', error.message);
    return [];
  }
  return data ?? [];
}

export async function upsertCourseMemory(
  userId: string,
  courseId: string,
  lastTabId: string,
  lastLectureUrl: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('user_course_memory').upsert(
    {
      user_id: userId,
      course_id: courseId,
      last_tab_id: lastTabId,
      last_lecture_url: lastLectureUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,course_id' }
  );

  if (error) {
    console.warn('[user-progress.repo] Error upserting course memory:', error.message);
  }
}

export async function getVideoProgress(userId: string): Promise<VideoProgressItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_video_progress')
    .select('lecture_id, seconds')
    .eq('user_id', userId);

  if (error) {
    console.warn('[user-progress.repo] Error fetching video progress:', error.message);
    return [];
  }
  return data ?? [];
}

export async function upsertVideoProgress(
  userId: string,
  lectureId: string,
  seconds: number
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('user_video_progress').upsert(
    {
      user_id: userId,
      lecture_id: lectureId,
      seconds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lecture_id' }
  );

  if (error) {
    console.warn('[user-progress.repo] Error upserting video progress:', error.message);
  }
}

export async function getBookmarks(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_bookmarks')
    .select('course_id')
    .eq('user_id', userId);

  if (error) {
    console.warn('[user-progress.repo] Error fetching bookmarks:', error.message);
    return [];
  }
  return (data ?? []).map((row: { course_id: string }) => row.course_id);
}

export async function upsertBookmark(userId: string, courseId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('user_bookmarks').upsert(
    {
      user_id: userId,
      course_id: courseId,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,course_id' }
  );

  if (error) {
    console.warn('[user-progress.repo] Error upserting bookmark:', error.message);
  }
}

export async function deleteBookmark(userId: string, courseId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('user_bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (error) {
    console.warn('[user-progress.repo] Error deleting bookmark:', error.message);
  }
}

export async function getSavedVideos(userId: string): Promise<SavedVideoItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_saved_videos')
    .select('video_data')
    .eq('user_id', userId);

  if (error) {
    console.warn('[user-progress.repo] Error fetching saved videos:', error.message);
    return [];
  }
  return data ?? [];
}

export async function upsertSavedVideo(
  userId: string,
  videoData: SavedVideoItem['video_data']
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('user_saved_videos').upsert(
    {
      user_id: userId,
      video_url: videoData.url,
      video_data: videoData,
      saved_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,video_url' }
  );

  if (error) {
    console.warn('[user-progress.repo] Error upserting saved video:', error.message);
  }
}

export async function deleteSavedVideo(userId: string, videoUrl: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('user_saved_videos')
    .delete()
    .eq('user_id', userId)
    .eq('video_url', videoUrl);

  if (error) {
    console.warn('[user-progress.repo] Error deleting saved video:', error.message);
  }
}
