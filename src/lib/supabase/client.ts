import { createBrowserClient } from '@supabase/ssr';

function createMockSupabaseClient(): any {
  const chainable: any = {
    select: () => chainable,
    eq: () => Promise.resolve({ data: [], error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    delete: () => chainable,
    then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithOAuth: async () => ({
        data: null,
        error: { message: 'Supabase credentials are not configured in this environment.' },
      }),
      signInWithPassword: async () => ({
        data: null,
        error: { message: 'Supabase credentials are not configured in this environment.' },
      }),
      signUp: async () => ({
        data: null,
        error: { message: 'Supabase credentials are not configured in this environment.' },
      }),
      signOut: async () => ({ error: null }),
      exchangeCodeForSession: async () => ({ data: null, error: null }),
    },
    from: () => chainable,
  };
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return createMockSupabaseClient();
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
