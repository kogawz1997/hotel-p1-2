import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BrandingClient } from './branding-client';

export default async function BrandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
  const { data: hotels } = await supabase.from('hotels').select('*').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) return null;

  const { data: gallery } = await supabase
    .from('hotel_gallery')
    .select('*')
    .eq('hotel_id', hotels[0].id)
    .order('display_order');

  return <BrandingClient hotel={hotels[0]} gallery={gallery || []} />;
}
