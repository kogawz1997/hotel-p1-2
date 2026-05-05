import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertReservationAccess } from '@/lib/auth/guards';
import { writeAuditLog } from '@/lib/audit';

const schema = z.object({
  reservationId: z.string().uuid(),
  folioId: z.string().uuid().optional(),
  amount: z.coerce.number().positive().max(10_000_000),
  method: z.enum(['cash', 'bank_transfer', 'promptpay', 'credit_card', 'debit_card', 'ota_paid', 'voucher', 'other']),
  gatewayTransactionId: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { reservationId, folioId, amount, method, gatewayTransactionId, notes } = parsed.data;

  const ctx = await assertReservationAccess(reservationId);
  if (ctx.error) return ctx.error;
  const reservation = ctx.reservation;
  if (!reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });

  const receiptNumber = `RCT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const { data: payment, error } = await ctx.supabase.from('payments').insert({
    hotel_id: reservation.hotel_id,
    reservation_id: reservationId,
    folio_id: folioId || null,
    amount,
    currency: reservation.hotels?.currency || 'THB',
    payment_method: method,
    status: 'completed',
    gateway: method === 'promptpay' || method === 'credit_card' || method === 'debit_card' ? 'manual_provider' : 'manual',
    gateway_transaction_id: gatewayTransactionId || null,
    paid_at: new Date().toISOString(),
    receipt_number: receiptNumber,
    notes: notes || null,
  }).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await ctx.supabase.from('reservations').update({
    paid_amount: Number(reservation.paid_amount || 0) + amount,
  }).eq('id', reservationId).eq('hotel_id', reservation.hotel_id);

  if (folioId) {
    await ctx.supabase.from('folio_items').insert({
      folio_id: folioId,
      type: 'payment',
      description: `Payment via ${method}`,
      amount: -Math.abs(amount),
      quantity: 1,
      posted_by: ctx.user?.id || null,
      reference_id: payment.id,
      reference_type: 'payment',
    }).then(() => null);
  }

  await writeAuditLog(ctx.supabase, {
    hotelId: reservation.hotel_id,
    organizationId: ctx.profile?.organization_id,
    userId: ctx.user?.id,
    action: 'payment.recorded',
    entityType: 'payment',
    entityId: payment.id,
    after: { amount, method, receiptNumber },
    request,
  });

  return NextResponse.json({ success: true, payment, receiptUrl: `/api/receipts/${payment.id}` });
}
