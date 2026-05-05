import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RateCalendarClient } from './rate-calendar-client';

export default async function RatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
  const { data: hotels } = await supabase.from('hotels').select('id,name').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) redirect('/onboarding');

  const { data: roomTypes } = await supabase
    .from('room_types').select('id,name,base_rate').eq('hotel_id', hotels[0].id);

  return <RateCalendarClient hotelId={hotels[0].id} roomTypes={roomTypes || []} />;
}
