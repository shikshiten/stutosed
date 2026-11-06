import 'server-only';
import { readFile } from 'fs/promises';
import path from 'path';
import { Course } from '@/types';
import { INITIAL_COURSES, getCourseById, getCoursesByCategory } from '@/lib/coursesData';

export async function getAllCourses(): Promise<Course[]> {
  return INITIAL_COURSES;
}

export async function findCourseById(courseId: string): Promise<Course | null> {
  const safeId = (courseId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeId) return null;
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'courses', `${safeId}.json`);
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as Course;
  } catch {
    return getCourseById(safeId) || null;
  }
}

export async function findCoursesByCategory(category: string): Promise<Course[]> {
  return getCoursesByCategory(category);
}
