import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertReservationAccess, requireHotelAccess } from '@/lib/auth/guards';
import { parseJson } from '@/lib/http/validation';

const patchSchema = z.object({
  action: z.enum(['check_in', 'check_out', 'cancel']).optional(),
  roomId: z.string().uuid().optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
  status: z
    .enum([
      'pending',
      'confirmed',
      'checked_in',
      'checked_out',
      'cancelled',
      'no_show',
      'on_hold',
    ])
    .optional(),
  special_requests: z.string().max(2000).optional().nullable(),
  internal_notes: z.string().max(4000).optional().nullable(),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ctx = await assertReservationAccess(id);

    if (ctx.error) {
      return ctx.error;
    }

    if (!ctx.reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    const { data, error } = await ctx.supabase
      .from('reservations')
      .select(
        '*, guests(*), rooms(room_number), room_types(name), folios(*, folio_items(*))'
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ reservation: data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal Server Error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const parsed = await parseJson(request, patchSchema);

    if (parsed.error) {
      return parsed.error;
    }

    const body = parsed.data;

    const ctx = await assertReservationAccess(id);

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
    const hotelId = ctx.reservation.hotel_id;

    const roleCtx = await requireHotelAccess(hotelId, [
      'owner',
      'admin',
      'manager',
      'front_desk',
    ]);

    if (roleCtx.error) {
      return roleCtx.error;
    }

    const updates: Record<string, unknown> = {};

    if (body.action === 'check_in') {
      updates.status = 'checked_in';

      if (body.roomId) {
        const { data: room, error: roomError } = await supabase
          .from('rooms')
          .select('id, status')
          .eq('id', body.roomId)
          .eq('hotel_id', hotelId)
          .single();

        if (roomError || !room) {
          return NextResponse.json(
            { error: roomError?.message || 'Room not found' },
            { status: 404 }
          );
        }

        if (['maintenance', 'blocked'].includes(room.status)) {
          return NextResponse.json(
            { error: 'Room is not available' },
            { status: 409 }
          );
        }

        updates.room_id = body.roomId;

        await supabase
          .from('rooms')
          .update({ status: 'occupied' })
          .eq('id', body.roomId)
          .eq('hotel_id', hotelId);
      }
    } else if (body.action === 'check_out') {
      updates.status = 'checked_out';

      if (ctx.reservation.room_id) {
        await supabase
          .from('rooms')
          .update({ status: 'cleaning' })
          .eq('id', ctx.reservation.room_id)
          .eq('hotel_id', hotelId);

        await supabase.from('housekeeping_tasks').insert({
          hotel_id: hotelId,
          room_id: ctx.reservation.room_id,
          task_type: 'turnover',
          priority: 'high',
          status: 'pending',
        });
      }
    } else if (body.action === 'cancel') {
      updates.status = 'cancelled';
      updates.cancelled_at = new Date().toISOString();
      updates.cancellation_reason = body.reason || null;
    } else {
      if (body.status) {
        updates.status = body.status;
      }

      if ('special_requests' in body) {
        updates.special_requests = body.special_requests;
      }

      if ('internal_notes' in body) {
        updates.internal_notes = body.internal_notes;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', id)
      .eq('hotel_id', hotelId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Update failed' },
        { status: 500 }
      );
    }

    await supabase.from('audit_logs').insert({
      hotel_id: hotelId,
      user_id: ctx.user?.id || null,
      action: `reservation.${body.action || 'updated'}`,
      entity_type: 'reservation',
      entity_id: id,
      changes: updates,
    });

    return NextResponse.json({ reservation: data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal Server Error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}