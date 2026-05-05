import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  const { data: guestAccount } = await supabase
    .from('guest_accounts').select('id,first_name,last_name').eq('id', data.user.id).single();
  if (!guestAccount) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: 'บัญชีนี้เป็นบัญชีโรงแรม กรุณาเข้าที่ /auth/login' }, { status: 403 });
  }
  return NextResponse.json({ success: true, guest: guestAccount });
}
