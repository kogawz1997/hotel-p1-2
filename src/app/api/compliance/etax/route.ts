import { NextResponse } from 'next/server';
import { z } from 'zod';
import { etaxService } from '@/lib/compliance';
import { generateInvoiceNumber } from '@/lib/utils';
import { parseJson } from '@/lib/http/validation';
import { assertReservationAccess } from '@/lib/auth/guards';

const schema = z.object({
  reservationId: z.string().uuid(),
  buyerName: z.string().trim().max(180).optional(),
  buyerTaxId: z.string().trim().max(30).optional(),
  buyerAddress: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    // ✅ parse body
    const parsed = await parseJson(request, schema);
    if (parsed.error) return parsed.error;

    const { reservationId, buyerName, buyerTaxId, buyerAddress } = parsed.data;

    // ✅ auth + access
    const ctx = await assertReservationAccess(reservationId);

    if (ctx.error) return ctx.error;

    if (!ctx.reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    const supabase = ctx.supabase;

    // ✅ load reservation
    const { data: reservation } = await supabase
      .from('reservations')
      .select('*, guests(*), hotels(name, tax_id, address, vat_rate)')
      .eq('id', reservationId)
      .single();

    if (!reservation) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    if (!reservation.hotels?.tax_id) {
      return NextResponse.json(
        { error: 'Hotel tax ID is required before issuing e-Tax invoice' },
        { status: 400 }
      );
    }

    // ✅ calculations
    const vatRate = Number(reservation.hotels.vat_rate || 0.07);
    const totalAmount = Number(reservation.total_amount);
    const subtotal = totalAmount / (1 + vatRate);
    const vatAmount = totalAmount - subtotal;

    const resolvedBuyerName =
      buyerName ||
      `${reservation.guests.first_name} ${reservation.guests.last_name || ''}`.trim();

    const invoiceNumber = generateInvoiceNumber('ETAX');

    // ✅ create invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        hotel_id: reservation.hotel_id,
        reservation_id: reservationId,
        guest_id: reservation.guest_id,
        invoice_number: invoiceNumber,
        invoice_type: 'tax_invoice',
        subtotal,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        buyer_name: resolvedBuyerName,
        buyer_tax_id: buyerTaxId,
        buyer_address: buyerAddress,
        is_etax: true,
        etax_status: 'draft',
      })
      .select()
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: error?.message || 'Failed to create invoice' },
        { status: 500 }
      );
    }

    // ✅ send to e-tax
    const result = await etaxService.submit({
      invoiceNumber,
      issueDate: new Date().toISOString().split('T')[0],
      sellerTaxId: reservation.hotels.tax_id,
      sellerName: reservation.hotels.name,
      sellerAddress: reservation.hotels.address || '',
      buyerTaxId,
      buyerName: resolvedBuyerName,
      buyerAddress,
      items: [
        {
          description: `ค่าที่พัก ${reservation.reservation_code}`,
          quantity: reservation.nights,
          unitPrice: subtotal / reservation.nights,
          vatRate,
        },
      ],
      subtotal,
      vatAmount,
      totalAmount,
    });

    // ✅ update invoice
    await supabase
      .from('invoices')
      .update({
        etax_status: result.status,
        etax_submitted_at: new Date().toISOString(),
        etax_response: result,
      })
      .eq('id', invoice.id);

    // ✅ audit log
    await supabase.from('audit_logs').insert({
      hotel_id: reservation.hotel_id,
      user_id: ctx.user!.id,
      action: 'invoice.etax.created',
      entity_type: 'invoice',
      entity_id: invoice.id,
      changes: { invoiceNumber, status: result.status },
    });

    return NextResponse.json({ invoice, etaxResult: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}