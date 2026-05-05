import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city      = searchParams.get('city') || '';
  const checkIn   = searchParams.get('checkIn') || '';
  const checkOut  = searchParams.get('checkOut') || '';
  const adults    = Number(searchParams.get('adults') || 2);
  const type      = searchParams.get('type') || '';
  const minPrice  = Number(searchParams.get('minPrice') || 0);
  const maxPrice  = Number(searchParams.get('maxPrice') || 999999);
  const minRating = Number(searchParams.get('minRating') || 0);
  const sort      = searchParams.get('sort') || 'recommended';

  const supabase = createAdminClient();

  let query = supabase
    .from('hotels')
    .select(`
      id, name, slug, city, type, address, phone,
      hero_image_url, logo_url, description, tagline,
      check_in_time, check_out_time, star_rating, total_rooms,
      hotel_gallery(image_url, display_order)
    `)
    .eq('country', 'Thailand');

  if (city) query = query.ilike('city', `%${city}%`);
  if (type) query = query.eq('type', type);

  const { data: hotels, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // For each hotel get min price + availability + avg rating
  const results = await Promise.all((hotels || []).map(async hotel => {
    const [{ data: roomTypes }, { data: reviews }, { data: occupiedRooms }] = await Promise.all([
      supabase.from('room_types')
        .select('id, name, base_rate, max_occupancy')
        .eq('hotel_id', hotel.id)
        .gte('max_occupancy', adults)
        .order('base_rate'),

      supabase.from('booking_reviews')
        .select('rating')
        .eq('hotel_id', hotel.id),

      checkIn && checkOut
        ? supabase.from('reservations')
            .select('room_type_id')
            .eq('hotel_id', hotel.id)
            .in('status', ['confirmed', 'checked_in', 'on_hold'])
            .lt('check_in', checkOut)
            .gt('check_out', checkIn)
        : { data: [] },
    ]);

    const availableRoomTypes = (roomTypes || []).filter(rt => {
      if (!checkIn || !checkOut) return true;
      const occupied = (occupiedRooms || []).filter(r => r.room_type_id === rt.id).length;
      return occupied < 10; // simplified — real count needs rooms table
    });

    const minRate = availableRoomTypes.length > 0
      ? Math.min(...availableRoomTypes.map(rt => Number(rt.base_rate)))
      : null;

    const avgRating = reviews?.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

    return {
      ...hotel,
      min_rate: minRate,
      avg_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      review_count: reviews?.length || 0,
      is_available: availableRoomTypes.length > 0,
      gallery: (hotel.hotel_gallery || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .slice(0, 3),
    };
  }));

  // Filter by price + rating
  let filtered = results.filter(h =>
    h.is_available &&
    (h.min_rate === null || (h.min_rate >= minPrice && h.min_rate <= maxPrice)) &&
    (h.avg_rating === null || h.avg_rating >= minRating)
  );

  // Sort
  if (sort === 'price_asc') filtered.sort((a, b) => (a.min_rate || 0) - (b.min_rate || 0));
  else if (sort === 'price_desc') filtered.sort((a, b) => (b.min_rate || 0) - (a.min_rate || 0));
  else if (sort === 'rating') filtered.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

  return NextResponse.json({ hotels: filtered, total: filtered.length });
}
