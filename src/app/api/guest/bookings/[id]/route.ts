import { NextRequest, NextResponse } from 'next/server';
import { sendCancellationEmail } from '@/lib/email-templates';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action, reason, specialRequests, estimatedArrival } = await request.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const { data: reservation } = await supabase
    .from('reservations').select('id,status,check_in,guest_account_id').eq('id', id).single();
  if (!reservation || reservation.guest_account_id !== user.id)
    return NextResponse.json({ error: 'ไม่พบการจอง' }, { status: 404 });

  if (action === 'cancel') {
    // Allow cancel if check_in > 24h from now
    const checkIn = new Date(reservation.check_in);
    const now = new Date();
    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / 3600000;
    if (hoursUntilCheckIn < 24)
      return NextResponse.json({ error: 'ไม่สามารถยกเลิกได้ภายใน 24 ชั่วโมงก่อน check-in' }, { status: 400 });

    const { error } = await supabase.from('reservations').update({
      status: 'cancelled',
      cancellation_reason: reason || 'cancelled_by_guest',
      cancelled_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'update_requests') {
    const { error } = await supabase.from('reservations').update({
      special_requests: specialRequests,
      estimated_arrival: estimatedArrival || null,
    }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
