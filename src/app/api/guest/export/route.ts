import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [account, bookings, wishlist, reviews, deletionRequests, consentLogs] = await Promise.all([
    supabase.from('guest_accounts').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('reservations').select('id,reservation_code,hotel_id,guest_id,check_in,check_out,nights,status,source,total_amount,paid_amount,balance_amount,special_requests,created_at,updated_at').eq('guest_account_id', user.id).limit(500),
    supabase.from('guest_wishlists').select('*').eq('guest_account_id', user.id).limit(500),
    supabase.from('booking_reviews').select('*').eq('guest_account_id', user.id).limit(500),
    supabase.from('data_deletion_requests').select('id,status,reason,requested_at,reviewed_at,completed_at').eq('guest_account_id', user.id).limit(50),
    supabase.from('consent_logs').select('id,hotel_id,consent_type,granted,source,policy_version,created_at').eq('guest_account_id', user.id).limit(500),
  ]);

  await supabase.from('consent_logs').insert({
    guest_account_id: user.id,
    consent_type: 'pdpa_data_export',
    granted: true,
    source: 'portal',
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
    user_agent: request.headers.get('user-agent'),
  }).then(() => null);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    account: account.data || { id: user.id, email: user.email },
    bookings: bookings.data || [],
    wishlist: wishlist.data || [],
    reviews: reviews.data || [],
    consentLogs: consentLogs.data || [],
    deletionRequests: deletionRequests.data || [],
    errors: [account.error, bookings.error, wishlist.error, reviews.error, deletionRequests.error, consentLogs.error].filter(Boolean).map((e: any) => e.message),
  }, { headers: { 'Content-Disposition': `attachment; filename="maitri-pdpa-export-${user.id}.json"` } });
}
