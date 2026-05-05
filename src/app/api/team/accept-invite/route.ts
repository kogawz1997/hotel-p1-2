import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/auth/login', request.url));

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !user) return NextResponse.redirect(new URL('/auth/login?error=invalid_invite', request.url));

  const admin = createAdminClient();
  const orgId = user.user_metadata?.organization_id;
  const role = user.user_metadata?.invited_role || 'staff';

  if (orgId) {
    const { data: existing } = await admin.from('user_profiles').select('id').eq('id', user.id).maybeSingle();
    if (!existing) {
      await admin.from('user_profiles').insert({
        id: user.id,
        organization_id: orgId,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email!.split('@')[0],
        role,
        active: true,
      });
    }
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
