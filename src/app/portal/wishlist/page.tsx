import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WishlistClient } from './wishlist-client';

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login?next=/portal/wishlist');

  const { data: guest } = await supabase.from('guest_accounts').select('id,first_name').eq('id', user.id).single();
  if (!guest) redirect('/portal/login');

  const { data: wishlists } = await supabase
    .from('guest_wishlists')
    .select('id, hotel_id, room_type_id, created_at, hotels(id,name,slug,city,hero_image_url), room_types(name,base_rate,size_sqm,max_occupancy)')
    .eq('guest_account_id', user.id)
    .order('created_at', { ascending: false });

  return <WishlistClient guest={guest} wishlists={wishlists || []} />;
}
