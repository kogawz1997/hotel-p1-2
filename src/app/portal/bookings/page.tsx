import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MyBookingsClient } from './my-bookings-client';

export default async function MyBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login?next=/portal/bookings');

  const { data: guestAccount } = await supabase
    .from('guest_accounts').select('*').eq('id', user.id).single();
  if (!guestAccount) redirect('/portal/login');

  return <MyBookingsClient guest={guestAccount} />;
}
