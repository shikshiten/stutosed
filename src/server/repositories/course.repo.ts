import 'server-only';
import { Course } from '@/types';
import { INITIAL_COURSES, getCourseById, getCoursesByCategory } from '@/lib/coursesData';

export async function getAllCourses(): Promise<Course[]> {
  return INITIAL_COURSES;
}

export async function findCourseById(courseId: string): Promise<Course | null> {
  const course = getCourseById(courseId);
  return course ?? null;
}

export async function findCoursesByCategory(category: string): Promise<Course[]> {
  return getCoursesByCategory(category);
}
