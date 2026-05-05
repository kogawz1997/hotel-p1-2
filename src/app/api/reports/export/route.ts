import { NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('hotelId') || '';
  const start = searchParams.get('start') || '';
  const end = searchParams.get('end') || '';

  const ctx = await requireHotelAccess(hotelId, ['owner', 'admin', 'manager']);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();
  const { data: resvs } = await admin
    .from('reservations')
    .select('reservation_code, status, check_in, check_out, nights, total_amount, paid_amount, source, num_adults, num_children, guests(first_name, last_name, email, nationality), rooms(room_number), room_types(name)')
    .eq('hotel_id', hotelId)
    .gte('check_in', start)
    .lte('check_in', end)
    .order('check_in');

  const headers = ['รหัสจอง','สถานะ','เช็คอิน','เช็คเอาท์','คืน','ห้อง','ประเภทห้อง','ชื่อแขก','อีเมล','สัญชาติ','ผู้ใหญ่','เด็ก','ยอดรวม','ชำระแล้ว','ค้างชำระ','แหล่งที่มา'];
  const rows = (resvs || []).map((r: any) => [
    r.reservation_code, r.status, r.check_in, r.check_out, r.nights,
    r.rooms?.room_number || '', r.room_types?.name || '',
    `${r.guests?.first_name || ''} ${r.guests?.last_name || ''}`.trim(),
    r.guests?.email || '', r.guests?.nationality || '',
    r.num_adults, r.num_children || 0,
    r.total_amount, r.paid_amount, Number(r.total_amount) - Number(r.paid_amount), r.source,
  ]);

  const csv = [headers, ...rows]
  .map(row =>
    row
      .map((v: string | number | null | undefined) =>
        `"${String(v ?? '').replace(/"/g, '""')}"`
      )
      .join(',')
  )
  .join('\n');

  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reservations-${start}-${end}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
