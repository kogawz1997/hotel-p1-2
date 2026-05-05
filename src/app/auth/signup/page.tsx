'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [hotelName, setHotelName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { full_name: fullName, hotel_name: hotelName },
      },
    });

    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      toast.success('สมัครสำเร็จ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ');
      router.push('/auth/login?message=verify-email');
      return;
    }

    const response = await fetch('/api/auth/setup-organization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, hotelName }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error(payload?.error || 'เกิดข้อผิดพลาดในการสร้างบัญชี');
      setLoading(false);
      return;
    }

    toast.success('สร้างบัญชีสำเร็จ ยินดีต้อนรับ!');
    router.push('/onboarding');
    router.refresh();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">เริ่มต้นใช้งาน</h1>
        <p className="text-sm text-muted-foreground mt-2">
          ทดลองฟรี 60 วัน · ไม่ต้องใช้บัตรเครดิต
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="ชื่อโรงแรม"
          placeholder="เช่น Lanna Heritage Hotel"
          value={hotelName}
          onChange={(e) => setHotelName(e.target.value)}
          required
        />
        <Input
          label="ชื่อ-นามสกุลของคุณ"
          placeholder="ชื่อจริง"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          type="email"
          label="อีเมล"
          placeholder="you@hotel.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          type="password"
          label="รหัสผ่าน"
          hint="อย่างน้อย 8 ตัวอักษร"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full group" disabled={loading} size="lg">
          {loading ? 'กำลังสร้างบัญชี...' : (
            <>
              สมัครฟรี
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground text-pretty">
        การสมัครหมายถึงคุณยอมรับ{' '}
        <a className="underline underline-offset-2">เงื่อนไขการใช้งาน</a> และ{' '}
        <a className="underline underline-offset-2">นโยบายความเป็นส่วนตัว</a>
      </p>

      <p className="text-sm text-center text-muted-foreground">
        มีบัญชีอยู่แล้ว?{' '}
        <Link href="/auth/login" className="text-foreground font-medium hover:underline underline-offset-4">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
