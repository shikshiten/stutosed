import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { INITIAL_COURSES } from '@/lib/coursesData';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || '';
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');

  if (!safeId) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Missing course id' } },
      { status: 400 }
    );
  }

  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'courses', `${safeId}.json`);
    const raw = await readFile(filePath, 'utf-8');
    const course = JSON.parse(raw);
    return NextResponse.json({ data: course }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    const fallback = INITIAL_COURSES.find((c) => c.id === safeId) || null;
    if (fallback) {
      return NextResponse.json({ data: fallback });
    }
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: `Course not found: ${safeId}` } },
      { status: 404 }
    );
  }
}
