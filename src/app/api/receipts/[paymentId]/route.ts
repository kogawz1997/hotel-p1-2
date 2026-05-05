import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';

export async function GET(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;

  const { data: payment, error } = await ctx.supabase
    .from('payments')
    .select('*, reservations(reservation_code, check_in, check_out), hotels(name, address, tax_id, currency, organization_id)')
    .eq('id', paymentId)
    .single();

  if (error || !payment || payment.hotels?.organization_id !== ctx.profile.organization_id) {
    return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
  }

  return NextResponse.json({
    receiptNumber: payment.receipt_number || payment.id,
    issuedAt: payment.paid_at || payment.created_at,
    hotel: payment.hotels,
    reservation: payment.reservations,
    payment: {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.payment_method,
      status: payment.status,
      gatewayTransactionId: payment.gateway_transaction_id,
    },
    note: 'JSON receipt prepared. Connect PDF renderer later if a formal printed receipt is required.',
  });
}
