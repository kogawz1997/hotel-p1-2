import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AuditClient } from './audit-client';

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('user_profiles').select('organization_id, role').eq('id', user.id).single();

  // Only owner/admin can see audit logs
  if (!profile || !['owner', 'hotel_owner', 'platform_owner', 'admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  const { data: hotels } = await supabase
    .from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1);

  if (!hotels?.[0]) redirect('/dashboard');

  return <AuditClient hotelId={hotels[0].id} />;
}
