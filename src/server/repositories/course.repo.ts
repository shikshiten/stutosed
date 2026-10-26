import 'server-only';
import { Course } from '@/types';
import { INITIAL_COURSES, loadCourseDetails, getCoursesByCategory } from '@/lib/coursesData';

export async function getAllCourses(): Promise<Course[]> {
  return INITIAL_COURSES;
}

export async function findCourseById(courseId: string): Promise<Course | null> {
  return await loadCourseDetails(courseId);
}

export async function findCoursesByCategory(category: string): Promise<Course[]> {
  return getCoursesByCategory(category);
}
