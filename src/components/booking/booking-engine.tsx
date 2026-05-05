'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { PriceGraph } from '@/components/booking/price-graph';
import { GuestChatWidget } from '@/components/booking/guest-chat-widget';
import { CurrencySwitcher } from '@/components/ui/currency-switcher';
import { format, differenceInDays, addDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  MapPin, Phone, Mail, Star, Wifi, Wind, Coffee, Waves,
  Tv, Car, Users, Maximize2, Bed, Calendar, ChevronRight,
  ChevronLeft, Check, X, ShieldCheck, Clock, Info, Heart,
  Tag, AlertCircle, Globe2, User,
} from 'lucide-react';

const AMENITY_ICONS: Record<string, any> = {
  wifi: Wifi, 'air conditioning': Wind, ac: Wind, breakfast: Coffee,
  pool: Waves, tv: Tv, parking: Car, balcony: Globe2,
};

const POLICY_STEPS = ['dates', 'rooms', 'details', 'review', 'confirmed'] as const;
type Step = typeof POLICY_STEPS[number];

export function BookingEngine({ hotel, roomTypes: initialRoomTypes }: { hotel: any; roomTypes: any[] }) {
  const supabase = createClient();
  const [step, setStep] = useState<Step>('dates');
  const [search, setSearch] = useState({ checkIn: '', checkOut: '', adults: 2, children: 0 });
  const [availableRooms, setAvailableRooms] = useState<any[]>(initialRoomTypes);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [ratePlan, setRatePlan] = useState<'flexible' | 'non_refundable'>('flexible');
  const [guestInfo, setGuestInfo] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    nationality: '', specialRequests: '', estimatedArrival: '',
    marketingConsent: false,
  });
  const [user, setUser] = useState<any>(null);
  const [guestAccount, setGuestAccount] = useState<any>(null);
  const [reservation, setReservation] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'at_hotel'>('online');
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const nights = search.checkIn && search.checkOut
    ? Math.max(0, differenceInDays(new Date(search.checkOut), new Date(search.checkIn)))
    : 0;

  const baseRate = selected ? Number(selected.effective_rate || selected.base_rate) : 0;
  const rateMultiplier = ratePlan === 'non_refundable' ? 0.9 : 1;
  const subtotal = baseRate * rateMultiplier * nights;
  const vat = subtotal * Number(hotel.vat_rate || 0.07);
  const total = subtotal + vat;

  useEffect(() => {
    async function loadUser() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        setUser(u);
        const { data: ga } = await supabase.from('guest_accounts').select('*').eq('id', u.id).single();
        if (ga) {
          setGuestAccount(ga);
          setGuestInfo(p => ({ ...p, firstName: ga.first_name, lastName: ga.last_name || '', email: u.email || '', phone: ga.phone || '' }));
        }
      }
    }
    loadUser();

    // Set default dates (tonight + 2 nights)
    const tonight = addDays(new Date(), 1);
    const checkout = addDays(tonight, 1);
    setSearch(p => ({
      ...p,
      checkIn: format(tonight, 'yyyy-MM-dd'),
      checkOut: format(checkout, 'yyyy-MM-dd'),
    }));
  }, []);

  async function searchAvailability() {
    if (!search.checkIn || !search.checkOut || nights < 1) {
      toast.error('กรุณาเลือกวันที่ถูกต้อง'); return;
    }
    setLoadingRooms(true);
    const res = await fetch(
      `/api/public/availability?hotelId=${hotel.id}&checkIn=${search.checkIn}&checkOut=${search.checkOut}&adults=${search.adults}`
    );
    const data = await res.json();
    setAvailableRooms(data.roomTypes || []);
    setLoadingRooms(false);
    setStep('rooms');
  }

  async function handleBook() {
    if (!guestInfo.firstName || !guestInfo.email) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return; }
    setSubmitting(true);
    const res = await fetch('/api/reservations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotelId: hotel.id,
        roomTypeId: selected.id,
        checkIn: search.checkIn, checkOut: search.checkOut,
        numAdults: search.adults, numChildren: search.children,
        firstName: guestInfo.firstName, lastName: guestInfo.lastName,
        email: guestInfo.email, phone: guestInfo.phone,
        nationality: guestInfo.nationality,
        specialRequests: guestInfo.specialRequests,
        estimatedArrival: guestInfo.estimatedArrival,
        source: 'website',
        totalAmount: total,
        guestAccountId: guestAccount?.id || null,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok || !data.reservation) { toast.error(data.error || 'เกิดข้อผิดพลาด'); return; }
    setReservation(data.reservation);
    setStep('confirmed');
  }

  const gallery = hotel.hotel_gallery || [];

  // ─── STEP: DATES ─────────────────────────────────────────────────────
  if (step === 'dates') return (
    <PublicLayout hotel={hotel} user={user} step={step}>
      {/* Hero */}
      <div className="relative h-[50vh] min-h-72 overflow-hidden">
        {gallery.length > 0 ? (
          <>
            <img src={gallery[galleryIdx]?.image_url || hotel.hero_image_url} alt={hotel.name}
              className="w-full h-full object-cover transition-opacity duration-500" />
            {gallery.length > 1 && (
              <>
                <button onClick={() => setGalleryIdx(p => (p - 1 + gallery.length) % gallery.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={() => setGalleryIdx(p => (p + 1) % gallery.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {gallery.slice(0, 8).map((_: any, i: number) => (
                    <button key={i} onClick={() => setGalleryIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${i === galleryIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : hotel.hero_image_url ? (
          <img src={hotel.hero_image_url} alt={hotel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2A2522] to-[#4a3c35] flex items-center justify-center">
            <span className="text-white/20 text-8xl font-serif">{hotel.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="text-3xl font-bold mb-1">{hotel.name}</h1>
          {hotel.city && <p className="flex items-center gap-1.5 text-sm opacity-90"><MapPin className="h-4 w-4" />{hotel.city}, {hotel.country || 'Thailand'}</p>}
        </div>
      </div>

      {/* Search bar */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10 mb-8">
        <div className="bg-white rounded-2xl shadow-xl border border-black/5 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-[#2A2522]/50 mb-1.5 block uppercase tracking-wider">เช็คอิน</label>
              <input type="date" value={search.checkIn} min={format(new Date(), 'yyyy-MM-dd')}
                onChange={e => setSearch(p => ({ ...p, checkIn: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#FAF7F2] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#2A2522]/50 mb-1.5 block uppercase tracking-wider">เช็คเอาท์</label>
              <input type="date" value={search.checkOut} min={search.checkIn || format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                onChange={e => setSearch(p => ({ ...p, checkOut: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#FAF7F2] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#2A2522]/50 mb-1.5 block uppercase tracking-wider">ผู้ใหญ่</label>
              <select value={search.adults} onChange={e => setSearch(p => ({ ...p, adults: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 bg-[#FAF7F2] rounded-xl text-sm font-medium focus:outline-none">
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} คน</option>)}
              </select>
            </div>
            <button onClick={searchAvailability} disabled={loadingRooms}
              className="flex items-center justify-center gap-2 bg-[#C66A30] hover:bg-[#A4522A] text-white rounded-xl font-medium py-2.5 transition-colors disabled:opacity-60 mt-5">
              {loadingRooms ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Calendar className="h-4 w-4" />}
              {loadingRooms ? 'กำลังค้นหา...' : 'ค้นหาห้องว่าง'}
            </button>
          </div>
          {nights > 0 && (
            <p className="text-xs text-[#2A2522]/40 mt-3 text-center">{nights} คืน · {format(new Date(search.checkIn+'T00:00:00'), 'd MMM', { locale: th })} → {format(new Date(search.checkOut+'T00:00:00'), 'd MMM yyyy', { locale: th })}</p>
          )}
        </div>
      </div>

      {/* Hotel info */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {hotel.description && (
            <div className="md:col-span-2">
              <h2 className="font-bold text-lg text-[#2A2522] mb-3">เกี่ยวกับที่พัก</h2>
              <p className="text-sm text-[#2A2522]/60 leading-relaxed">{hotel.description}</p>
            </div>
          )}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#2A2522]">ข้อมูลการเข้าพัก</h3>
            <InfoRow icon={Clock} label="Check-in" value={hotel.check_in_time || '14:00'} />
            <InfoRow icon={Clock} label="Check-out" value={hotel.check_out_time || '12:00'} />
            {hotel.phone && <InfoRow icon={Phone} label="โทร" value={hotel.phone} />}
            {hotel.email && <InfoRow icon={Mail} label="อีเมล" value={hotel.email} />}
          </div>
        </div>
      </div>
    </PublicLayout>
  );

  // ─── STEP: ROOMS ─────────────────────────────────────────────────────
  if (step === 'rooms') return (
    <PublicLayout hotel={hotel} user={user} step={step}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-xl text-[#2A2522]">เลือกห้องพัก</h2>
            <p className="text-sm text-[#2A2522]/50 mt-0.5">
              {format(new Date(search.checkIn+'T00:00:00'), 'd MMM', { locale: th })} →{' '}
              {format(new Date(search.checkOut+'T00:00:00'), 'd MMM', { locale: th })} · {nights} คืน · {search.adults} ผู้ใหญ่
            </p>
          </div>
          <button onClick={() => setStep('dates')} className="text-sm text-[#C66A30] hover:underline flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" /> แก้ไขวันที่
          </button>
        </div>

        {availableRooms.length === 0 && (
          <div className="text-center py-16 text-[#2A2522]/40">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">ไม่มีห้องว่างในวันที่เลือก</p>
            <p className="text-sm mt-1">กรุณาลองเลือกวันอื่น</p>
          </div>
        )}

        <div className="space-y-4">
          {availableRooms.map(rt => {
            const amenities: string[] = rt.amenities || [];
            const imgs: any[] = rt.room_type_images || [];
            const rate = Number(rt.effective_rate || rt.base_rate);
            const isAvail = rt.is_available !== false;

            return (
              <div key={rt.id} className={`bg-white rounded-2xl border overflow-hidden ${isAvail ? 'border-black/5' : 'border-black/5 opacity-60'}`}>
                <div className="md:flex">
                  {/* Image */}
                  <div className="md:w-64 h-48 md:h-auto bg-[#FAF7F2] shrink-0">
                    {imgs[0]?.image_url ? (
                      <img src={imgs[0].image_url} alt={rt.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#2A2522]/20">
                        <Bed className="h-12 w-12" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-5 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-[#2A2522]">{rt.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-[#2A2522]/50 mt-1">
                          {rt.size_sqm && <span className="flex items-center gap-1"><Maximize2 className="h-3 w-3" />{rt.size_sqm} ตร.ม.</span>}
                          {rt.max_occupancy && <span className="flex items-center gap-1"><Users className="h-3 w-3" />สูงสุด {rt.max_occupancy} คน</span>}
                          {rt.bed_type && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{rt.bed_type}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-[#2A2522]">{formatCurrency(rate)}</div>
                        <div className="text-xs text-[#2A2522]/40">/ คืน</div>
                      </div>
                    </div>

                    {rt.description && <p className="text-xs text-[#2A2522]/50 mb-3 line-clamp-2">{rt.description}</p>}

                    {amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {amenities.slice(0, 6).map((a: string) => {
                          const Icon = AMENITY_ICONS[a.toLowerCase()] || Check;
                          return (
                            <span key={a} className="flex items-center gap-1 text-2xs bg-[#FAF7F2] text-[#2A2522]/60 px-2 py-1 rounded-full">
                              <Icon className="h-3 w-3" />{a}
                            </span>
                          );
                        })}
                        {amenities.length > 6 && <span className="text-2xs text-[#2A2522]/40 px-2 py-1">+{amenities.length - 6}</span>}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between">
                      {isAvail ? (
                        <span className="text-xs text-emerald-600 flex items-center gap-1"><Check className="h-3.5 w-3.5" />ว่าง {rt.available_rooms > 0 ? rt.available_rooms : ''} ห้อง</span>
                      ) : (
                        <span className="text-xs text-red-500 flex items-center gap-1"><X className="h-3.5 w-3.5" />เต็มแล้ว</span>
                      )}
                      <button onClick={() => { setSelected(rt); setStep('details'); }} disabled={!isAvail}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#C66A30] hover:bg-[#A4522A] text-white rounded-xl font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        เลือกห้องนี้ <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PublicLayout>
  );

  // ─── STEP: DETAILS ───────────────────────────────────────────────────
  if (step === 'details') return (
    <PublicLayout hotel={hotel} user={user} step={step}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => setStep('rooms')} className="flex items-center gap-1.5 text-sm text-[#C66A30] hover:underline mb-6">
          <ChevronLeft className="h-4 w-4" /> กลับเลือกห้อง
        </button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Form */}
          <div className="md:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-black/5 p-6">
              <h2 className="font-bold text-[#2A2522] mb-4">ข้อมูลผู้เข้าพัก</h2>

              {user && guestAccount ? (
                <div className="flex items-center gap-3 mb-5 p-3 bg-[#FAF7F2] rounded-xl">
                  <div className="h-9 w-9 rounded-full bg-[#2A2522] text-white flex items-center justify-center font-bold text-sm">
                    {guestAccount.first_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#2A2522]">{guestAccount.first_name} {guestAccount.last_name || ''}</div>
                    <div className="text-xs text-[#2A2522]/50">{user.email}</div>
                  </div>
                  <span className="ml-auto text-xs text-emerald-600 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />ล็อกอินแล้ว</span>
                </div>
              ) : (
                <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    <Link href="/portal/login?next=back" className="font-medium underline">เข้าสู่ระบบ</Link> หรือ{' '}
                    <Link href="/portal/login?mode=register" className="font-medium underline">สมัครสมาชิก</Link>{' '}
                    เพื่อจัดการการจองและรับสิทธิพิเศษ
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <FormField label="ชื่อ *" value={guestInfo.firstName} onChange={v => setGuestInfo(p => ({ ...p, firstName: v }))} />
                <FormField label="นามสกุล" value={guestInfo.lastName} onChange={v => setGuestInfo(p => ({ ...p, lastName: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <FormField label="อีเมล *" type="email" value={guestInfo.email} onChange={v => setGuestInfo(p => ({ ...p, email: v }))} />
                <FormField label="เบอร์โทร" type="tel" value={guestInfo.phone} onChange={v => setGuestInfo(p => ({ ...p, phone: v }))} />
              </div>
              <FormField label="สัญชาติ" value={guestInfo.nationality} onChange={v => setGuestInfo(p => ({ ...p, nationality: v }))} placeholder="Thai" />
            </div>

            {/* Extra requests */}
            <div className="bg-white rounded-2xl border border-black/5 p-6">
              <h3 className="font-bold text-[#2A2522] mb-4">คำขอพิเศษ</h3>
              <div className="mb-4">
                <label className="text-xs text-[#2A2522]/50 mb-1.5 block">เวลาเช็คอินโดยประมาณ</label>
                <input type="time" value={guestInfo.estimatedArrival}
                  onChange={e => setGuestInfo(p => ({ ...p, estimatedArrival: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30" />
              </div>
              <textarea value={guestInfo.specialRequests}
                onChange={e => setGuestInfo(p => ({ ...p, specialRequests: e.target.value }))}
                rows={3} placeholder="เช่น ขอเตียงเสริม, แพ้ถั่วลิสง, ต้องการห้องชั้นสูง..."
                className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30" />
              <p className="text-xs text-[#2A2522]/40 mt-2">* คำขอพิเศษไม่สามารถรับประกันได้ 100% แต่ทางโรงแรมจะพยายามอย่างเต็มที่</p>
            </div>

            {/* Rate plan */}
            <div className="bg-white rounded-2xl border border-black/5 p-6">
              <h3 className="font-bold text-[#2A2522] mb-4">แผนราคา</h3>
              <div className="space-y-3">
                {[
                  { key: 'flexible', label: 'Standard Rate', desc: 'ยกเลิกฟรี 24 ชม.ก่อนเช็คอิน', rate: baseRate, badge: null },
                  { key: 'non_refundable', label: 'Non-refundable', desc: 'ราคาประหยัด ไม่สามารถยกเลิกคืนเงินได้', rate: baseRate * 0.9, badge: 'ประหยัด 10%' },
                ].map(plan => (
                  <label key={plan.key} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${ratePlan === plan.key ? 'border-[#C66A30] bg-[#C66A30]/5' : 'border-black/8 hover:border-[#C66A30]/30'}`}>
                    <input type="radio" name="ratePlan" value={plan.key} checked={ratePlan === plan.key}
                      onChange={() => setRatePlan(plan.key as any)} className="accent-[#C66A30]" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[#2A2522]">{plan.label}</span>
                        {plan.badge && <span className="text-2xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{plan.badge}</span>}
                      </div>
                      <p className="text-xs text-[#2A2522]/50 mt-0.5">{plan.desc}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#2A2522]">{formatCurrency(plan.rate)}</div>
                      <div className="text-xs text-[#2A2522]/40">/ คืน</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-2xl border border-black/5 p-6">
              <h3 className="font-bold text-[#2A2522] mb-4">วิธีชำระเงิน</h3>
              <div className="space-y-3">
                {[
                  { key: 'online', label: 'ชำระออนไลน์ตอนนี้', desc: 'บัตรเครดิต/เดบิต, PromptPay — ปลอดภัยและยืนยันทันที', badge: '🔒 แนะนำ' },
                  { key: 'at_hotel', label: 'ชำระที่โรงแรม (Pay at Hotel)', desc: 'จ่ายเมื่อเช็คอิน — ยกเลิกได้ฟรีทุกเมื่อก่อนวันเช็คอิน', badge: '' },
                ].map(pm => (
                  <label key={pm.key} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === pm.key ? 'border-[#C66A30] bg-[#C66A30]/5' : 'border-black/8 hover:border-[#C66A30]/30'}`}>
                    <input type="radio" name="paymentMethod" value={pm.key} checked={paymentMethod === pm.key}
                      onChange={() => setPaymentMethod(pm.key as any)} className="accent-[#C66A30] mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[#2A2522]">{pm.label}</span>
                        {pm.badge && <span className="text-2xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{pm.badge}</span>}
                      </div>
                      <p className="text-xs text-[#2A2522]/50 mt-0.5">{pm.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white rounded-2xl border border-black/5 p-5 sticky top-24">
              <h3 className="font-bold text-[#2A2522] mb-4">สรุปการจอง</h3>
              <div className="text-sm space-y-2.5 mb-4">
                <div className="font-medium text-[#2A2522]">{selected?.name}</div>
                <div className="text-[#2A2522]/50">{hotel.name}</div>
                <div className="border-t border-black/5 pt-2.5 space-y-2">
                  <SummaryRow label={`เช็คอิน`} value={format(new Date(search.checkIn+'T00:00:00'), 'd MMM yyyy', { locale: th })} />
                  <SummaryRow label="เช็คเอาท์" value={format(new Date(search.checkOut+'T00:00:00'), 'd MMM yyyy', { locale: th })} />
                  <SummaryRow label="จำนวนคืน" value={`${nights} คืน`} />
                  <SummaryRow label="จำนวนผู้เข้าพัก" value={`${search.adults} คน`} />
                </div>
                <div className="border-t border-black/5 pt-2.5 space-y-2">
                  <SummaryRow label={`${formatCurrency(baseRate * rateMultiplier)} × ${nights} คืน`} value={formatCurrency(subtotal)} />
                  <SummaryRow label="VAT 7%" value={formatCurrency(vat)} />
                  <div className="flex justify-between font-bold text-[#2A2522] pt-2 border-t border-black/5">
                    <span>รวมทั้งสิ้น</span>
                    <span className="text-lg">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setStep('review')} disabled={!guestInfo.firstName || !guestInfo.email}
                className="w-full py-3 bg-[#C66A30] hover:bg-[#A4522A] text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                ถัดไป: ตรวจสอบข้อมูล
              </button>
              <div className="flex items-center gap-2 mt-3 text-xs text-[#2A2522]/40 justify-center">
                <ShieldCheck className="h-3.5 w-3.5" /> ข้อมูลของคุณได้รับการปกป้อง
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );

  // ─── STEP: REVIEW ────────────────────────────────────────────────────
  if (step === 'review') return (
    <PublicLayout hotel={hotel} user={user} step={step}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => setStep('details')} className="flex items-center gap-1.5 text-sm text-[#C66A30] hover:underline mb-6">
          <ChevronLeft className="h-4 w-4" /> แก้ไขข้อมูล
        </button>

        <h2 className="text-xl font-bold text-[#2A2522] mb-6">ตรวจสอบและยืนยันการจอง</h2>

        <div className="space-y-4 mb-6">
          <Section title="ที่พัก">
            <div className="flex items-start gap-4">
              {hotel.hero_image_url && <img src={hotel.hero_image_url} alt={hotel.name} className="h-20 w-28 object-cover rounded-lg" />}
              <div>
                <div className="font-semibold text-[#2A2522]">{hotel.name}</div>
                <div className="text-sm text-[#2A2522]/60">{selected?.name}</div>
                {hotel.city && <div className="text-xs text-[#2A2522]/40 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{hotel.city}</div>}
              </div>
            </div>
          </Section>

          <Section title="วันที่เข้าพัก">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><div className="text-xs text-[#2A2522]/40 mb-0.5">เช็คอิน</div><div className="font-medium">{format(new Date(search.checkIn+'T00:00:00'), 'EEE d MMM yyyy', { locale: th })}</div><div className="text-xs text-[#2A2522]/50">หลัง {hotel.check_in_time || '14:00'} น.</div></div>
              <div><div className="text-xs text-[#2A2522]/40 mb-0.5">เช็คเอาท์</div><div className="font-medium">{format(new Date(search.checkOut+'T00:00:00'), 'EEE d MMM yyyy', { locale: th })}</div><div className="text-xs text-[#2A2522]/50">ก่อน {hotel.check_out_time || '12:00'} น.</div></div>
              <div><div className="text-xs text-[#2A2522]/40 mb-0.5">ระยะเวลา</div><div className="font-medium">{nights} คืน</div><div className="text-xs text-[#2A2522]/50">{search.adults} ผู้ใหญ่</div></div>
            </div>
          </Section>

          <Section title="ข้อมูลผู้เข้าพัก">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-[#2A2522]/40">ชื่อ-นามสกุล</div><div className="font-medium">{guestInfo.firstName} {guestInfo.lastName}</div></div>
              <div><div className="text-xs text-[#2A2522]/40">อีเมล</div><div className="font-medium">{guestInfo.email}</div></div>
              {guestInfo.phone && <div><div className="text-xs text-[#2A2522]/40">โทร</div><div className="font-medium">{guestInfo.phone}</div></div>}
              {guestInfo.nationality && <div><div className="text-xs text-[#2A2522]/40">สัญชาติ</div><div className="font-medium">{guestInfo.nationality}</div></div>}
            </div>
            {guestInfo.specialRequests && (
              <div className="mt-3 p-3 bg-[#FAF7F2] rounded-lg text-xs text-[#2A2522]/60">
                <span className="font-medium">คำขอพิเศษ: </span>{guestInfo.specialRequests}
              </div>
            )}
          </Section>

          <Section title="ยอดชำระ">
            <div className="space-y-2 text-sm">
              <SummaryRow label={`ค่าห้อง ${formatCurrency(baseRate * rateMultiplier)} × ${nights} คืน`} value={formatCurrency(subtotal)} />
              <SummaryRow label="VAT 7%" value={formatCurrency(vat)} />
              <div className="flex justify-between font-bold text-[#2A2522] text-base pt-2 border-t border-black/5">
                <span>รวมทั้งสิ้น</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <p className="text-xs text-[#2A2522]/40">
                {ratePlan === 'flexible' ? '✓ ยกเลิกฟรีภายใน 24 ชั่วโมงก่อนเช็คอิน' : '⚠️ อัตรานี้ไม่สามารถยกเลิกคืนเงินได้'}
              </p>
            </div>
          </Section>
        </div>

        <button onClick={handleBook} disabled={submitting}
          className="w-full py-4 bg-[#C66A30] hover:bg-[#A4522A] text-white rounded-2xl font-bold text-base transition-colors disabled:opacity-60 flex items-center justify-center gap-3">
          {submitting ? <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          {submitting ? 'กำลังยืนยัน...' : `ยืนยันการจอง ${formatCurrency(total)}`}
        </button>
        <p className="text-center text-xs text-[#2A2522]/40 mt-3">
          การกดยืนยันถือว่าคุณยอมรับ <Link href="/terms" className="underline">เงื่อนไขการใช้งาน</Link> และ <Link href="/privacy" className="underline">นโยบายความเป็นส่วนตัว</Link>
        </p>
      </div>
    </PublicLayout>
  );

  // ─── STEP: CONFIRMED ─────────────────────────────────────────────────
  return (
    <PublicLayout hotel={hotel} user={user} step={step}>
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-10 w-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#2A2522] mb-2">จองสำเร็จแล้ว! 🎉</h2>
        <p className="text-[#2A2522]/60 mb-2">รหัสการจองของคุณ</p>
        <div className="font-mono text-3xl font-bold text-[#C66A30] tracking-widest mb-2">
          {reservation?.reservation_code}
        </div>
        <p className="text-sm text-[#2A2522]/50 mb-8">ระบบส่งอีเมลยืนยันไปที่ <strong>{guestInfo.email}</strong> แล้ว</p>

        <div className="bg-white rounded-2xl border border-black/5 p-6 text-left mb-6">
          <h3 className="font-semibold text-[#2A2522] mb-4">สรุปการจอง</h3>
          <div className="space-y-3 text-sm">
            <SummaryRow label="โรงแรม" value={hotel.name} />
            <SummaryRow label="ห้องพัก" value={selected?.name} />
            <SummaryRow label="เช็คอิน" value={format(new Date(search.checkIn+'T00:00:00'), 'd MMMM yyyy', { locale: th })} />
            <SummaryRow label="เช็คเอาท์" value={format(new Date(search.checkOut+'T00:00:00'), 'd MMMM yyyy', { locale: th })} />
            <SummaryRow label="ยอดรวม" value={formatCurrency(total)} />
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          {user ? (
            <Link href="/portal/bookings" className="flex items-center gap-2 px-6 py-3 bg-[#2A2522] text-white rounded-xl font-medium text-sm">
              ดูการจองของฉัน <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link href="/portal/login?next=/portal/bookings" className="flex items-center gap-2 px-6 py-3 bg-[#C66A30] text-white rounded-xl font-medium text-sm">
              สมัครสมาชิก / เข้าสู่ระบบ <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          <button onClick={() => window.print()} className="px-6 py-3 border border-black/10 text-[#2A2522] rounded-xl font-medium text-sm hover:bg-black/5 transition-colors">
            พิมพ์ใบยืนยัน
          </button>
        </div>
      </div>
    </PublicLayout>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PublicLayout({ hotel, user, step, children }: any) {
  const STEP_LABELS: Record<string, string> = {
    dates: 'เลือกวันที่', rooms: 'เลือกห้อง', details: 'กรอกข้อมูล',
    review: 'ตรวจสอบ', confirmed: 'เสร็จสิ้น',
  };
  const STEP_ORDER = ['dates', 'rooms', 'details', 'review', 'confirmed'];
  const currentIdx = STEP_ORDER.indexOf(step);

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Nav */}
      <nav className="bg-white border-b border-black/5 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={`/h/${hotel.slug || hotel.id}`} className="flex items-center gap-2">
            {hotel.logo_url && <img src={hotel.logo_url} alt="logo" className="h-7" />}
            <span className="font-bold text-[#2A2522]">{hotel.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            {step !== 'confirmed' && step !== 'dates' && (
              <div className="hidden md:flex items-center gap-1">
                {STEP_ORDER.slice(0, -1).map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${i <= currentIdx ? 'bg-[#2A2522] text-white' : 'text-[#2A2522]/30'}`}>
                      {i < currentIdx ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
                      {STEP_LABELS[s]}
                    </div>
                    {i < STEP_ORDER.length - 2 && <ChevronRight className="h-3 w-3 text-[#2A2522]/20 mx-0.5" />}
                  </div>
                ))}
              </div>
            )}
            {user ? (
              <Link href="/portal/bookings" className="flex items-center gap-1.5 text-xs text-[#2A2522]/60 hover:text-[#2A2522] px-3 py-1.5 rounded-lg hover:bg-black/5">
                <User className="h-4 w-4" /> การจองของฉัน
              </Link>
            ) : (
              <>
                <CurrencySwitcher />
                <Link href="/portal/login" className="text-xs text-[#C66A30] hover:underline font-medium">เข้าสู่ระบบ</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <div>{children}</div>
      {/* Footer */}
      <GuestChatWidget hotelId={hotel.id} hotelName={hotel.name} />
      <footer className="border-t border-black/5 bg-white mt-16 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-[#2A2522]/30">
          © {new Date().getFullYear()} {hotel.name} · Powered by <Link href="/" className="font-semibold text-[#C66A30]">Maitri</Link>
        </div>
      </footer>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-[#C66A30] shrink-0" />
      <span className="text-[#2A2522]/50">{label}:</span>
      <span className="text-[#2A2522] font-medium">{value}</span>
    </div>
  );
}
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#2A2522]/60">{label}</span>
      <span className="font-medium text-[#2A2522]">{value}</span>
    </div>
  );
}
function FormField({ label, value, onChange, type = 'text', placeholder }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-[#2A2522]/50 mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30 focus:border-[#C66A30] transition-all" />
    </div>
  );
}
function Section({ title, children }: any) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-5">
      <h3 className="font-semibold text-[#2A2522] text-sm mb-3">{title}</h3>
      {children}
    </div>
  );
}
