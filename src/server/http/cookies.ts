import 'server-only';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  path?: string;
  maxAge?: number;
}

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export async function getAppCookie(name: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

export async function setAppCookie(
  name: string,
  value: string,
  options: Partial<CookieOptions> = {}
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    ...DEFAULT_COOKIE_OPTIONS,
    ...options,
  });
}

export async function deleteAppCookie(name: string, path = '/'): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({
    name,
    path,
  });
}
