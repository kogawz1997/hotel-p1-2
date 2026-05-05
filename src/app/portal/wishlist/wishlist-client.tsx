'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Heart, MapPin, ArrowLeft, Bed, Users, Maximize2, ChevronRight, Calendar } from 'lucide-react';

export function WishlistClient({ guest, wishlists: initial }: { guest: any; wishlists: any[] }) {
  const [items, setItems] = useState(initial);

  async function remove(id: string) {
    const res = await fetch(`/api/guest/wishlist?id=${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('ลบไม่สำเร็จ'); return; }
    setItems(p => p.filter(i => i.id !== id));
    toast.success('ลบออกจาก Wishlist แล้ว');
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <nav className="bg-white border-b border-black/5 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/portal/bookings" className="p-2 rounded-full hover:bg-black/5 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-medium text-[#2A2522]">
            Wishlist <span className="text-[#2A2522]/40 font-normal">({items.length})</span>
          </span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="text-center py-24">
            <div className="h-16 w-16 bg-[#FAF7F2] border-2 border-dashed border-black/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-7 w-7 text-[#2A2522]/20" />
            </div>
            <h2 className="font-semibold text-[#2A2522] mb-2">ยังไม่มีรายการโปรด</h2>
            <p className="text-sm text-[#2A2522]/40 mb-6">กดไอคอน ❤️ ที่หน้าโรงแรมเพื่อบันทึก</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#C66A30] text-white rounded-xl text-sm font-medium hover:bg-[#A4522A] transition-colors">
              ค้นหาที่พัก <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {items.map(item => {
              const hotel = item.hotels as any;
              const rt = item.room_types as any;
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-black/5 overflow-hidden group">
                  <div className="relative h-44 bg-[#FAF7F2] overflow-hidden">
                    {hotel?.hero_image_url ? (
                      <img src={hotel.hero_image_url} alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl text-[#2A2522]/10 font-serif">{hotel?.name?.charAt(0)}</span>
                      </div>
                    )}
                    <button onClick={() => remove(item.id)}
                      className="absolute top-3 right-3 h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors">
                      <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="mb-1">
                      <h3 className="font-semibold text-[#2A2522]">{hotel?.name}</h3>
                      {hotel?.city && (
                        <p className="text-xs text-[#2A2522]/40 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />{hotel.city}
                        </p>
                      )}
                    </div>

                    {rt && (
                      <div className="mt-2 p-2.5 bg-[#FAF7F2] rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#2A2522]">{rt.name}</span>
                          <span className="text-sm font-bold text-[#C66A30]">
                            {formatCurrency(rt.base_rate)}<span className="text-xs font-normal text-[#2A2522]/40">/คืน</span>
                          </span>
                        </div>
                        <div className="flex gap-3 mt-1 text-2xs text-[#2A2522]/40">
                          {rt.max_occupancy && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{rt.max_occupancy} คน</span>}
                          {rt.size_sqm && <span className="flex items-center gap-1"><Maximize2 className="h-3 w-3" />{rt.size_sqm} ตร.ม.</span>}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Link href={`/h/${hotel?.slug || hotel?.id}`}
                        className="flex-1 text-center py-2 border border-black/10 rounded-lg text-xs font-medium text-[#2A2522] hover:bg-black/5 transition-colors">
                        ดูรายละเอียด
                      </Link>
                      <Link href={`/booking/${hotel?.slug || hotel?.id}`}
                        className="flex-1 text-center py-2 bg-[#C66A30] text-white rounded-lg text-xs font-medium hover:bg-[#A4522A] transition-colors flex items-center justify-center gap-1">
                        <Calendar className="h-3 w-3" /> จองเลย
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
