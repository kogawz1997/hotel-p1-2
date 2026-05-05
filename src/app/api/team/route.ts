import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson } from '@/lib/http/validation';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

const patchSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'manager', 'front_desk', 'housekeeping', 'staff']).optional(),
  active: z.boolean().optional(),
});

export async function GET(request: Request) {
  const ctx = await requireHotelAccess(null, ['owner', 'admin', 'manager']);
  if (ctx.error) return ctx.error;
  if (!ctx.profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: members, error } = await admin
    .from('user_profiles')
    .select('id, email, full_name, role, active, created_at')
    .eq('organization_id', ctx.profile.organization_id)
    .order('created_at');

  if (error) return NextResponse.json({ error: 'ไม่สามารถโหลดทีมได้' }, { status: 500 });
  return NextResponse.json({ members });
}

export async function PATCH(request: Request) {
  const parsed = await parseJson(request, patchSchema);
  if (parsed.error) return parsed.error;
  const { userId, role, active } = parsed.data;

  const ctx = await requireHotelAccess(null, ['owner', 'admin']);
  if (ctx.error) return ctx.error;
  if (!ctx.profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  // Cannot demote yourself
  if (userId === ctx.user!.id) {
    return NextResponse.json({ error: 'ไม่สามารถแก้ไข role ของตัวเองได้' }, { status: 403 });
  }

  const admin = createAdminClient();

  // Verify target is same org
  const { data: target } = await admin
    .from('user_profiles')
    .select('id, role')
    .eq('id', userId)
    .eq('organization_id', ctx.profile.organization_id)
    .single();

  if (!target) return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });

  // Owner cannot be changed
  if (['owner', 'hotel_owner', 'platform_owner'].includes(target.role)) {
    return NextResponse.json({ error: 'ไม่สามารถแก้ไข owner ได้' }, { status: 403 });
  }

  const updates: any = {};
  if (role !== undefined) updates.role = role;
  if (active !== undefined) updates.active = active;

  const { error } = await admin.from('user_profiles').update(updates).eq('id', userId);
  if (error) return NextResponse.json({ error: 'ไม่สามารถอัพเดตได้' }, { status: 500 });

  await admin.from('audit_logs').insert({
    hotel_id: ctx.hotelId,
    user_id: ctx.user!.id,
    action: 'team.updated',
    entity_type: 'user_profile',
    entity_id: userId,
    changes: updates,
  });

  return NextResponse.json({ success: true });
}
