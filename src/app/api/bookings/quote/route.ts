import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { calculateNights } from '@/lib/utils';
import { parseJson, dateStringSchema } from '@/lib/http/validation';
import { rateLimit } from '@/lib/security/rate-limit';

const schema = z.object({
  hotelId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  checkIn: dateStringSchema,
  checkOut: dateStringSchema,
  ratePlanId: z.string().uuid().optional().nullable(),
});

export async function POST(request: Request) {
  const limited = rateLimit(request, 'bookings.quote', 30, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;
  const { hotelId, roomTypeId, checkIn, checkOut, ratePlanId } = parsed.data;

  const nights = calculateNights(checkIn, checkOut);
  if (nights < 1 || nights > 365) {
    return NextResponse.json({ error: 'Invalid stay dates' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, organization_id, organizations(subscription_status)')
    .eq('id', hotelId)
    .single();

  if (!hotel || hotel.organizations?.subscription_status === 'cancelled') {
    return NextResponse.json({ error: 'Hotel is not available for booking' }, { status: 404 });
  }

  const { data: roomType, error: roomTypeError } = await supabase
    .from('room_types')
    .select('id, hotel_id, base_rate')
    .eq('id', roomTypeId)
    .eq('hotel_id', hotelId)
    .single();

  if (roomTypeError || !roomType) return NextResponse.json({ error: 'Room type not found' }, { status: 404 });

  let rateQuery = supabase
    .from('rate_calendar')
    .select('date, rate, available_count, min_stay, closed_to_arrival, closed_to_departure')
    .eq('hotel_id', hotelId)
    .eq('room_type_id', roomTypeId)
    .gte('date', checkIn)
    .lt('date', checkOut)
    .order('date');

  if (ratePlanId) rateQuery = rateQuery.eq('rate_plan_id', ratePlanId);
  const { data: rates } = await rateQuery;

  let totalPrice = 0;
  let breakdown: Array<{ date: string; rate: number }> = [];

  if (rates && rates.length === nights) {
    const blocked = rates.find((r: any) => r.closed_to_arrival || r.closed_to_departure || Number(r.min_stay || 1) > nights);
    if (blocked) return NextResponse.json({ error: 'Selected dates are restricted', blockedDate: blocked.date }, { status: 409 });
    rates.forEach((r: any) => {
      const rate = Number(r.rate);
      totalPrice += rate;
      breakdown.push({ date: r.date, rate });
    });
  } else {
    totalPrice = Number(roomType.base_rate || 0) * nights;
    const start = new Date(`${checkIn}T00:00:00.000Z`);
    breakdown = Array.from({ length: nights }).map((_, index) => {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + index);
      return { date: d.toISOString().slice(0, 10), rate: Number(roomType.base_rate || 0) };
    });
  }

  const { data: existingResvs } = await supabase
    .from('reservations')
    .select('id')
    .eq('hotel_id', hotelId)
    .eq('room_type_id', roomTypeId)
    .lt('check_in', checkOut)
    .gt('check_out', checkIn)
    .not('status', 'in', '(cancelled,no_show)');

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id')
    .eq('hotel_id', hotelId)
    .eq('room_type_id', roomTypeId)
    .not('status', 'in', '(maintenance,blocked)');

  const available = Math.max(0, (rooms?.length || 0) - (existingResvs?.length || 0));

  return NextResponse.json({ nights, totalPrice, pricePerNight: nights ? totalPrice / nights : 0, available, breakdown });
}
