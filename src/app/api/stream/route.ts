/**
 * Backward-compatible delegate route for /api/stream -> /api/v1/stream
 */
import { NextRequest, NextResponse } from 'next/server';
import { GET as v1GET, OPTIONS as v1OPTIONS } from '@/app/api/v1/stream/route';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[] | undefined>> }
) {
  const res = await v1GET(request, context);
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const cloned = res.clone();
      const body = await cloned.json();
      if (body && typeof body === 'object' && 'data' in body && body.data) {
        // Spread data properties at top level for legacy frontend callers, while preserving { data }
        return NextResponse.json(
          {
            ...body.data,
            data: body.data,
          },
          {
            status: res.status,
            headers: res.headers,
          }
        );
      }
    } catch {
      return res;
    }
  }

  return res;
}

export const OPTIONS = v1OPTIONS;
