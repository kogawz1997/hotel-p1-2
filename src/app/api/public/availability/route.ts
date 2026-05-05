import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type OccupiedRoom = {
  room_type_id: string | null;
  room_id: string | null;
};

type AvailableRoom = {
  id: string;
  room_type_id: string | null;
  status: string | null;
};

type RateOverride = {
  room_type_id: string | null;
  price: number | null;
};

type RoomType = {
  id: string;
  base_rate: number | null;
  [key: string]: unknown;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('hotelId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const adults = Number(searchParams.get('adults') || 2);

  if (!hotelId || !checkIn || !checkOut) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('*, room_type_images(image_url, display_order)')
    .eq('hotel_id', hotelId)
    .gte('max_occupancy', adults)
    .order('base_rate');

  const { data: occupiedRooms } = await supabase
    .from('reservations')
    .select('room_type_id, room_id')
    .eq('hotel_id', hotelId)
    .in('status', ['confirmed', 'checked_in', 'on_hold'])
    .lt('check_in', checkOut)
    .gt('check_out', checkIn);

  const { data: allRooms } = await supabase
    .from('rooms')
    .select('id, room_type_id, status')
    .eq('hotel_id', hotelId)
    .eq('status', 'available');

  const occupiedByType: Record<string, number> = {};
  (occupiedRooms as OccupiedRoom[] | null)?.forEach((r) => {
    if (r.room_type_id) {
      occupiedByType[r.room_type_id] = (occupiedByType[r.room_type_id] || 0) + 1;
    }
  });

  const totalByType: Record<string, number> = {};
  (allRooms as AvailableRoom[] | null)?.forEach((r) => {
    if (r.room_type_id) {
      totalByType[r.room_type_id] = (totalByType[r.room_type_id] || 0) + 1;
    }
  });

  const { data: rateOverrides } = await supabase
    .from('rate_calendar')
    .select('room_type_id, price')
    .eq('hotel_id', hotelId)
    .gte('date', checkIn)
    .lt('date', checkOut);

  const avgOverride: Record<string, number> = {};
  const overrideCount: Record<string, number> = {};
  (rateOverrides as RateOverride[] | null)?.forEach((r) => {
    if (!r.room_type_id || typeof r.price !== 'number') return;

    avgOverride[r.room_type_id] = (avgOverride[r.room_type_id] || 0) + r.price;
    overrideCount[r.room_type_id] = (overrideCount[r.room_type_id] || 0) + 1;
  });

  const available = ((roomTypes || []) as RoomType[]).map((rt) => {
    const total = totalByType[rt.id] || 0;
    const occupied = occupiedByType[rt.id] || 0;
    const remaining = Math.max(0, total - occupied);
    const calendarRate = overrideCount[rt.id]
      ? avgOverride[rt.id] / overrideCount[rt.id]
      : null;

    return {
      ...rt,
      available_rooms: remaining,
      is_available: remaining > 0,
      effective_rate: calendarRate || rt.base_rate || 0,
    };
  });

  return NextResponse.json({ roomTypes: available });
}