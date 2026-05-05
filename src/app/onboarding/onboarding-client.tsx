'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Check, Building2, Bed, Image as ImageIcon, Rocket, ChevronRight, Upload, Plus, Trash2, Clock } from 'lucide-react';

const STEPS = [
  { id: 1, icon: Building2, label: 'ข้อมูลโรงแรม' },
  { id: 2, icon: Bed,       label: 'ห้องพัก' },
  { id: 3, icon: ImageIcon, label: 'รูปภาพ' },
  { id: 4, icon: Rocket,    label: 'เสร็จสิ้น' },
];

const AMENITY_OPTIONS = [
  'WiFi ฟรี', 'แอร์', 'TV', 'ตู้เย็น', 'เซฟ', 'ระเบียง',
  'อ่างอาบน้ำ', 'ห้องน้ำสไตล์ฝนตก', 'ไดร์เป่าผม', 'ห้องทำงาน',
  'วิวทะเล', 'วิวสวน', 'วิวเมือง', 'สระว่ายน้ำ', 'อาหารเช้า',
];

export function OnboardingClient({ user, organizationId, existingHotel, hasRoomTypes }: {
  user: { id: string; email: string };
  organizationId: string;
  existingHotel: any;
  hasRoomTypes: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(existingHotel ? (hasRoomTypes ? 3 : 2) : 1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hotel, setHotel] = useState(existingHotel);

  const [hotelForm, setHotelForm] = useState({
    name: existingHotel?.name || '',
    description: existingHotel?.description || '',
    address: existingHotel?.address || '',
    city: existingHotel?.city || '',
    phone: existingHotel?.phone || '',
    email: existingHotel?.email || user.email,
    check_in_time: existingHotel?.check_in_time || '14:00',
    check_out_time: existingHotel?.check_out_time || '12:00',
    vat_rate: existingHotel?.vat_rate || 0.07,
  });

  const [roomTypes, setRoomTypes] = useState([{
    name: '', description: '', base_rate: '', max_occupancy: 2,
    size_sqm: '', bed_type: 'king', amenities: ['WiFi ฟรี', 'แอร์'],
  }]);

  const [images, setImages] = useState({ logo: '', hero: '' });

  const set = (k: string, v: any) => setHotelForm(p => ({ ...p, [k]: v }));

  // ─── Step 1: Hotel Info ───────────────────────────────────────────
  async function saveHotelInfo() {
    if (!hotelForm.name.trim()) { toast.error('กรุณาใส่ชื่อโรงแรม'); return; }
    setSaving(true);
    let result;
    if (hotel) {
      result = await supabase.from('hotels').update(hotelForm).eq('id', hotel.id).select().single();
    } else {
      const slug = hotelForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      result = await supabase.from('hotels').insert({
        ...hotelForm,
        organization_id: organizationId,
        slug: `${slug}-${Date.now().toString(36)}`,
        currency: 'THB', country: 'TH',
      }).select().single();
    }
    setSaving(false);
    if (result.error) { toast.error('บันทึกไม่สำเร็จ: ' + result.error.message); return; }
    setHotel(result.data);
    toast.success('บันทึกข้อมูลโรงแรมแล้ว');
    setStep(2);
  }

  // ─── Step 2: Room Types ───────────────────────────────────────────
  async function saveRoomTypes() {
    const valid = roomTypes.filter(rt => rt.name.trim() && rt.base_rate);
    if (!valid.length) { toast.error('กรุณาเพิ่มห้องพักอย่างน้อย 1 ประเภท'); return; }
    if (!hotel) { toast.error('กรุณากรอกข้อมูลโรงแรมก่อน'); return; }
    setSaving(true);
    for (const rt of valid) {
      const { data: newRt } = await supabase.from('room_types').insert({
        hotel_id: hotel.id,
        name: rt.name, description: rt.description,
        base_rate: Number(rt.base_rate),
        max_occupancy: rt.max_occupancy,
        size_sqm: rt.size_sqm ? Number(rt.size_sqm) : null,
        bed_type: rt.bed_type, amenities: rt.amenities,
      }).select().single();
      // Add 1 default room
      if (newRt) {
        await supabase.from('rooms').insert({
          hotel_id: hotel.id, room_type_id: newRt.id,
          room_number: `${101 + valid.indexOf(rt)}`, floor: 1,
        });
      }
    }
    setSaving(false);
    toast.success(`เพิ่ม ${valid.length} ประเภทห้องแล้ว`);
    setStep(3);
  }

  // ─── Step 3: Images ───────────────────────────────────────────────
  async function uploadFile(file: File, type: 'logo' | 'hero') {
    if (!hotel) return;
    setUploading(true);
    const path = `${hotel.id}/${type}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('hotel-assets').upload(path, file, { upsert: true });
    if (error) { toast.error('Upload ล้มเหลว'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('hotel-assets').getPublicUrl(path);
    const field = type === 'logo' ? 'logo_url' : 'hero_image_url';
    await supabase.from('hotels').update({ [field]: publicUrl }).eq('id', hotel.id);
    setImages(p => ({ ...p, [type]: publicUrl }));
    setUploading(false);
    toast.success(`${type === 'logo' ? 'Logo' : 'Hero image'} อัพโหลดแล้ว`);
  }

  async function finish() {
    setSaving(true);
    const response = await fetch('/api/onboarding/finish', { method: 'POST' });
    setSaving(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error(payload?.error || 'ปิด onboarding ไม่สำเร็จ');
      return;
    }
    toast.success('ยินดีต้อนรับสู่ Maitri! 🎉');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-3xl font-serif font-medium text-[#2A2522]">🪷 Maitri</span>
          <p className="text-sm text-[#2A2522]/50 mt-1">ตั้งค่าโรงแรมของคุณ</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  done ? 'bg-emerald-100 text-emerald-700' :
                  active ? 'bg-[#2A2522] text-white' :
                  'bg-white text-[#2A2522]/30 border border-black/5'
                }`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`h-px w-6 ${step > s.id ? 'bg-emerald-300' : 'bg-black/10'}`} />}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8">
          {/* ─ Step 1: Hotel Info ─ */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#2A2522] mb-1">ข้อมูลโรงแรม</h2>
                <p className="text-sm text-[#2A2522]/50">ข้อมูลพื้นฐานสำหรับแสดงให้แขกเห็น</p>
              </div>

              <F label="ชื่อโรงแรม *" value={hotelForm.name} onChange={v => set('name', v)} placeholder="เช่น ไมตรี บูติก โฮเทล" />
              <F label="คำอธิบาย (แสดงในหน้าจองของแขก)" value={hotelForm.description} onChange={v => set('description', v)} textarea placeholder="บอกเล่าเรื่องราวและจุดเด่นของที่พักของคุณ..." />

              <div className="grid grid-cols-2 gap-4">
                <F label="จังหวัด / เมือง *" value={hotelForm.city} onChange={v => set('city', v)} placeholder="เชียงใหม่" />
                <F label="โทรศัพท์" value={hotelForm.phone} onChange={v => set('phone', v)} placeholder="053-xxxxxx" />
              </div>

              <F label="ที่อยู่" value={hotelForm.address} onChange={v => set('address', v)} placeholder="เลขที่ ถนน ตำบล อำเภอ จังหวัด" />
              <F label="อีเมลโรงแรม" type="email" value={hotelForm.email} onChange={v => set('email', v)} placeholder="info@yourhotel.com" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#2A2522]/60 mb-1.5 block flex items-center gap-1"><Clock className="h-3 w-3" />เวลาเช็คอิน</label>
                  <input type="time" value={hotelForm.check_in_time} onChange={e => set('check_in_time', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#2A2522]/60 mb-1.5 block flex items-center gap-1"><Clock className="h-3 w-3" />เวลาเช็คเอาท์</label>
                  <input type="time" value={hotelForm.check_out_time} onChange={e => set('check_out_time', e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30" />
                </div>
              </div>

              <Btn onClick={saveHotelInfo} loading={saving} label="บันทึกและถัดไป" />
            </div>
          )}

          {/* ─ Step 2: Room Types ─ */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#2A2522] mb-1">ห้องพัก</h2>
                <p className="text-sm text-[#2A2522]/50">เพิ่มประเภทห้องอย่างน้อย 1 ประเภท สามารถเพิ่มเติมได้ภายหลัง</p>
              </div>

              <div className="space-y-4">
                {roomTypes.map((rt, i) => (
                  <div key={i} className="p-4 border border-black/8 rounded-xl space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#2A2522]">ห้องประเภทที่ {i + 1}</span>
                      {roomTypes.length > 1 && (
                        <button onClick={() => setRoomTypes(p => p.filter((_, idx) => idx !== i))}
                          className="p-1 text-[#2A2522]/30 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <F label="ชื่อประเภทห้อง *" value={rt.name}
                        onChange={v => setRoomTypes(p => p.map((r, idx) => idx === i ? { ...r, name: v } : r))}
                        placeholder="เช่น ห้องดีลักซ์, Suite" />
                      <F label="ราคาต่อคืน (บาท) *" type="number" value={rt.base_rate}
                        onChange={v => setRoomTypes(p => p.map((r, idx) => idx === i ? { ...r, base_rate: v } : r))}
                        placeholder="1500" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-[#2A2522]/60 mb-1.5 block">รองรับสูงสุด (คน)</label>
                        <select value={rt.max_occupancy}
                          onChange={e => setRoomTypes(p => p.map((r, idx) => idx === i ? { ...r, max_occupancy: Number(e.target.value) } : r))}
                          className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm focus:outline-none">
                          {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} คน</option>)}
                        </select>
                      </div>
                      <F label="ขนาด (ตร.ม.)" type="number" value={rt.size_sqm}
                        onChange={v => setRoomTypes(p => p.map((r, idx) => idx === i ? { ...r, size_sqm: v } : r))}
                        placeholder="28" />
                      <div>
                        <label className="text-xs text-[#2A2522]/60 mb-1.5 block">ประเภทเตียง</label>
                        <select value={rt.bed_type}
                          onChange={e => setRoomTypes(p => p.map((r, idx) => idx === i ? { ...r, bed_type: e.target.value } : r))}
                          className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm focus:outline-none">
                          {['king', 'queen', 'twin', 'single', 'double'].map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-[#2A2522]/60 mb-2 block">สิ่งอำนวยความสะดวก</label>
                      <div className="flex flex-wrap gap-1.5">
                        {AMENITY_OPTIONS.map(a => {
                          const selected = rt.amenities.includes(a);
                          return (
                            <button key={a} type="button"
                              onClick={() => setRoomTypes(p => p.map((r, idx) => idx === i ? {
                                ...r, amenities: selected
                                  ? r.amenities.filter(x => x !== a)
                                  : [...r.amenities, a]
                              } : r))}
                              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                                selected ? 'bg-[#2A2522] text-white border-[#2A2522]' : 'border-black/10 text-[#2A2522]/50 hover:border-[#2A2522]/30'
                              }`}>
                              {a}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setRoomTypes(p => [...p, { name: '', description: '', base_rate: '', max_occupancy: 2, size_sqm: '', bed_type: 'king', amenities: ['WiFi ฟรี', 'แอร์'] }])}
                className="w-full py-2.5 border-2 border-dashed border-black/10 rounded-xl text-sm text-[#2A2522]/40 hover:border-[#C66A30]/30 hover:text-[#C66A30] transition-colors flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" /> เพิ่มประเภทห้องอีก
              </button>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-4 py-2.5 border border-black/10 rounded-xl text-sm text-[#2A2522]/60 hover:bg-black/5">
                  ← กลับ
                </button>
                <div className="flex-1">
                  <Btn onClick={saveRoomTypes} loading={saving} label="บันทึกและถัดไป" />
                </div>
              </div>
            </div>
          )}

          {/* ─ Step 3: Images ─ */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#2A2522] mb-1">รูปภาพ</h2>
                <p className="text-sm text-[#2A2522]/50">เพิ่มรูปเพื่อให้แขกเห็นที่พักของคุณ (ทำได้ภายหลัง)</p>
              </div>

              {/* Logo */}
              <div className="p-5 border border-black/8 rounded-xl">
                <p className="text-sm font-medium text-[#2A2522] mb-3">Logo โรงแรม</p>
                {images.logo ? (
                  <img src={images.logo} alt="logo" className="h-12 mb-3 object-contain" />
                ) : (
                  <div className="h-16 bg-[#FAF7F2] rounded-lg flex items-center justify-center mb-3 text-[#2A2522]/20">
                    <Building2 className="h-8 w-8" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'logo')} disabled={uploading} />
                  <span className="flex items-center justify-center gap-2 px-4 py-2 border border-black/10 rounded-lg text-sm text-[#2A2522]/60 hover:bg-black/5 cursor-pointer">
                    <Upload className="h-4 w-4" /> {uploading ? 'กำลังอัพโหลด...' : 'เลือกรูป Logo'}
                  </span>
                </label>
              </div>

              {/* Hero */}
              <div className="p-5 border border-black/8 rounded-xl">
                <p className="text-sm font-medium text-[#2A2522] mb-3">รูปหลัก (Hero Image)</p>
                {images.hero ? (
                  <img src={images.hero} alt="hero" className="w-full h-40 object-cover rounded-lg mb-3" />
                ) : (
                  <div className="h-40 bg-[#FAF7F2] rounded-lg flex items-center justify-center mb-3 text-[#2A2522]/20">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'hero')} disabled={uploading} />
                  <span className="flex items-center justify-center gap-2 px-4 py-2 border border-black/10 rounded-lg text-sm text-[#2A2522]/60 hover:bg-black/5 cursor-pointer">
                    <Upload className="h-4 w-4" /> {uploading ? 'กำลังอัพโหลด...' : 'เลือกรูปหลัก'}
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="px-4 py-2.5 border border-black/10 rounded-xl text-sm text-[#2A2522]/60 hover:bg-black/5">
                  ← กลับ
                </button>
                <div className="flex-1">
                  <Btn onClick={() => setStep(4)} loading={false} label="ถัดไป" />
                </div>
              </div>
            </div>
          )}

          {/* ─ Step 4: Done ─ */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Rocket className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#2A2522] mb-2">พร้อมแล้ว! 🎉</h2>
                <p className="text-[#2A2522]/60 text-sm">โรงแรมของคุณถูกตั้งค่าเรียบร้อยแล้ว</p>
              </div>

              <div className="bg-[#FAF7F2] rounded-xl p-5 text-left space-y-2.5">
                {[
                  ['✅', 'ข้อมูลโรงแรม', 'บันทึกแล้ว'],
                  ['✅', 'ห้องพัก', 'เพิ่มแล้ว'],
                  ['📸', 'Gallery', 'เพิ่มเติมได้ที่ Branding'],
                  ['🔗', 'หน้าจองออนไลน์', `maitri.co/h/${hotel?.slug || ''}`],
                ].map(([icon, label, value]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-[#2A2522]/60"><span className="mr-2">{icon}</span>{label}</span>
                    <span className="font-medium text-[#2A2522] text-xs">{value}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Btn onClick={finish} loading={saving} label="เข้าสู่ Dashboard →" />
                <p className="text-xs text-[#2A2522]/30">ตั้งค่าเพิ่มเติมได้ภายหลังที่ Settings</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function F({ label, value, onChange, type = 'text', placeholder, textarea }: any) {
  const cls = "w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30 focus:border-[#C66A30] transition-all";
  return (
    <div>
      <label className="text-xs font-medium text-[#2A2522]/60 mb-1.5 block">{label}</label>
      {textarea
        ? <textarea value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls + ' resize-none'} />
        : <input type={type} value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  );
}

function Btn({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3 bg-[#C66A30] hover:bg-[#A4522A] text-white rounded-xl font-medium transition-colors disabled:opacity-60">
      {loading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
      {label} {!loading && <ChevronRight className="h-4 w-4" />}
    </button>
  );
}
