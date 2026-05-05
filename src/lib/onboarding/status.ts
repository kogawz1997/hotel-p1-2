import { createAdminClient, createClient } from '@/lib/supabase/server';

export type OnboardingStep = 'create_organization' | 'create_hotel' | 'add_room_types' | 'add_rooms' | 'ready';

export type OnboardingStatus = {
  userId: string;
  email: string | null;
  profile: any | null;
  organization: any | null;
  hotel: any | null;
  roomTypeCount: number;
  roomCount: number;
  isComplete: boolean;
  nextStep: OnboardingStep;
};

function toSlug(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'hotel';
}

export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, organization_id, email, full_name, role, active, onboarding_completed, organizations(id, name, slug, subscription_plan, subscription_status, trial_ends_at, current_period_end, suspended_reason)')
    .eq('id', user.id)
    .maybeSingle();

  let hotel: any = null;
  let roomTypeCount = 0;
  let roomCount = 0;

  if (profile?.organization_id) {
    const { data: hotelRow } = await supabase
      .from('hotels')
      .select('id, organization_id, name, slug, email, currency, timezone, check_in_time, check_out_time, hero_image_url')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    hotel = hotelRow;

    if (hotel?.id) {
      const [{ count: rtCount }, { count: rCount }] = await Promise.all([
        supabase.from('room_types').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id),
        supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id),
      ]);
      roomTypeCount = rtCount || 0;
      roomCount = rCount || 0;
    }
  }

  let nextStep: OnboardingStep = 'ready';
  if (!profile?.organization_id) nextStep = 'create_organization';
  else if (!hotel?.id) nextStep = 'create_hotel';
  else if (roomTypeCount === 0) nextStep = 'add_room_types';
  else if (roomCount === 0) nextStep = 'add_rooms';

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile || null,
    organization: profile?.organizations || null,
    hotel,
    roomTypeCount,
    roomCount,
    isComplete: nextStep === 'ready',
    nextStep,
  };
}

export async function bootstrapOrganizationFromUser(): Promise<OnboardingStatus | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id || !user.email) return null;

  const existing = await getOnboardingStatus();
  if (existing?.profile?.organization_id) return existing;

  const admin = createAdminClient();
  const meta = (user.user_metadata || {}) as Record<string, string>;
  const fullName = meta.full_name || user.email.split('@')[0] || 'Hotel Owner';
  const hotelName = meta.hotel_name || 'My Hotel';
  const slug = `${toSlug(hotelName)}-${crypto.randomUUID().slice(0, 8)}`;

  const { data: org, error: orgError } = await admin.from('organizations').insert({ name: hotelName, slug, subscription_status: 'trial', subscription_plan: 'starter' }).select('id, name, slug').single();
  if (orgError || !org) throw new Error(orgError?.message || 'Failed to create organization');

  const { data: hotel, error: hotelError } = await admin.from('hotels').insert({ organization_id: org.id, name: hotelName, slug, type: 'hotel', email: user.email, currency: 'THB', country: 'Thailand', timezone: 'Asia/Bangkok' }).select('id').single();
  if (hotelError || !hotel) throw new Error(hotelError?.message || 'Failed to create hotel');

  const { error: profileError } = await admin.from('user_profiles').upsert({ id: user.id, organization_id: org.id, email: user.email, full_name: fullName, role: 'hotel_owner', active: true });
  if (profileError) throw new Error(profileError.message);

  await admin.from('rate_plans').insert({ hotel_id: hotel.id, name: 'Standard Rate', rate_modifier: 1, includes_breakfast: false, active: true }).then(() => null);
  await admin.from('audit_logs').insert({ hotel_id: hotel.id, user_id: user.id, action: 'onboarding.bootstrap_created', entity_type: 'organization', entity_id: org.id, changes: { source: 'auth_metadata', hotelName, fullName } }).then(() => null);

  return getOnboardingStatus();
}
