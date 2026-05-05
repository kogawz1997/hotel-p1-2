import { NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateNights } from '@/lib/utils';
import { parseJson, dateStringSchema, dbError } from '@/lib/http/validation';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { sendBookingConfirmation, sendNewBookingAlert } from '@/lib/email-templates';

const createReservationSchema = z.object({
  hotelId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional().nullable(),
  roomTypeId: z.string().uuid(),
  ratePlanId: z.string().uuid().optional().nullable(),
  checkIn: dateStringSchema,
  checkOut: dateStringSchema,
  numAdults: z.coerce.number().int().min(1).max(20).default(1),
  numChildren: z.coerce.number().int().min(0).max(20).default(0),
  totalAmount: z.coerce.number().min(0),
  source: z.string().max(40).default('direct'),
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().max(120).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  nationality: z.string().trim().max(80).optional().nullable(),
  specialRequests: z.string().max(2000).optional().nullable(),
  roomTypeName: z.string().trim().max(160).optional().nullable(),
  estimatedArrival: z.string().optional().nullable(),
  guestAccountId: z.string().uuid().optional().nullable(),
  marketingConsent: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const limited = rateLimit(request, 'reservations.create', 30, 60_000);
    if (limited) return limited;

    const parsed = await parseJson(request, createReservationSchema);
    if (parsed.error) return parsed.error;

    const body = parsed.data;

    // Allow both hotel staff AND public guests (website bookings)
    let supabase: any;
    let hotelId: string;
    let actorUserId: string | null = null;
    let bookingHotel: any = null;

    if (body.source === 'website' || body.guestAccountId !== undefined) {
      // Public booking — use admin client, verify hotel exists
      supabase = createAdminClient();
      const { data: hotel } = await supabase
        .from('hotels').select('id,name,phone,email,address,check_in_time,check_out_time').eq('id', body.hotelId).single();
      if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      bookingHotel = hotel;
      hotelId = hotel.id;
    } else {
      // Staff booking — require hotel access
      const ctx = await requireHotelAccess(body.hotelId, [
        'owner', 'admin', 'manager', 'front_desk',
      ]);
      if (ctx.error) return ctx.error;
      if (!ctx.hotelId) return NextResponse.json({ error: 'Hotel access denied' }, { status: 403 });
      supabase = ctx.supabase;
      hotelId = ctx.hotelId;
      actorUserId = ctx.user?.id || null;
      const { data: hotel } = await supabase
        .from('hotels')
        .select('id,name,phone,email,address,check_in_time,check_out_time')
        .eq('id', hotelId)
        .maybeSingle();
      bookingHotel = hotel;
    }

    const nights = calculateNights(body.checkIn, body.checkOut);

    if (nights < 1 || nights > 365) {
      return NextResponse.json(
        { error: 'Invalid stay dates' },
        { status: 400 }
      );
    }

    const { data: roomType } = await supabase
      .from('room_types')
      .select('id')
      .eq('id', body.roomTypeId)
      .eq('hotel_id', hotelId)
      .single();

    if (!roomType) {
      return NextResponse.json(
        { error: 'Room type not found' },
        { status: 404 }
      );
    }

    if (body.roomId) {
      const { data: room } = await supabase
        .from('rooms')
        .select('id, status')
        .eq('id', body.roomId)
        .eq('hotel_id', hotelId)
        .eq('room_type_id', body.roomTypeId)
        .single();

      if (!room || ['maintenance', 'blocked'].includes(room.status)) {
        return NextResponse.json(
          { error: 'Room is not available' },
          { status: 409 }
        );
      }
    }

    let guest: any = null;

    if (body.email || body.phone) {
      const filters = [
        body.email ? `email.eq.${body.email}` : '',
        body.phone ? `phone.eq.${body.phone}` : '',
      ]
        .filter(Boolean)
        .join(',');

      const result = await supabase
        .from('guests')
        .select('id')
        .eq('hotel_id', hotelId)
        .or(filters)
        .maybeSingle();

      guest = result.data;
    }

    if (!guest) {
      const { data: newGuest, error } = await supabase
        .from('guests')
        .insert({
          hotel_id: hotelId,
          first_name: body.firstName,
          last_name: body.lastName,
          email: body.email,
          phone: body.phone,
          nationality: body.nationality,
        })
        .select('id')
        .single();

      if (error || !newGuest) return dbError(error);

      guest = newGuest;
    }

    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert({
        hotel_id: hotelId,
        guest_id: guest.id,
        room_id: body.roomId,
        room_type_id: body.roomTypeId,
        rate_plan_id: body.ratePlanId,
        check_in: body.checkIn,
        check_out: body.checkOut,
        num_adults: body.numAdults,
        num_children: body.numChildren,
        total_amount: body.totalAmount,
        source: body.source,
        special_requests: body.specialRequests,
        status: 'confirmed',
      })
      .select()
      .single();

    if (error || !reservation) return dbError(error);

    await supabase.from('folios').insert({
      reservation_id: reservation.id,
      hotel_id: hotelId,
      status: 'open',
      total_charges: body.totalAmount,
      balance: body.totalAmount,
    });

    await supabase.from('audit_logs').insert({
      hotel_id: hotelId,
      user_id: actorUserId,
      action: 'reservation.created',
      entity_type: 'reservation',
      entity_id: reservation.id,
      changes: { source: body.source, totalAmount: body.totalAmount },
    });

    // Send emails (non-blocking — don't fail booking if email fails)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const emailNights = Math.max(1, Math.round(
      (new Date(body.checkOut).getTime() - new Date(body.checkIn).getTime()) / 86400000
    ));

    Promise.allSettled([
      // Confirmation to guest
      body.email ? sendBookingConfirmation({
        to: body.email,
        guestName: `${body.firstName} ${body.lastName || ''}`.trim(),
        reservationCode: reservation.reservation_code || reservation.id.slice(0, 8).toUpperCase(),
        hotelName: bookingHotel?.name || 'โรงแรม',
        hotelPhone: bookingHotel?.phone ?? undefined,
        hotelEmail: bookingHotel?.email ?? undefined,
        hotelAddress: bookingHotel?.address ?? undefined,
        checkIn: body.checkIn,
        checkOut: body.checkOut,
        nights: emailNights,
        roomType: body.roomTypeName || 'ห้องพัก',
        numAdults: body.numAdults || 1,
        totalAmount: new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(body.totalAmount || 0)),
        checkInTime: bookingHotel?.check_in_time ?? undefined,
        checkOutTime: bookingHotel?.check_out_time ?? undefined,
        specialRequests: body.specialRequests ?? undefined,
        appUrl,
      }) : Promise.resolve(),

      // Alert to hotel (if hotel has email)
      bookingHotel?.email ? sendNewBookingAlert({
        to: bookingHotel.email,
        reservationCode: reservation.reservation_code || reservation.id.slice(0, 8).toUpperCase(),
        guestName: `${body.firstName} ${body.lastName || ''}`.trim(),
        guestEmail: body.email || '',
        guestPhone: body.phone ?? undefined,
        roomType: body.roomTypeName || 'ห้องพัก',
        checkIn: body.checkIn,
        checkOut: body.checkOut,
        nights: emailNights,
        numAdults: body.numAdults || 1,
        totalAmount: new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(body.totalAmount || 0)),
        source: body.source || 'direct',
        specialRequests: body.specialRequests ?? undefined,
        dashboardUrl: appUrl,
      }) : Promise.resolve(),
    ]).catch(() => {}); // Swallow errors — email failure must NOT break booking

    return NextResponse.json({ success: true, reservation });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal Server Error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedHotelId = searchParams.get('hotelId');
    const status = searchParams.get('status');

    const ctx = await requireHotelAccess(requestedHotelId);

    if (ctx.error) return ctx.error;

    if (!ctx.hotelId) {
      return NextResponse.json(
        { error: 'Hotel access denied' },
        { status: 403 }
      );
    }

    let query = ctx.supabase
      .from('reservations')
      .select('*, guests(*), rooms(room_number), room_types(name)')
      .eq('hotel_id', ctx.hotelId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('check_in', { ascending: false })
      .limit(100);

    if (error) return dbError(error);

    return NextResponse.json({ reservations: data || [] });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal Server Error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}