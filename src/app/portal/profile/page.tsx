import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GuestProfileClient } from './guest-profile-client';

export default async function GuestProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login?next=/portal/profile');
  const { data: guest } = await supabase.from('guest_accounts').select('*').eq('id', user.id).single();
  if (!guest) redirect('/portal/login');
  return <GuestProfileClient guest={guest} />;
}
