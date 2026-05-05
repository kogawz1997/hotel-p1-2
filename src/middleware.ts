import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ─── Hotel staff dashboard ───────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url));
    // Make sure they're hotel staff (not a guest account)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, role, active')
      .eq('id', user.id)
      .single();
    if (!profile) return NextResponse.redirect(new URL('/onboarding', request.url));
    if (!profile.active) return NextResponse.redirect(new URL('/auth/login?error=inactive', request.url));
  }

  // ─── Guest portal (account required pages) ───────────────────────
  const guestProtected = ['/portal/bookings', '/portal/profile', '/portal/wishlist'];
  if (guestProtected.some(p => pathname.startsWith(p))) {
    if (!user) {
      const redirectUrl = new URL('/portal/login', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    // Verify they have a guest_account row
    const { data: guestAccount } = await supabase
      .from('guest_accounts')
      .select('id')
      .eq('id', user.id)
      .single();
    if (!guestAccount) {
      return NextResponse.redirect(new URL('/portal/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/portal/bookings/:path*',
    '/portal/profile/:path*',
    '/portal/wishlist/:path*',
  ],
};
