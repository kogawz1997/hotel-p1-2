import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireHotelAccess } from '@/lib/auth/guards';
import { parseJson } from '@/lib/http/validation';
import { rateLimit } from '@/lib/security/rate-limit';
import { createAdminClient } from '@/lib/supabase/server';

// GET — list all team members
export async function GET(request: Request) {
  const ctx = await requireHotelAccess(null, ['owner', 'admin', 'manager']);
  if (ctx.error) return ctx.error;
  if (!ctx.profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  const { data: members, error } = await ctx.supabase
    .from('user_profiles')
    .select('id, email, full_name, role, active, created_at')
    .eq('organization_id', ctx.profile.organization_id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  return NextResponse.json({ members });
}

// PATCH — update member role or deactivate
const patchSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(['admin', 'manager', 'front_desk', 'housekeeping', 'staff']).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const limited = rateLimit(request, 'team.members.update', 20, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(request, patchSchema);
  if (parsed.error) return parsed.error;
  const { memberId, role, active } = parsed.data;

  const ctx = await requireHotelAccess(null, ['owner', 'admin']);
  if (ctx.error) return ctx.error;
  if (!ctx.profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  // Cannot demote/deactivate yourself
  if (memberId === ctx.user!.id) {
    return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
  }

  // Target must be in same org
  const { data: target } = await ctx.supabase
    .from('user_profiles')
    .select('id, role, organization_id')
    .eq('id', memberId)
    .eq('organization_id', ctx.profile.organization_id)
    .single();

  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  // Non-owner cannot modify another admin
  if (!['owner', 'hotel_owner', 'platform_owner'].includes(ctx.profile.role) && target.role === 'admin') {
    return NextResponse.json({ error: 'Only owners can modify admin accounts' }, { status: 403 });
  }

  const updates: Record<string, any> = {};
  if (role !== undefined) updates.role = role;
  if (active !== undefined) updates.active = active;

  const admin = createAdminClient();
  const { error } = await admin
    .from('user_profiles')
    .update(updates)
    .eq('id', memberId)
    .eq('organization_id', ctx.profile.organization_id);

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

  await ctx.supabase.from('audit_logs').insert({
    hotel_id: ctx.hotelId,
    user_id: ctx.user!.id,
    action: 'team.member_updated',
    entity_type: 'user',
    entity_id: memberId,
    changes: updates,
  });

  return NextResponse.json({ success: true });
}
