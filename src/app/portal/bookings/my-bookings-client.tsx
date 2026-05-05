'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Calendar, Bed, MapPin, Clock, Star, Download, MessageSquare,
  X, ChevronRight, User, LogOut, Heart, Settings, QrCode,
} from 'lucide-react';

const STATUS: Record<string, { label: string; color: string }> = {
  confirmed:   { label: 'ยืนยันแล้ว',   color: 'bg-sky-100 text-sky-700' },
  checked_in:  { label: 'เช็คอินแล้ว', color: 'bg-emerald-100 text-emerald-700' },
  checked_out: { label: 'เช็คเอาท์แล้ว', color: 'bg-gray-100 text-gray-600' },
  cancelled:   { label: 'ยกเลิกแล้ว',  color: 'bg-red-100 text-red-600' },
  pending:     { label: 'รอยืนยัน',    color: 'bg-amber-100 text-amber-700' },
  no_show:     { label: 'ไม่มาตามนัด',  color: 'bg-red-100 text-red-600' },
};

export function MyBookingsClient({ guest }: { guest: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [selected, setSelected] = useState<any>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [requests, setRequests] = useState({ text: '', arrival: '' });
  const [review, setReview] = useState({ rating: 5, clean: 5, service: 5, location: 5, value: 5, title: '', comment: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadBookings(); }, []);

  async function loadBookings() {
    setLoading(true);
    const [bookRes, loyaltyRes] = await Promise.all([
      fetch('/api/guest/bookings'),
      fetch('/api/guest/loyalty'),
    ]);
    const bookData = await bookRes.json();
    const loyaltyData = loyaltyRes.ok ? await loyaltyRes.json() : {};
    setBookings(bookData.reservations || []);
    if (loyaltyData.points !== undefined) setLoyaltyPoints(loyaltyData);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const now = new Date();
  const upcoming  = bookings.filter(b => !['cancelled','no_show'].includes(b.status) && isAfter(parseISO(b.check_out), now));
  const past      = bookings.filter(b => ['checked_out'].includes(b.status) || (b.status !== 'cancelled' && isBefore(parseISO(b.check_out), now)));
  const cancelled = bookings.filter(b => ['cancelled','no_show'].includes(b.status));
  const tabs = { upcoming, past, cancelled };
  const current = tabs[activeTab];

  async function doCancel() {
    if (!selected) return;
    setActionLoading(true);
    const res = await fetch(`/api/guest/bookings/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', reason: cancelReason }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { toast.error(data.error); return; }
    toast.success('ยกเลิกการจองเรียบร้อย');
    setShowCancel(false); setSelected(null);
    loadBookings();
  }

  async function doUpdateRequests() {
    if (!selected) return;
    setActionLoading(true);
    const res = await fetch(`/api/guest/bookings/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_requests', specialRequests: requests.text, estimatedArrival: requests.arrival }),
    });
    setActionLoading(false);
    if (!res.ok) { toast.error('เกิดข้อผิดพลาด'); return; }
    toast.success('บันทึกคำขอพิเศษแล้ว');
    setShowRequests(false); loadBookings();
  }

  async function doReview() {
    if (!selected) return;
    setActionLoading(true);
    const res = await fetch('/api/guest/reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotelId: selected.hotels?.id, reservationId: selected.id,
        rating: review.rating, ratingClean: review.clean, ratingService: review.service,
        ratingLocation: review.location, ratingValue: review.value,
        title: review.title, comment: review.comment,
        reviewerName: `${guest.first_name} ${guest.last_name || ''}`.trim(),
      }),
    });
    setActionLoading(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
    toast.success('ขอบคุณสำหรับรีวิว!');
    setShowReview(false);
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Top nav */}
      <nav className="bg-white border-b border-black/5 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-medium text-[#2A2522]">Maitri</Link>
          <div className="flex items-center gap-3">
            <Link href="/portal/wishlist" className="p-2 rounded-full hover:bg-black/5 transition-colors">
              <Heart className="h-4 w-4 text-[#2A2522]/60" />
            </Link>
            <Link href="/portal/profile" className="p-2 rounded-full hover:bg-black/5 transition-colors">
              <User className="h-4 w-4 text-[#2A2522]/60" />
            </Link>
            <button onClick={logout} className="p-2 rounded-full hover:bg-black/5 transition-colors">
              <LogOut className="h-4 w-4 text-[#2A2522]/60" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-[#C66A30] font-medium mb-1">สวัสดี 👋</p>
          <h1 className="text-2xl font-bold text-[#2A2522]">{guest.first_name} {guest.last_name || ''}</h1>
          <p className="text-sm text-[#2A2522]/50">{guest.email}</p>
          {loyaltyPoints && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                ⭐ {(loyaltyPoints.points || 0).toLocaleString()} แต้ม · {loyaltyPoints.tier || 'Bronze'}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'การจองทั้งหมด', value: bookings.length },
            { label: 'ที่กำลังจะมา', value: upcoming.length },
            { label: 'เสร็จสิ้นแล้ว', value: past.length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-black/5">
              <div className="text-2xl font-bold text-[#2A2522]">{s.value}</div>
              <div className="text-xs text-[#2A2522]/50 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-black/5 mb-6">
          {[
            { key: 'upcoming', label: `ที่กำลังจะมา (${upcoming.length})` },
            { key: 'past',     label: `ผ่านมาแล้ว (${past.length})` },
            { key: 'cancelled', label: `ยกเลิก (${cancelled.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              className={cn('flex-1 py-2 text-sm rounded-lg font-medium transition-all',
                activeTab === t.key ? 'bg-[#2A2522] text-white' : 'text-[#2A2522]/50 hover:text-[#2A2522]')}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />)}</div>
        ) : current.length === 0 ? (
          <div className="text-center py-20 text-[#2A2522]/40">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">ไม่มีการจองในหมวดนี้</p>
          </div>
        ) : (
          <div className="space-y-4">
            {current.map(b => {
              const hotel = b.hotels || {};
              const rt = b.room_types || {};
              const nights = b.nights || 0;
              const isUpcoming = isAfter(parseISO(b.check_in), now);
              const canCancel = isUpcoming && b.status === 'confirmed';
              const canReview = b.status === 'checked_out';
              const st = STATUS[b.status] || STATUS.confirmed;

              return (
                <div key={b.id} className="bg-white rounded-2xl border border-black/5 overflow-hidden">
                  {/* Hotel hero */}
                  <div className="relative h-32 bg-[#2A2522]/10">
                    {hotel.hero_image_url && (
                      <img src={hotel.hero_image_url} alt={hotel.name} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-4 text-white">
                      <div className="font-bold">{hotel.name}</div>
                      {hotel.city && <div className="text-xs opacity-80 flex items-center gap-1"><MapPin className="h-3 w-3" />{hotel.city}</div>}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', st.color)}>{st.label}</span>
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Code */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-xs text-[#2A2522]/40 mb-0.5">รหัสการจอง</div>
                        <div className="font-mono font-bold text-[#2A2522] tracking-wider">{b.reservation_code}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#2A2522]/40 mb-0.5">ยอดรวม</div>
                        <div className="font-bold text-[#2A2522]">{formatCurrency(b.total_amount)}</div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <Detail icon={Calendar} label="เช็คอิน" value={format(parseISO(b.check_in+'T00:00:00'), 'EEE d MMM yyyy', { locale: th })} />
                      <Detail icon={Calendar} label="เช็คเอาท์" value={format(parseISO(b.check_out+'T00:00:00'), 'EEE d MMM yyyy', { locale: th })} />
                      <Detail icon={Bed} label="ประเภทห้อง" value={rt.name || '—'} />
                      <Detail icon={Clock} label="จำนวนคืน" value={`${nights} คืน`} />
                    </div>

                    {b.special_requests && (
                      <div className="mb-4 p-3 bg-[#FAF7F2] rounded-lg text-xs text-[#2A2522]/70">
                        <span className="font-medium">คำขอพิเศษ: </span>{b.special_requests}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {canCancel && (
                        <>
                          <button onClick={() => { setSelected(b); setShowRequests(true); setRequests({ text: b.special_requests || '', arrival: b.estimated_arrival || '' }); }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-black/10 rounded-lg hover:bg-black/5 transition-colors">
                            <MessageSquare className="h-3.5 w-3.5" /> คำขอพิเศษ
                          </button>
                          <button onClick={() => { setSelected(b); setShowCancel(true); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                            <X className="h-3.5 w-3.5" /> ยกเลิก
                          </button>
                        </>
                      )}
                      {canReview && (
                        <button onClick={() => { setSelected(b); setShowReview(true); }}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#C66A30] text-white rounded-lg hover:bg-[#A4522A] transition-colors">
                          <Star className="h-3.5 w-3.5" /> รีวิว
                        </button>
                      )}
                      {hotel.id && (
                        <Link href={`/booking/${hotel.slug || hotel.id}`}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#2A2522] text-white rounded-lg hover:bg-black transition-colors">
                          จองอีกครั้ง <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {showCancel && (
        <Modal title="ยกเลิกการจอง" onClose={() => setShowCancel(false)}>
          <p className="text-sm text-[#2A2522]/60 mb-4">
            คุณต้องการยกเลิกการจอง <strong>{selected?.reservation_code}</strong>?<br />
            สามารถยกเลิกได้ฟรีหากเช็คอินเกิน 24 ชั่วโมง
          </p>
          <select value={cancelReason} onChange={e => setCancelReason(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30">
            <option value="">เลือกเหตุผล...</option>
            <option value="change_plans">เปลี่ยนแผนการเดินทาง</option>
            <option value="found_better">พบที่พักอื่นที่เหมาะกว่า</option>
            <option value="emergency">เหตุฉุกเฉิน</option>
            <option value="other">อื่นๆ</option>
          </select>
          <div className="flex gap-3">
            <button onClick={() => setShowCancel(false)} className="flex-1 py-2.5 border border-black/10 rounded-xl text-sm font-medium">ยกเลิก</button>
            <button onClick={doCancel} disabled={actionLoading || !cancelReason}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
              {actionLoading ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิก'}
            </button>
          </div>
        </Modal>
      )}

      {/* Special requests modal */}
      {showRequests && (
        <Modal title="คำขอพิเศษ" onClose={() => setShowRequests(false)}>
          <div className="space-y-4 mb-5">
            <div>
              <label className="text-xs text-[#2A2522]/50 mb-1.5 block">คำขอพิเศษ</label>
              <textarea value={requests.text} onChange={e => setRequests(p => ({ ...p, text: e.target.value }))}
                rows={4} placeholder="เช่น ต้องการห้องชั้นสูง, ที่พักสัตว์เลี้ยง, แพ้อาหาร..."
                className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30" />
            </div>
            <div>
              <label className="text-xs text-[#2A2522]/50 mb-1.5 block">เวลาเช็คอินโดยประมาณ</label>
              <input type="time" value={requests.arrival} onChange={e => setRequests(p => ({ ...p, arrival: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowRequests(false)} className="flex-1 py-2.5 border border-black/10 rounded-xl text-sm font-medium">ยกเลิก</button>
            <button onClick={doUpdateRequests} disabled={actionLoading}
              className="flex-1 py-2.5 bg-[#C66A30] text-white rounded-xl text-sm font-medium disabled:opacity-50">
              {actionLoading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </Modal>
      )}

      {/* Review modal */}
      {showReview && (
        <Modal title={`รีวิว ${selected?.hotels?.name}`} onClose={() => setShowReview(false)}>
          <div className="space-y-4 mb-5">
            {[
              { key: 'rating', label: 'ภาพรวม' },
              { key: 'clean', label: 'ความสะอาด' },
              { key: 'service', label: 'บริการ' },
              { key: 'location', label: 'ทำเล' },
              { key: 'value', label: 'ความคุ้มค่า' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setReview(p => ({ ...p, [key]: n }))}
                      className={cn('h-7 w-7 rounded-full text-xs font-bold transition-colors',
                        (review as any)[key] >= n ? 'bg-[#C66A30] text-white' : 'bg-black/5 text-[#2A2522]/40')}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <input value={review.title} onChange={e => setReview(p => ({ ...p, title: e.target.value }))}
              placeholder="หัวข้อรีวิว (ไม่บังคับ)"
              className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30" />
            <textarea value={review.comment} onChange={e => setReview(p => ({ ...p, comment: e.target.value }))}
              rows={4} placeholder="แชร์ประสบการณ์การเข้าพักของคุณ..."
              className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowReview(false)} className="flex-1 py-2.5 border border-black/10 rounded-xl text-sm font-medium">ยกเลิก</button>
            <button onClick={doReview} disabled={actionLoading}
              className="flex-1 py-2.5 bg-[#C66A30] text-white rounded-xl text-sm font-medium disabled:opacity-50">
              {actionLoading ? 'กำลังส่ง...' : 'ส่งรีวิว ⭐'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-[#C66A30] mt-0.5 shrink-0" />
      <div>
        <div className="text-2xs text-[#2A2522]/40">{label}</div>
        <div className="text-xs font-medium text-[#2A2522]">{value}</div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-black/5">
          <h3 className="font-semibold text-[#2A2522]">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
