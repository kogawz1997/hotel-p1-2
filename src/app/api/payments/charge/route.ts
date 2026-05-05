import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPaymentAdapter } from '@/lib/payments';
import { parseJson } from '@/lib/http/validation';
import { assertReservationAccess } from '@/lib/auth/guards';
import { rateLimit, requireProductionSecret } from '@/lib/security/rate-limit';

const schema = z.object({
  reservationId: z.string().uuid(),
  amount: z.coerce.number().positive().max(10_000_000),
  method: z.enum(['credit_card', 'promptpay', 'truemoney', 'shopeepay', 'bank_transfer']),
  description: z.string().max(255).optional(),
  cardToken: z.string().max(255).optional(),
});

export async function POST(request: Request) {
  try {
    const limited = rateLimit(request, 'payments.charge', 20, 60_000);
    if (limited) return limited;

    const missingGateway = requireProductionSecret('OMISE_SECRET_KEY');
    if (missingGateway) return missingGateway;

    const parsed = await parseJson(request, schema);
    if (parsed.error) return parsed.error;

    const { reservationId, amount, method, description, cardToken } = parsed.data;

    const ctx = await assertReservationAccess(reservationId);

    if (ctx.error) {
      return ctx.error;
    }

    if (!ctx.reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    const supabase = ctx.supabase;
    const reservation = ctx.reservation;

    const balance = Math.max(
      0,
      Number(reservation.total_amount) - Number(reservation.paid_amount || 0)
    );

    if (amount > balance && balance > 0) {
      return NextResponse.json(
        { error: 'Amount exceeds reservation balance', balance },
        { status: 400 }
      );
    }

    if (method === 'credit_card' && !cardToken) {
      return NextResponse.json(
        { error: 'cardToken is required for credit card payments' },
        { status: 400 }
      );
    }

    const adapter = getPaymentAdapter('omise');

    const result = await adapter.charge({
      amount,
      currency: reservation.hotels?.currency || 'THB',
      description: description || `Booking ${reservation.reservation_code}`,
      method,
      reservationId,
      metadata: cardToken ? { cardToken } : undefined,
    });

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        hotel_id: reservation.hotel_id,
        reservation_id: reservationId,
        amount,
        currency: reservation.hotels?.currency || 'THB',
        payment_method: method,
        status: result.status === 'completed' ? 'completed' : 'pending',
        gateway: 'omise',
        gateway_transaction_id: result.transactionId,
        gateway_response: result.raw,
        paid_at: result.status === 'completed' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: paymentError?.message || 'Failed to create payment' },
        { status: 500 }
      );
    }

    if (result.status === 'completed') {
      await supabase
        .from('reservations')
        .update({
          paid_amount: Number(reservation.paid_amount || 0) + amount,
        })
        .eq('id', reservationId)
        .eq('hotel_id', reservation.hotel_id);
    }

    await supabase.from('audit_logs').insert({
      hotel_id: reservation.hotel_id,
      user_id: ctx.user?.id || null,
      action: 'payment.created',
      entity_type: 'payment',
      entity_id: payment.id,
      changes: { amount, method, status: result.status },
    });

    return NextResponse.json({
      success: true,
      payment,
      qrCode: result.qrCode,
      paymentUrl: result.paymentUrl,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}