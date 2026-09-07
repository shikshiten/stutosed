/**
 * Embed Proxy – DEPRECATED & PERMANENTLY DISABLED
 *
 * Embedded mode has been eliminated platform-wide. All lectures stream
 * via native HTML5 video player and high-speed Smart Proxy.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      error: 'The embed proxy has been permanently deprecated and disabled.',
      status: 410,
    },
    { status: 410 }
  );
}
