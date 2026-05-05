'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [linkError, setLinkError] = useState(false);
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNotice(params.get('message'));
    setLinkError(Boolean(params.get('error')));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const message = error.message.toLowerCase().includes('email') ? 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ' : error.message;
      toast.error(message);
      setLoading(false);
    } else {
      toast.success('ยินดีต้อนรับกลับ');
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">เข้าสู่ระบบ</h1>
        <p className="text-sm text-muted-foreground mt-2">
          ยินดีต้อนรับกลับ กรอกข้อมูลด้านล่างเพื่อเข้าใช้งาน
        </p>
        {notice === 'verify-email' && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            สมัครสำเร็จแล้ว กรุณาเปิดอีเมลและกดยืนยันก่อนเข้าสู่ระบบ
          </div>
        )}
        {linkError && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            ลิงก์ยืนยันหมดอายุหรือไม่ถูกต้อง กรุณาลองเข้าสู่ระบบหรือสมัครใหม่
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <Button type="submit" className="w-full group" disabled={loading} size="lg">
          {loading ? 'กำลังเข้าสู่ระบบ...' : (
            <>
              เข้าสู่ระบบ
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        ยังไม่มีบัญชี?{' '}
        <Link href="/auth/signup" className="text-foreground font-medium hover:underline underline-offset-4">
          สมัครฟรี
        </Link>
      </p>
    </div>
  );
}
