import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('guest_wishlists')
    .select('id, hotel_id, room_type_id, created_at, hotels(id,name,slug,city,hero_image_url,check_in_time,check_out_time), room_types(name,base_rate,size_sqm,max_occupancy,bed_type)')
    .eq('guest_account_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ wishlists: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { hotelId, roomTypeId } = await request.json();
  if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 });

  const { data, error } = await supabase.from('guest_wishlists').upsert({
    guest_account_id: user.id,
    hotel_id: hotelId,
    room_type_id: roomTypeId || null,
  }, { onConflict: 'guest_account_id,hotel_id,room_type_id' }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, wishlist: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from('guest_wishlists').delete()
    .eq('id', id).eq('guest_account_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
