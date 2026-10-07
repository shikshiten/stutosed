import { ok } from '@/server/http/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  return ok({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
