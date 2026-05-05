'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';
export default function AcceptInvitePage() {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<'loading' | 'setting_up' | 'error' | 'done'>('loading');
  const [hotelName, setHotelName] = useState('');

  useEffect(() => {
    async function setup() {
      // Supabase redirects here with session already set via magic link
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setStatus('error');
        return;
      }

      const meta = session.user.user_metadata;
      const organizationId = meta?.invited_to_organization_id;
      const role = meta?.invited_role || 'staff';
      const invitedHotelName = meta?.hotel_name || 'your hotel';
      setHotelName(invitedHotelName);

      if (!organizationId) {
        setStatus('error');
        return;
      }

      setStatus('setting_up');

      // Create user profile linked to the org
      const { error } = await supabase.from('user_profiles').upsert({
        id: session.user.id,
        organization_id: organizationId,
        email: session.user.email!,
        full_name: session.user.user_metadata?.full_name || session.user.email,
        role,
        active: true,
      }, { onConflict: 'id' });

      if (error) {
        console.error('Setup error:', error);
        setStatus('error');
        return;
      }

      setStatus('done');
      toast.success('เข้าร่วมทีมสำเร็จแล้ว!');
      setTimeout(() => router.push('/dashboard'), 1500);
    }

    setup();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      {status === 'loading' && (
        <>
          <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">กำลังตรวจสอบคำเชิญ...</p>
        </>
      )}
      {status === 'setting_up' && (
        <>
          <div className="h-10 w-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">กำลังตั้งค่าบัญชีของคุณ...</p>
        </>
      )}
      {status === 'done' && (
        <>
          <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">✓</div>
          <div className="text-center">
            <h2 className="font-display text-2xl font-medium mb-2">เข้าร่วมสำเร็จ!</h2>
            <p className="text-sm text-muted-foreground">คุณเป็นส่วนหนึ่งของทีม {hotelName} แล้ว</p>
          </div>
          <Button onClick={() => router.push('/dashboard')}>ไปหน้า Dashboard</Button>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center text-2xl">✕</div>
          <div className="text-center">
            <h2 className="font-display text-xl font-medium mb-2">ลิงก์คำเชิญไม่ถูกต้อง</h2>
            <p className="text-sm text-muted-foreground">ลิงก์อาจหมดอายุหรือใช้ไปแล้ว กรุณาขอคำเชิญใหม่</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/auth/login')}>กลับหน้า Login</Button>
        </>
      )}
    </div>
  );
}
