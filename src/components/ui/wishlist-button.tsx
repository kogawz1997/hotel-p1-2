'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function WishlistButton({ hotelId, roomTypeId }: { hotelId: string; roomTypeId?: string }) {
  const supabase = createClient();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('guest_wishlists')
        .select('id')
        .eq('guest_account_id', user.id)
        .eq('hotel_id', hotelId)
        .maybeSingle();
      setSaved(!!data);
    }
    check();
  }, [hotelId]);

  async function toggle() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.info('กรุณาเข้าสู่ระบบเพื่อบันทึก Wishlist');
      return;
    }
    setLoading(true);
    if (saved) {
      const { data } = await supabase.from('guest_wishlists').select('id')
        .eq('guest_account_id', user.id).eq('hotel_id', hotelId).maybeSingle();
      if (data) {
        await supabase.from('guest_wishlists').delete().eq('id', data.id);
        setSaved(false);
        toast.success('ลบออกจาก Wishlist');
      }
    } else {
      await supabase.from('guest_wishlists').upsert({
        guest_account_id: user.id, hotel_id: hotelId,
        room_type_id: roomTypeId || null,
      }, { onConflict: 'guest_account_id,hotel_id,room_type_id' });
      setSaved(true);
      toast.success('บันทึกใน Wishlist แล้ว ❤️');
    }
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`p-2 rounded-full border transition-all ${
        saved
          ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
          : 'bg-white border-black/10 text-[#2A2522]/40 hover:border-red-300 hover:text-red-400'
      }`}
      title={saved ? 'ลบออกจาก Wishlist' : 'บันทึกใน Wishlist'}>
      <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
    </button>
  );
}
