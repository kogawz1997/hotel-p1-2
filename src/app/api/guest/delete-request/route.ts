import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({ reason: z.string().max(1000).optional() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase.from('data_deletion_requests').insert({
    guest_account_id: user.id,
    email: user.email,
    reason: parsed.data.reason || null,
    status: 'requested',
    metadata: { source: 'guest_portal' },
  }).select('id,status,requested_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('consent_logs').insert({
    guest_account_id: user.id,
    consent_type: 'pdpa_delete_request',
    granted: true,
    source: 'portal',
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
    user_agent: request.headers.get('user-agent'),
  }).then(() => null);

  return NextResponse.json({ success: true, request: data });
}
