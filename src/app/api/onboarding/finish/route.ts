import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getOnboardingStatus } from '@/lib/onboarding/status';

export async function POST() {
  const status = await getOnboardingStatus();
  if (!status) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!status.profile?.organization_id || !status.hotel?.id) return NextResponse.json({ error: 'Organization and hotel are required before finishing onboarding' }, { status: 400 });

  const admin = createAdminClient();
  let roomTypeId: string | null = null;

  const { data: existingRoomType } = await admin.from('room_types').select('id').eq('hotel_id', status.hotel.id).order('created_at', { ascending: true }).limit(1).maybeSingle();
  if (existingRoomType?.id) roomTypeId = existingRoomType.id;
  else {
    const { data: createdRoomType, error } = await admin.from('room_types').insert({ hotel_id: status.hotel.id, name: 'Standard Room', code: 'STD', description: 'Default room type created during onboarding. Edit this before going live.', base_rate: 1200, max_occupancy: 2, bed_type: 'king', amenities: ['WiFi', 'Air conditioning'] }).select('id').single();
    if (error || !createdRoomType) return NextResponse.json({ error: error?.message || 'Failed to create room type' }, { status: 500 });
    roomTypeId = createdRoomType.id;
  }

  const { count: roomCount } = await admin.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', status.hotel.id);
  if (!roomCount) {
    const { error } = await admin.from('rooms').insert({ hotel_id: status.hotel.id, room_type_id: roomTypeId, room_number: '101', floor: 1, status: 'available', notes: 'Default room created during onboarding. Rename before launch.' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.from('user_profiles').update({ onboarding_completed: true }).eq('id', status.userId).then(() => null);
  await admin.from('audit_logs').insert({ hotel_id: status.hotel.id, user_id: status.userId, action: 'onboarding.completed', entity_type: 'hotel', entity_id: status.hotel.id, changes: { roomTypeEnsured: true, roomEnsured: true } }).then(() => null);
  return NextResponse.json({ success: true });
}
