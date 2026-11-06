import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hofbtbutvuomeofmhkyu.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZmJ0YnV0dnVvbWVvZm1oa3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDQwNzEsImV4cCI6MjEwMjcyMDA3MX0.J5RU82Jn5VOZy_vyiSv9mX5QgKW6Ud23fVKMytXp7DA';

  const pathname = request.nextUrl.pathname;
  const isSpaTab = pathname.startsWith('/ece') || pathname.startsWith('/gate') || pathname.startsWith('/gov-exams');

  // Never crash the entire app if environment variables are missing or unreadable in Edge runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    return isSpaTab
      ? NextResponse.rewrite(new URL('/', request.url), { request })
      : NextResponse.next({ request });
  }

  let supabaseResponse = isSpaTab
    ? NextResponse.rewrite(new URL('/', request.url), { request })
    : NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh session — must not throw or crash routing if network/token is stale
    await supabase.auth.getUser().catch(() => {});
  } catch (err) {
    // Graceful fallback: always allow the request to proceed rather than returning 500
    console.warn('Middleware updateSession caught error:', err);
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}

export const middleware = updateSession;
export default updateSession;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, apple-icon, icon
     * - public files (thumbnails, fonts, verification HTML, robots.txt, sitemap.xml)
     */
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|apple-icon|icon|thumbnails|fonts|google.*\\.html|4acb2b4f.*\\.html|robots\\.txt|sitemap\\.xml).*)',
  ],
};
