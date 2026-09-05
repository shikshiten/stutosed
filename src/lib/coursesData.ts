import { Course } from '@/types';
import rawData from './coursesData.json';

export const INITIAL_COURSES: Course[] = (rawData as unknown as Course[]).sort((a, b) =>
  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
);

export function getCourseById(id: string): Course | undefined {
  return INITIAL_COURSES.find((c) => c.id === id);
}

export function countCourseStats(course: Course): { videos: number; resources: number } {
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
