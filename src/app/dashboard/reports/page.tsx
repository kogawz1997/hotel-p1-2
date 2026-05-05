import { createClient } from '@/lib/supabase/server';
import { ReportsClient } from '@/components/dashboard/reports-client';

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles').select('organization_id').eq('id', user!.id).single();
  const { data: hotels } = await supabase
    .from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) return null;
  return <ReportsClient hotelId={hotels[0].id} />;
}
