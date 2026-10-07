import 'server-only';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function getUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
