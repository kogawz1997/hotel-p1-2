import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { parseJson } from '@/lib/http/validation';

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  hotelName: z.string().trim().min(2).max(160),
});

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ก-๙]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'hotel';
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;
  const { fullName, hotelName } = parsed.data;

  const sessionSupabase = await createClient();
  const { data: { user }, error: authError } = await sessionSupabase.auth.getUser();
  if (authError || !user?.id || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: existingProfile } = await admin
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile?.organization_id) {
    return NextResponse.json({ success: true, organizationId: existingProfile.organization_id, alreadyConfigured: true });
  }

  const slug = `${toSlug(hotelName)}-${crypto.randomUUID().slice(0, 8)}`;

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: hotelName, slug })
    .select()
    .single();

  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 });

  const { data: hotel, error: hotelError } = await admin
    .from('hotels')
    .insert({ organization_id: org.id, name: hotelName, slug, type: 'hotel', email: user.email })
    .select()
    .single();

  if (hotelError) return NextResponse.json({ error: hotelError.message }, { status: 500 });

  const { error: profileError } = await admin.from('user_profiles').insert({
    id: user.id,
    organization_id: org.id,
    email: user.email,
    full_name: fullName,
    role: 'hotel_owner',
    active: true,
  });

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  await admin.from('rate_plans').insert({
    hotel_id: hotel.id,
    name: 'Standard Rate',
    rate_modifier: 1,
    includes_breakfast: false,
    active: true,
  }).then(() => null);

  await admin.from('audit_logs').insert({
    hotel_id: hotel.id,
    user_id: user.id,
    action: 'organization.created',
    entity_type: 'organization',
    entity_id: org.id,
    changes: { hotelName, fullName },
  });

  return NextResponse.json({ success: true, organizationId: org.id, hotelId: hotel.id });
}
