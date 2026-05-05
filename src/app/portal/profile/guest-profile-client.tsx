'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { User, ArrowLeft, Save, Lock, Globe2, Download, Trash2 } from 'lucide-react';

export function GuestProfileClient({ guest }: { guest: any }) {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: guest.first_name || '',
    last_name: guest.last_name || '',
    phone: guest.phone || '',
    nationality: guest.nationality || '',
    preferred_language: guest.preferred_language || 'th',
    marketing_consent: guest.marketing_consent || false,
  });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [tab, setTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  async function saveProfile() {
    setSaving(true);
    const { error } = await supabase.from('guest_accounts').update({
      first_name: form.first_name, last_name: form.last_name,
      phone: form.phone, nationality: form.nationality,
      preferred_language: form.preferred_language, marketing_consent: form.marketing_consent,
    }).eq('id', guest.id);
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    toast.success('บันทึกเรียบร้อย');
  }

  async function downloadPdpaExport() {
    const res = await fetch('/api/guest/export');
    if (!res.ok) { toast.error('ดาวน์โหลดข้อมูลไม่สำเร็จ'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maitri-pdpa-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ดาวน์โหลดข้อมูลแล้ว');
  }

  async function requestDeleteAccount() {
    const reason = window.prompt('เหตุผลในการขอลบบัญชี (ไม่บังคับ)') || '';
    const res = await fetch('/api/guest/delete-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) { toast.error('ส่งคำขอลบข้อมูลไม่สำเร็จ'); return; }
    toast.success('ส่งคำขอลบข้อมูลแล้ว ทีมงานจะตรวจสอบตามขั้นตอน PDPA');
  }

  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) { toast.error('รหัสผ่านใหม่ไม่ตรงกัน'); return; }
    if (pwForm.next.length < 8) { toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setPwSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('เปลี่ยนรหัสผ่านเรียบร้อย');
    setPwForm({ current: '', next: '', confirm: '' });
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <nav className="bg-white border-b border-black/5 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/portal/bookings" className="p-2 rounded-full hover:bg-black/5">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-medium">โปรไฟล์ของฉัน</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full bg-[#2A2522] text-white flex items-center justify-center text-2xl font-bold">
            {guest.first_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-lg text-[#2A2522]">{guest.first_name} {guest.last_name || ''}</div>
            <div className="text-sm text-[#2A2522]/50">{guest.email}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-black/5 mb-6">
          {[
            { key: 'profile', label: 'ข้อมูลส่วนตัว', icon: User },
            { key: 'security', label: 'ความปลอดภัย', icon: Lock },
            { key: 'preferences', label: 'การตั้งค่า', icon: Globe2 },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg font-medium transition-all ${
                  tab === t.key ? 'bg-[#2A2522] text-white' : 'text-[#2A2522]/50 hover:text-[#2A2522]'
                }`}>
                <Icon className="h-3.5 w-3.5" />{t.label}
              </button>
            );
          })}
        </div>

        {tab === 'profile' && (
          <div className="bg-white rounded-2xl border border-black/5 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="ชื่อ *" value={form.first_name} onChange={v => set('first_name', v)} />
              <Field label="นามสกุล" value={form.last_name} onChange={v => set('last_name', v)} />
            </div>
            <Field label="เบอร์โทร" type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="0812345678" />
            <Field label="สัญชาติ" value={form.nationality} onChange={v => set('nationality', v)} placeholder="Thai" />
            <button onClick={saveProfile} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#C66A30] text-white rounded-xl font-medium text-sm disabled:opacity-50">
              <Save className="h-4 w-4" />{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        )}

        {tab === 'security' && (
          <div className="bg-white rounded-2xl border border-black/5 p-6 space-y-4">
            <h3 className="font-semibold text-[#2A2522]">เปลี่ยนรหัสผ่าน</h3>
            <Field label="รหัสผ่านใหม่" type="password" value={pwForm.next} onChange={(v: string) => setPwForm(p => ({ ...p, next: v }))} placeholder="อย่างน้อย 8 ตัวอักษร" />
            <Field label="ยืนยันรหัสผ่านใหม่" type="password" value={pwForm.confirm} onChange={(v: string) => setPwForm(p => ({ ...p, confirm: v }))} placeholder="พิมพ์รหัสผ่านอีกครั้ง" />
            <button onClick={changePassword} disabled={pwSaving}
              className="w-full py-3 bg-[#2A2522] text-white rounded-xl font-medium text-sm disabled:opacity-50">
              {pwSaving ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </div>
        )}

        {tab === 'preferences' && (
          <div className="bg-white rounded-2xl border border-black/5 p-6 space-y-5">
            <div>
              <label className="text-xs font-medium text-[#2A2522]/60 mb-1.5 block">ภาษาที่ต้องการ</label>
              <select value={form.preferred_language} onChange={e => set('preferred_language', e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm focus:outline-none">
                <option value="th">🇹🇭 ภาษาไทย</option>
                <option value="en">🇬🇧 English</option>
                <option value="zh">🇨🇳 中文</option>
                <option value="ja">🇯🇵 日本語</option>
              </select>
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-sm font-medium text-[#2A2522]">รับข่าวสารโปรโมชั่น</div>
                <div className="text-xs text-[#2A2522]/50">รับอีเมลโปรโมชั่นและข้อเสนอพิเศษ</div>
              </div>
              <div onClick={() => set('marketing_consent', !form.marketing_consent)}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${form.marketing_consent ? 'bg-[#C66A30]' : 'bg-black/15'}`}>
                <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.marketing_consent ? 'left-7' : 'left-1'}`} />
              </div>
            </label>
            <button onClick={saveProfile} disabled={saving}
              className="w-full py-3 bg-[#C66A30] text-white rounded-xl font-medium text-sm disabled:opacity-50">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>

            <div className="rounded-2xl border border-black/10 bg-[#FAF7F2] p-4 space-y-3">
              <div>
                <div className="text-sm font-semibold text-[#2A2522]">PDPA / ข้อมูลส่วนบุคคล</div>
                <div className="text-xs text-[#2A2522]/55">ดาวน์โหลดข้อมูลหรือส่งคำขอลบบัญชีได้ ระบบจะบันทึก consent log ให้อัตโนมัติ</div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button onClick={downloadPdpaExport} className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium text-[#2A2522]">
                  <Download className="h-3.5 w-3.5" /> ดาวน์โหลดข้อมูล
                </button>
                <button onClick={requestDeleteAccount} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  <Trash2 className="h-3.5 w-3.5" /> ขอให้ลบบัญชี
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-[#2A2522]/60 mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30 focus:border-[#C66A30] transition-all" />
    </div>
  );
}
