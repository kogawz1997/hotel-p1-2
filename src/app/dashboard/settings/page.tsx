import { createClient } from '@/lib/supabase/server';
import { SettingsClient } from '@/components/dashboard/settings-client';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles').select('*').eq('id', user!.id).single();
  const { data: hotels } = await supabase
    .from('hotels').select('*').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) return null;
  return <SettingsClient hotel={hotels[0]} profile={profile} />;
}
