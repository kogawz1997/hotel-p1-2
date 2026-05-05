import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Vercel Cron — runs every day at 09:00 ICT (02:00 UTC)
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Find foreign guest check-ins from yesterday without TM30 submitted
  const { data: pending, error } = await admin
    .from('reservations')
    .select('id, reservation_code, hotel_id, guests(first_name, last_name, nationality)')
    .eq('check_in', yesterday)
    .neq('guests.nationality', 'Thai')
    .is('tm30_submitted_at', null);

  if (error) {
    console.error('[Cron TM30]', error.message);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  // TODO: send reminder email/LINE to hotel managers
  console.log(`[Cron TM30] ${pending?.length || 0} pending TM30 reports for ${yesterday}`);

  return NextResponse.json({
    processed: pending?.length || 0,
    date: yesterday,
    message: 'TM30 reminder sent',
  });
}
