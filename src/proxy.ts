import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://hofbtbutvuomeofmhkyu.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZmJ0YnV0dnVvbWVvZm1oa3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDQwNzEsImV4cCI6MjEwMjcyMDA3MX0.J5RU82Jn5VOZy_vyiSv9mX5QgKW6Ud23fVKMytXp7DA';

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse['cookies']['set']>[2];
};

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

  // Refresh session — must not be removed for proper cookie refresh
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, apple-icon, icon
     * - public files (thumbnails, fonts, google*.html, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|apple-icon|icon|thumbnails|fonts|google.*\\.html|robots\\.txt|sitemap\\.xml).*)',
  ],
};
