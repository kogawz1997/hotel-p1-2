import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: reservations, error } = await supabase
    .from('reservations')
    .select(`
      id, reservation_code, status, check_in, check_out, nights,
      total_amount, paid_amount, payment_status, special_requests,
      num_adults, num_children, source, created_at, cancelled_at,
      room_types(name, description, amenities, size_sqm, bed_type),
      rooms(room_number, floor),
      hotels(id, name, slug, city, address, phone, email, check_in_time, check_out_time, hero_image_url)
    `)
    .eq('guest_account_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reservations: reservations || [] });
}
