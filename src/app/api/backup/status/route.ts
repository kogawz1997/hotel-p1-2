import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { hasRole } from '@/lib/auth/roles';

export async function GET() {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  if (!hasRole(ctx.profile?.role, ['platform_owner', 'hotel_owner', 'owner', 'admin'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { data } = await ctx.supabase
    .from('backup_run_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20);
  return NextResponse.json({
    status: 'prepared',
    provider: 'supabase',
    runs: data || [],
    next: ['Enable Supabase PITR/backups', 'Schedule daily export job', 'Run restore drill weekly', 'Record result in backup_run_logs'],
  });
}
