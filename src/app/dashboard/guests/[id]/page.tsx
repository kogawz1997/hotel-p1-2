import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { GuestDetailClient } from './guest-detail-client';

export default async function GuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
  const { data: hotels } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) redirect('/dashboard');

  const [{ data: guest }, { data: reservations }, { data: loyaltyTx }] = await Promise.all([
    supabase.from('guests').select('*').eq('id', id).eq('hotel_id', hotels[0].id).single(),
    supabase.from('reservations').select('id, reservation_code, status, check_in, check_out, total_amount, paid_amount, nights, source, rooms(room_number), room_types(name)').eq('guest_id', id).order('check_in', { ascending: false }).limit(20),
    supabase.from('loyalty_transactions').select('*').eq('guest_id', id).order('created_at', { ascending: false }).limit(30),
  ]);

  if (!guest) notFound();
  return <GuestDetailClient guest={guest} reservations={reservations || []} loyaltyTx={loyaltyTx || []} hotelId={hotels[0].id} />;
}
