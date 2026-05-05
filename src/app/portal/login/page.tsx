'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/portal/bookings';

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    phone: '', confirmPassword: '', marketingConsent: false,
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === 'forgot') {
      await fetch('/api/guest/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      toast.success('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว');
      setMode('login');
      setLoading(false);
      return;
    }

    if (mode === 'register') {
      if (form.password !== form.confirmPassword) {
        toast.error('รหัสผ่านไม่ตรงกัน');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/guest/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          marketingConsent: form.marketingConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      toast.success('สมัครสมาชิกสำเร็จ!');
      setMode('login');
      setLoading(false);
      return;
    }

    // Login
    const res = await fetch('/api/guest/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-[#2A2522] flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-serif text-2xl font-medium text-[#2A2522]">Maitri</span>
          </Link>
          <p className="text-sm text-[#2A2522]/50 mt-2">ระบบสำหรับแขกผู้เข้าพัก</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-8">
          <h1 className="text-xl font-semibold text-[#2A2522] mb-6">
            {mode === 'login' ? 'เข้าสู่ระบบ' : mode === 'register' ? 'สมัครสมาชิก' : 'รีเซ็ตรหัสผ่าน'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">

            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="ชื่อ *" value={form.firstName} onChange={v => set('firstName', v)} />
                <Field label="นามสกุล" value={form.lastName} onChange={v => set('lastName', v)} />
              </div>
            )}

            <Field label="อีเมล *" type="email" value={form.email} onChange={v => set('email', v)} />

            {mode === 'register' && (
              <Field label="เบอร์โทร" value={form.phone} onChange={v => set('phone', v)} />
            )}

            {mode !== 'forgot' && (
              <Field label="รหัสผ่าน *" type="password" value={form.password} onChange={v => set('password', v)} />
            )}

            {mode === 'register' && (
              <>
                <Field label="ยืนยันรหัสผ่าน *" type="password" value={form.confirmPassword} onChange={v => set('confirmPassword', v)} />
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox"
                    checked={form.marketingConsent}
                    onChange={e => set('marketingConsent', e.target.checked)}
                    className="mt-0.5 rounded"
                  />
                  <span className="text-xs text-[#2A2522]/60">
                    ยินยอมรับโปรโมชั่น
                  </span>
                </label>
              </>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-[#C66A30] text-white py-3 rounded-xl">
              {loading ? 'กำลังดำเนินการ...' : 'ดำเนินการ'}
            </button>

          </form>

          <div className="mt-6 text-center text-sm">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('forgot')} className="text-[#C66A30] block w-full">ลืมรหัสผ่าน?</button>
                <button onClick={() => setMode('register')} className="text-[#C66A30]">สมัครฟรี</button>
              </>
            )}
            {mode !== 'login' && (
              <button onClick={() => setMode('login')} className="text-[#C66A30]">← กลับ</button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function Field({ label, value, onChange, type = 'text' }: any) {
  return (
    <div>
      <label className="block text-xs mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg"
      />
    </div>
  );
}