import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: rt } = await admin.from('room_types').select('hotel_id').eq('id', id).single();
  if (!rt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ctx = await requireHotelAccess(rt.hotel_id);
  if (ctx.error) return ctx.error;

  const { data } = await ctx.supabase.from('room_type_images')
    .select('*').eq('room_type_id', id).order('display_order');
  return NextResponse.json({ images: data || [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { imageUrl, altText, displayOrder } = await request.json();

  const admin = createAdminClient();
  const { data: rt } = await admin.from('room_types').select('hotel_id').eq('id', id).single();
  if (!rt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ctx = await requireHotelAccess(rt.hotel_id, ['owner', 'admin', 'manager']);
  if (ctx.error) return ctx.error;

  const { data, error } = await ctx.supabase.from('room_type_images').insert({
    room_type_id: id, image_url: imageUrl,
    alt_text: altText || '', display_order: displayOrder || 0,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, image: data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get('imageId');
  if (!imageId) return NextResponse.json({ error: 'imageId required' }, { status: 400 });

  const admin = createAdminClient();
  const { data: rt } = await admin.from('room_types').select('hotel_id').eq('id', id).single();
  if (!rt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ctx = await requireHotelAccess(rt.hotel_id, ['owner', 'admin', 'manager']);
  if (ctx.error) return ctx.error;

  await ctx.supabase.from('room_type_images').delete().eq('id', imageId);
  return NextResponse.json({ success: true });
}
