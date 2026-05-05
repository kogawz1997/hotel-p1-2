import { createClient } from '@/lib/supabase/server';
import { ChannelsClient } from './channels-client';

export default async function ChannelsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user!.id).single();
  const { data: hotels } = await supabase.from('hotels').select('id, name').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) return null;
  const { data: connections } = await supabase.from('channel_connections').select('*').eq('hotel_id', hotels[0].id);
  const { data: roomTypes } = await supabase.from('room_types').select('id, name').eq('hotel_id', hotels[0].id);
  return <ChannelsClient hotelId={hotels[0].id} hotelName={hotels[0].name} connections={connections || []} roomTypes={roomTypes || []} />;
}
