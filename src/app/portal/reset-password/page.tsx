'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase puts tokens in URL hash — listen for session from magic link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const rules = [
    { ok: password.length >= 8, label: 'อย่างน้อย 8 ตัวอักษร' },
    { ok: /[A-Z]/.test(password), label: 'มีตัวพิมพ์ใหญ่' },
    { ok: /[0-9]/.test(password), label: 'มีตัวเลข' },
    { ok: password === confirm && confirm.length > 0, label: 'รหัสผ่านตรงกัน' },
  ];
  const allPass = rules.every(r => r.ok);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allPass) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    setTimeout(() => router.push('/portal/login'), 3000);
  }

  if (done) return (
    <div className="text-center">
      <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      </div>
      <h2 className="text-xl font-semibold text-[#2A2522] mb-2">เปลี่ยนรหัสผ่านสำเร็จ!</h2>
      <p className="text-sm text-[#2A2522]/50">กำลังพาคุณไปหน้า Login...</p>
    </div>
  );

  if (!sessionReady) return (
    <div className="text-center">
      <div className="h-8 w-8 border-2 border-[#C66A30]/30 border-t-[#C66A30] rounded-full animate-spin mx-auto mb-4" />
      <p className="text-sm text-[#2A2522]/60">กำลังยืนยันลิงก์...</p>
      <p className="text-xs text-[#2A2522]/40 mt-2">ถ้าใช้เวลานาน ลองกลับไปขอลิงก์ใหม่</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-semibold text-[#2A2522]">ตั้งรหัสผ่านใหม่</h1>
      <p className="text-sm text-[#2A2522]/50">กรอกรหัสผ่านใหม่ที่ต้องการ</p>

      <div className="relative">
        <label className="text-xs font-medium text-[#2A2522]/60 mb-1.5 block">รหัสผ่านใหม่</label>
        <input
          type={show ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="อย่างน้อย 8 ตัวอักษร"
          required
          className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30 focus:border-[#C66A30] transition-all"
        />
        <button type="button" onClick={() => setShow(p => !p)}
          className="absolute right-3 top-8 text-[#2A2522]/30 hover:text-[#2A2522]/60">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div>
        <label className="text-xs font-medium text-[#2A2522]/60 mb-1.5 block">ยืนยันรหัสผ่าน</label>
        <input
          type={show ? 'text' : 'password'}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="พิมพ์รหัสผ่านอีกครั้ง"
          required
          className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30 focus:border-[#C66A30] transition-all"
        />
      </div>

      {password.length > 0 && (
        <div className="space-y-1.5 p-3 bg-[#FAF7F2] rounded-xl">
          {rules.map(r => (
            <div key={r.label} className={`flex items-center gap-2 text-xs ${r.ok ? 'text-emerald-600' : 'text-[#2A2522]/40'}`}>
              <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${r.ok ? 'bg-emerald-100' : 'bg-black/5'}`}>
                {r.ok && <CheckCircle2 className="h-3 w-3" />}
              </div>
              {r.label}
            </div>
          ))}
        </div>
      )}

      <button type="submit" disabled={loading || !allPass}
        className="w-full py-3 bg-[#C66A30] hover:bg-[#A4522A] text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="h-4 w-4" />}
        {loading ? 'กำลังบันทึก...' : 'ตั้งรหัสผ่านใหม่'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-8">
          <Suspense fallback={
            <div className="text-center">
              <div className="h-8 w-8 border-2 border-[#C66A30]/30 border-t-[#C66A30] rounded-full animate-spin mx-auto" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-[#2A2522]/40 mt-6">
          <Link href="/portal/login" className="text-[#C66A30] hover:underline">← กลับไปหน้า Login</Link>
        </p>
      </div>
    </div>
  );
}
