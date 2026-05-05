import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson } from '@/lib/http/validation';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';
import sgMail from '@sendgrid/mail';

const schema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'front_desk', 'housekeeping', 'staff']),
  hotelId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const limited = rateLimit(request, 'team.invite', 10, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;
  const { email, role, hotelId } = parsed.data;

  const ctx = await requireHotelAccess(hotelId, ['owner', 'admin']);
  if (ctx.error) return ctx.error;
  if (!ctx.profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  const admin = createAdminClient();

  // Check if user already exists in this org
  const { data: existing } = await admin
    .from('user_profiles')
    .select('id, email')
    .eq('organization_id', ctx.profile.organization_id)
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'ผู้ใช้นี้อยู่ในทีมแล้ว' }, { status: 409 });
  }

  // Check existing Supabase auth user
  const { data: { users } } = await admin.auth.admin.listUsers();
  type AuthUser = {
  email?: string | null;
};

const authUser = users.find((u: AuthUser) => u.email === email);

  if (authUser) {
    // User exists — add to this org
    const { error: profileError } = await admin.from('user_profiles').insert({
      id: authUser.id,
      organization_id: ctx.profile.organization_id,
      email,
      full_name: authUser.user_metadata?.full_name || email.split('@')[0],
      role,
      active: true,
    });
    if (profileError && profileError.code !== '23505') {
      return NextResponse.json({ error: 'ไม่สามารถเพิ่มผู้ใช้ได้' }, { status: 500 });
    }
  } else {
    // New user — send magic link invite via Supabase
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        organization_id: ctx.profile.organization_id,
        invited_role: role,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/team/accept-invite`,
    });
    if (inviteError) {
      console.error('[Invite] Error:', inviteError.message);
      return NextResponse.json({ error: 'ไม่สามารถส่งคำเชิญได้' }, { status: 500 });
    }
  }

  // Send branded email if SendGrid is configured
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const { data: hotel } = await admin.from('hotels').select('name').eq('id', ctx.hotelId!).single();
    const roleLabels: Record<string, string> = {
      admin: 'ผู้ดูแลระบบ', manager: 'ผู้จัดการ', front_desk: 'พนักงานต้อนรับ',
      housekeeping: 'แม่บ้าน', staff: 'พนักงาน',
    };
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@maitri.co',
      subject: `คุณได้รับเชิญเข้าร่วม ${hotel?.name || 'โรงแรม'} บน Maitri`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #2A2522;">
          <div style="margin-bottom: 32px;">
            <span style="font-size: 20px; font-weight: 600; letter-spacing: -0.5px;">Maitri</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 500; margin: 0 0 16px;">คุณได้รับเชิญ</h1>
          <p style="color: #666; line-height: 1.6; margin: 0 0 24px;">
            ${ctx.profile.full_name || ctx.profile.email} ได้เชิญคุณเข้าร่วม <strong>${hotel?.name}</strong> 
            ในฐานะ <strong>${roleLabels[role]}</strong>
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login" 
             style="display: inline-block; background: #2A2522; color: #FAF7F2; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
            เข้าสู่ระบบ
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            ถ้าคุณไม่คาดว่าจะได้รับอีเมลนี้ สามารถละเว้นได้
          </p>
        </div>
      `,
    }).catch(e => console.error('[Invite email]', e.message));
  }

  await admin.from('audit_logs').insert({
    hotel_id: ctx.hotelId,
    user_id: ctx.user!.id,
    action: 'team.invited',
    entity_type: 'user_profile',
    changes: { email, role },
  });

  return NextResponse.json({ success: true, message: 'ส่งคำเชิญเรียบร้อย' });
}
