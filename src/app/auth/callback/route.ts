import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/onboarding';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('error', 'email_callback_failed');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
