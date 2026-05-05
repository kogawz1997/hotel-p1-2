import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const { hotelId, reservationId, rating, ratingClean, ratingService, ratingLocation, ratingValue, title, comment, reviewerName } = await request.json();
  if (!hotelId || !rating) return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if already reviewed
  if (reservationId) {
    const { data: existing } = await supabase
      .from('booking_reviews').select('id').eq('reservation_id', reservationId).single();
    if (existing) return NextResponse.json({ error: 'คุณรีวิวการจองนี้แล้ว' }, { status: 400 });
  }

  const { data, error } = await supabase.from('booking_reviews').insert({
    hotel_id: hotelId,
    reservation_id: reservationId || null,
    guest_account_id: user?.id || null,
    reviewer_name: reviewerName || 'แขกผู้เข้าพัก',
    rating, rating_clean: ratingClean, rating_service: ratingService,
    rating_location: ratingLocation, rating_value: ratingValue,
    title, comment,
    verified_stay: !!reservationId,
    platform: 'direct',
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, review: data });
}
