import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return dummy client if env vars not configured yet
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({
          data: { subscription: { unsubscribe: () => {} } },
        }),
        signInWithOAuth: async () => ({ error: new Error('Supabase URL/Key not configured in .env.local') }),
        signInWithPassword: async () => ({ error: new Error('Supabase URL/Key not configured in .env.local') }),
        signUp: async () => ({ error: new Error('Supabase URL/Key not configured in .env.local') }),
        signOut: async () => ({ error: null }),
      },
    } as any;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
