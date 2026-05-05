import { NextResponse } from 'next/server';
import { z } from 'zod';
import { tm30Service } from '@/lib/compliance';
import { parseJson } from '@/lib/http/validation';
import { assertReservationAccess } from '@/lib/auth/guards';

const schema = z.object({
  reservationId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const parsed = await parseJson(request, schema);

    if (parsed.error) {
      return parsed.error;
    }

    const ctx = await assertReservationAccess(parsed.data.reservationId);

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

    const { data: fullReservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*, guests(*), hotels(name, address)')
      .eq('id', reservation.id)
      .single();

    if (reservationError || !fullReservation) {
      return NextResponse.json(
        { error: reservationError?.message || 'Not found' },
        { status: 404 }
      );
    }

    const nationality = String(fullReservation.guests?.nationality || '').trim();

    if (!nationality) {
      return NextResponse.json(
        { error: 'Guest nationality is required for TM30 screening' },
        { status: 400 }
      );
    }

    if (['TH', 'THA', 'Thai', 'Thailand'].includes(nationality)) {
      return NextResponse.json({
        message: 'Thai guest - TM30 not required',
      });
    }

    if (!fullReservation.guests?.passport_number) {
      return NextResponse.json(
        { error: 'Passport number is required for TM30' },
        { status: 400 }
      );
    }

    const result = await tm30Service.submit({
      passportNumber: fullReservation.guests.passport_number,
      nationality,
      fullName: `${fullReservation.guests.first_name} ${
        fullReservation.guests.last_name || ''
      }`.trim(),
      arrivalDate: fullReservation.check_in,
      hotelName: fullReservation.hotels.name,
      hotelAddress: fullReservation.hotels.address || '',
    });

    await supabase.from('tm30_reports').insert({
      hotel_id: fullReservation.hotel_id,
      guest_id: fullReservation.guest_id,
      reservation_id: fullReservation.id,
      passport_number: fullReservation.guests.passport_number,
      nationality,
      arrival_date: fullReservation.check_in,
      departure_date: fullReservation.check_out,
      status: result.success ? 'submitted' : 'pending',
      submitted_at: result.success ? new Date().toISOString() : null,
      confirmation_number: result.confirmationNumber,
      response_data: result,
    });

    if (result.success) {
      await supabase
        .from('reservations')
        .update({
          tm30_reported: true,
          tm30_reported_at: new Date().toISOString(),
        })
        .eq('id', fullReservation.id);
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal Server Error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}