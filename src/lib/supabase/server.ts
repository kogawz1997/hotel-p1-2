import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServerEnv } from '@/lib/env';

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function createClient() {
  const cookieStore = await cookies();
  const env = getServerEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
              cookieStore.set(name, value, options as any)
            );
          } catch {
            // Server Components cannot always set cookies. Humanity survives.
          }
        },
      },
    }
  );
}

export function createAdminClient() {
  const { createClient } = require('@supabase/supabase-js');
  const env = getServerEnv();

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}