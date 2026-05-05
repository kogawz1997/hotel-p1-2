import { createClient } from '@/lib/supabase/server';
import { RoomsClient } from '@/components/dashboard/rooms-client';

export default async function RoomsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single();
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile?.organization_id)
    .limit(1);
  if (!hotels?.[0]) return null;
  return <RoomsClient hotelId={hotels[0].id} />;
}
