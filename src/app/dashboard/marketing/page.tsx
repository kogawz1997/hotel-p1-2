import { createClient } from '@/lib/supabase/server';
import { MarketingClient } from './marketing-client';

export default async function MarketingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user!.id).single();
  const { data: hotels } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) return null;
  const hotelId = hotels[0].id;
  const [{ data: campaigns }, { data: reviews }, { data: guestCount }] = await Promise.all([
    supabase.from('marketing_campaigns').select('*').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(20),
    supabase.from('reviews').select('*').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(10),
    supabase.from('guests').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('marketing_consent', true),
  ]);
  return <MarketingClient hotelId={hotelId} campaigns={campaigns || []} reviews={reviews || []} eligibleGuests={guestCount?.length || 0} />;
}
