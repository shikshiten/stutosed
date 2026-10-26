import { Course } from '@/types';
import manifestData from '@/data/courses-manifest.json';

// In-memory cache for on-demand lazy loaded course details
const courseDetailsCache = new Map<string, Course>();

// Lightweight manifest list of all courses (~10 KB total) for dashboard, filters, and cards
export const INITIAL_COURSES: Course[] = (manifestData as unknown as Course[]) || [];

export function getCourseById(id: string): Course | undefined {
  if (!id) return undefined;
  return courseDetailsCache.get(id) || INITIAL_COURSES.find((c) => c.id === id);
}

export function getCoursesByCategory(categoryId: string): Course[] {
  if (!categoryId || categoryId === 'all') return INITIAL_COURSES;
  return INITIAL_COURSES.filter((c) => (c.category || '').toLowerCase() === categoryId.toLowerCase());
}

/**
 * Lazy loads the full course details (tabs, lectures, items, parmarData, prathamBySubject)
 * on demand as a separate code-split static chunk.
 */
export async function loadCourseDetails(courseId: string): Promise<Course | null> {
  if (!courseId) return null;
  if (courseDetailsCache.has(courseId)) {
    return courseDetailsCache.get(courseId)!;
  }
  try {
    const courseModule = await import(`@/data/courses/${courseId}.json`);
    const course = (courseModule.default || courseModule) as Course;
    courseDetailsCache.set(courseId, course);
    return course;
  } catch (err) {
    console.warn(`[coursesData] Failed to lazy load course details for: ${courseId}`, err);
    return getCourseById(courseId) || null;
  }
}

export function countCourseStats(course: Course): { videos: number; resources: number } {
  if (course.stats) {
    return course.stats;
  }

  if (course.isParmar && course.parmarData) {
    let videos = 0;
    let resources = 0;
    for (const subj of Object.values(course.parmarData)) {
      for (const lec of subj.lectures) {
        if (lec.links && lec.links.url) videos++;
        if (lec.links) {
          resources += Object.keys(lec.links).filter((k) => k !== 'url').length;
        }
      }
    }
    return { videos, resources };
  }

  if (course.isPratham && course.prathamBySubject) {
    let videos = 0;
    let resources = 0;
    for (const items of Object.values(course.prathamBySubject)) {
      items.forEach((item) => {
        if (item.category === 'videos' || item.type !== 'pdf') videos++;
        else resources++;
      });
    }
    return { videos, resources };
  }

  let videos = 0;
  let resources = 0;
  for (const tab of course.tabs || []) {
    for (const item of tab.items || []) {
      if (item.type === 'pdf') resources++;
      else videos++;
    }
  }
  return { videos, resources };
}

export function getTotalStats(): { totalVideos: number; totalPDFs: number; totalCourses: number } {
  let totalVideos = 0;
  let totalPDFs = 0;
  for (const c of INITIAL_COURSES) {
    const stats = countCourseStats(c);
    totalVideos += stats.videos;
    totalPDFs += stats.resources;
  }
  return {
    totalVideos,
    totalPDFs,
    totalCourses: INITIAL_COURSES.length,
  };
}
