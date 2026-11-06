import { z } from 'zod';

export const DEFAULT_SUPABASE_URL = 'https://hofbtbutvuomeofmhkyu.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZmJ0YnV0dnVvbWVvZm1oa3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDQwNzEsImV4cCI6MjEwMjcyMDA3MX0.J5RU82Jn5VOZy_vyiSv9mX5QgKW6Ud23fVKMytXp7DA';
export const DEFAULT_GOOGLE_CLIENT_ID =
  '651149385608-7ikchkobfg58rr53nhksarm7oonl6a34.apps.googleusercontent.com';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().default(DEFAULT_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default(DEFAULT_SUPABASE_ANON_KEY),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional().default(DEFAULT_GOOGLE_CLIENT_ID),
  NEXT_PUBLIC_STREAM_PROXY_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID,
  NEXT_PUBLIC_STREAM_PROXY_URL: process.env.NEXT_PUBLIC_STREAM_PROXY_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
});

export const env = parsed.success
  ? parsed.data
  : {
      NEXT_PUBLIC_SUPABASE_URL: DEFAULT_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: DEFAULT_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: DEFAULT_GOOGLE_CLIENT_ID,
      NEXT_PUBLIC_STREAM_PROXY_URL: undefined,
      NODE_ENV: 'development' as const,
    };
