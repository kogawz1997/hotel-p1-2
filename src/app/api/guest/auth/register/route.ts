import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { dbError } from '@/lib/http/validation';

export async function POST(request: NextRequest) {
  const { email, password, firstName, lastName, phone, marketingConsent } = await request.json();
  if (!email || !password || !firstName)
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 });

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: `${firstName} ${lastName||''}`.trim(), user_type: 'guest' } },
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  if (!authData.user) return NextResponse.json({ error: 'สมัครไม่สำเร็จ' }, { status: 500 });

  const admin = createAdminClient();
  const { error } = await admin.from('guest_accounts').insert({
    id: authData.user.id, email,
    first_name: firstName, last_name: lastName || null,
    phone: phone || null, marketing_consent: marketingConsent || false,
  });
  if (error) return NextResponse.json({ error: dbError(error) }, { status: 500 });
  return NextResponse.json({ success: true });
}
