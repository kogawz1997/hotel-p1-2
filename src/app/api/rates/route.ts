import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('hotelId') || '';
  const year  = Number(searchParams.get('year')  || new Date().getFullYear());
  const month = Number(searchParams.get('month') || new Date().getMonth() + 1);

  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const start = `${year}-${String(month).padStart(2,'0')}-01`;
  const end   = `${year}-${String(month + 1).padStart(2,'0')}-01`;

  const { data: rates } = await ctx.supabase
    .from('rate_calendar')
    .select('*')
    .eq('hotel_id', hotelId)
    .gte('date', start).lt('date', end);

  const { data: roomTypes } = await ctx.supabase
    .from('room_types').select('id, name, base_rate').eq('hotel_id', hotelId);

  return NextResponse.json({ rates: rates || [], roomTypes: roomTypes || [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { hotelId, roomTypeId, dates, rate, minStay, closedToArrival, closedToDeparture } = body;

  const ctx = await requireHotelAccess(hotelId, ['owner', 'admin', 'manager']);
  if (ctx.error) return ctx.error;

  const rows = (dates as string[]).map(date => ({
    hotel_id: hotelId,
    room_type_id: roomTypeId,
    date,
    rate: Number(rate),
    min_stay: minStay || 1,
    closed_to_arrival: closedToArrival || false,
    closed_to_departure: closedToDeparture || false,
  }));

  const { error } = await ctx.supabase
    .from('rate_calendar')
    .upsert(rows, { onConflict: 'hotel_id,room_type_id,rate_plan_id,date', ignoreDuplicates: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, updated: rows.length });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('hotelId') || '';
  const roomTypeId = searchParams.get('roomTypeId') || '';
  const date = searchParams.get('date') || '';

  const ctx = await requireHotelAccess(hotelId, ['owner', 'admin', 'manager']);
  if (ctx.error) return ctx.error;

  await ctx.supabase.from('rate_calendar')
    .delete().eq('hotel_id', hotelId).eq('room_type_id', roomTypeId).eq('date', date);

  return NextResponse.json({ success: true });
}
