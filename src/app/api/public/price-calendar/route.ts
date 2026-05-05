import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { format, addDays } from 'date-fns';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hotelId    = searchParams.get('hotelId') || '';
  const roomTypeId = searchParams.get('roomTypeId') || '';
  const days       = Number(searchParams.get('days') || 60);

  const supabase = createAdminClient();
  const today = new Date();
  const start = format(today, 'yyyy-MM-dd');
  const end   = format(addDays(today, days), 'yyyy-MM-dd');

  const [{ data: calRates }, { data: rt }] = await Promise.all([
    supabase.from('rate_calendar').select('date,rate')
      .eq('hotel_id', hotelId).eq('room_type_id', roomTypeId)
      .gte('date', start).lte('date', end)
      .order('date'),
    supabase.from('room_types').select('base_rate').eq('id', roomTypeId).single(),
  ]);

  const baseRate = Number(rt?.base_rate || 0);
  const rateMap: Record<string, number> = {};
  (calRates || []).forEach(r => { rateMap[r.date] = Number(r.rate); });

  const result = [];
  for (let i = 0; i < days; i++) {
    const date = format(addDays(today, i), 'yyyy-MM-dd');
    result.push({ date, rate: rateMap[date] ?? baseRate, isCustom: !!rateMap[date] });
  }

  return NextResponse.json({ prices: result, baseRate });
}
