import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { GuestChatWidget } from '@/components/booking/guest-chat-widget';
import { useLightbox } from '@/components/ui/lightbox';
import { WishlistButton } from '@/components/ui/wishlist-button';
import { formatCurrency } from '@/lib/utils';
import { MapPin, Phone, Mail, Star, Clock, Wifi, Bed, ChevronRight, Users, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';

export default async function HotelLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('*, hotel_gallery(image_url, alt_text, display_order)')
    .eq('slug', slug)
    .single();
  if (!hotel) notFound();

  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('*, room_type_images(image_url)')
    .eq('hotel_id', hotel.id)
    .order('base_rate');

  const { data: reviews } = await supabase
    .from('booking_reviews')
    .select('*')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })
    .limit(6);

  const avgRating = reviews?.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const gallery = (hotel.hotel_gallery || []).sort((a: any, b: any) => a.display_order - b.display_order);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hotel.logo_url && <img src={hotel.logo_url} alt="logo" className="h-8" />}
            <span className="font-bold text-[#2A2522] text-lg">{hotel.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#rooms" className="text-sm text-[#2A2522]/60 hover:text-[#2A2522] hidden md:block">ห้องพัก</a>
            <a href="#reviews" className="text-sm text-[#2A2522]/60 hover:text-[#2A2522] hidden md:block">รีวิว</a>
            <a href="#contact" className="text-sm text-[#2A2522]/60 hover:text-[#2A2522] hidden md:block">ติดต่อ</a>
            <WishlistButton hotelId={hotel.id} />
            <Link href={`/booking/${slug}`}
              className="px-5 py-2 bg-[#C66A30] text-white rounded-full text-sm font-medium hover:bg-[#A4522A] transition-colors">
              จองเลย
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero gallery */}
      <div className="relative">
        {gallery.length > 1 ? (
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[65vh] max-h-[600px]">
            <div className="col-span-2 row-span-2 overflow-hidden">
              <img src={gallery[0].image_url} alt={gallery[0].alt_text || hotel.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            {gallery.slice(1, 5).map((img: any, i: number) => (
              <div key={i} className="overflow-hidden relative">
                <img src={img.image_url} alt={img.alt_text || ''}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                {i === 3 && gallery.length > 5 && (
                  <Link href={`/booking/${slug}`}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium text-sm hover:bg-black/40 transition-colors">
                    +{gallery.length - 5} รูป
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[60vh] max-h-[500px] overflow-hidden">
            <img
              src={hotel.hero_image_url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600'}
              alt={hotel.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Hotel intro */}
        <div className="py-8 border-b border-black/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#2A2522] mb-2">{hotel.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#2A2522]/50">
                {hotel.city && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#C66A30]" />{hotel.city}, {hotel.country || 'Thailand'}</span>}
                {avgRating && (
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <strong className="text-[#2A2522]">{avgRating}</strong> ({reviews?.length} รีวิว)
                  </span>
                )}
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />เช็คอิน {hotel.check_in_time || '14:00'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#2A2522]/40 mb-1">ราคาเริ่มต้น</div>
              <div className="text-3xl font-bold text-[#C66A30]">
                {formatCurrency(Math.min(...(roomTypes || []).map((r: any) => r.base_rate).filter(Boolean)))}
              </div>
              <div className="text-xs text-[#2A2522]/40">/ คืน</div>
            </div>
          </div>
        </div>

        {/* Description */}
        {hotel.description && (
          <div className="py-8 border-b border-black/5 max-w-3xl">
            <h2 className="text-xl font-bold text-[#2A2522] mb-3">เกี่ยวกับที่พัก</h2>
            <p className="text-[#2A2522]/60 leading-relaxed">{hotel.description}</p>
          </div>
        )}

        {/* Rooms */}
        <div id="rooms" className="py-10 border-b border-black/5">
          <h2 className="text-2xl font-bold text-[#2A2522] mb-6">ห้องพัก</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {(roomTypes || []).map((rt: any) => {
              const imgs = rt.room_type_images || [];
              const amenities: string[] = rt.amenities || [];
              return (
                <div key={rt.id} className="border border-black/8 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-52 bg-[#FAF7F2] overflow-hidden">
                    {imgs[0]?.image_url ? (
                      <img src={imgs[0].image_url} alt={rt.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#2A2522]/20">
                        <Bed className="h-16 w-16" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-[#2A2522]">{rt.name}</h3>
                      <div className="text-right">
                        <span className="font-bold text-lg text-[#2A2522]">{formatCurrency(rt.base_rate)}</span>
                        <span className="text-xs text-[#2A2522]/40"> / คืน</span>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs text-[#2A2522]/50 mb-3">
                      {rt.size_sqm && <span className="flex items-center gap-1"><Maximize2 className="h-3 w-3" />{rt.size_sqm} ตร.ม.</span>}
                      {rt.max_occupancy && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{rt.max_occupancy} คน</span>}
                      {rt.bed_type && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{rt.bed_type}</span>}
                    </div>
                    {rt.description && <p className="text-xs text-[#2A2522]/50 mb-3 line-clamp-2">{rt.description}</p>}
                    {amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {amenities.slice(0, 4).map((a: string) => (
                          <span key={a} className="text-2xs bg-[#FAF7F2] text-[#2A2522]/60 px-2 py-0.5 rounded-full">{a}</span>
                        ))}
                      </div>
                    )}
                    <Link href={`/booking/${slug}?roomType=${rt.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#2A2522] text-white rounded-xl text-sm font-medium hover:bg-black transition-colors">
                      เลือกห้องนี้ <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div id="reviews" className="py-10 border-b border-black/5">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-[#2A2522]">รีวิวจากแขก</h2>
              {avgRating && (
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-amber-700">{avgRating}</span>
                  <span className="text-xs text-amber-600">/ 5</span>
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {reviews.map(r => (
                <div key={r.id} className="p-4 bg-[#FAF7F2] rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#2A2522] text-white flex items-center justify-center text-sm font-bold">
                        {(r.reviewer_name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#2A2522]">{r.reviewer_name || 'แขกผู้เข้าพัก'}</div>
                        <div className="text-xs text-[#2A2522]/40">{r.verified_stay && '✓ เข้าพักจริง'}</div>
                      </div>
                    </div>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-[#2A2522]/10'}`} />
                      ))}
                    </div>
                  </div>
                  {r.title && <p className="text-sm font-semibold text-[#2A2522] mb-1">{r.title}</p>}
                  {r.comment && <p className="text-sm text-[#2A2522]/60 line-clamp-3">{r.comment}</p>}
                  {r.reply_text && (
                    <div className="mt-3 pl-3 border-l-2 border-[#C66A30]/30">
                      <p className="text-xs text-[#C66A30] font-medium mb-0.5">ตอบกลับจากโรงแรม</p>
                      <p className="text-xs text-[#2A2522]/60">{r.reply_text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div id="contact" className="py-10">
          <h2 className="text-2xl font-bold text-[#2A2522] mb-6">ติดต่อและที่ตั้ง</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {hotel.address && <InfoItem icon={MapPin} label="ที่อยู่" value={hotel.address} />}
              {hotel.phone && <InfoItem icon={Phone} label="โทรศัพท์" value={hotel.phone} />}
              {hotel.email && <InfoItem icon={Mail} label="อีเมล" value={hotel.email} />}
              <InfoItem icon={Clock} label="เช็คอิน / เช็คเอาท์" value={`${hotel.check_in_time || '14:00'} / ${hotel.check_out_time || '12:00'}`} />
            </div>
            <div className="bg-[#FAF7F2] rounded-2xl p-5 text-center">
              <p className="text-[#2A2522]/60 text-sm mb-4">พร้อมที่จะเข้าพักกับเรา?</p>
              <Link href={`/booking/${slug}`}
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#C66A30] text-white rounded-full font-medium hover:bg-[#A4522A] transition-colors">
                จองห้องพัก <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <GuestChatWidget hotelId={hotel.id} hotelName={hotel.name} />
      <footer className="bg-[#2A2522] text-white/60 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          © {new Date().getFullYear()} {hotel.name} · Powered by <Link href="/" className="text-[#C66A30] font-semibold">Maitri</Link>
        </div>
      </footer>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-[#C66A30] mt-0.5 shrink-0" />
      <div>
        <div className="text-xs text-[#2A2522]/40">{label}</div>
        <div className="text-sm font-medium text-[#2A2522]">{value}</div>
      </div>
    </div>
  );
}
