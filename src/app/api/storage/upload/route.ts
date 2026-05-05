import { createAdminClient } from '@/lib/supabase/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { hotelId } = await request.json();
    const ctx = await requireHotelAccess(hotelId, ['owner', 'admin', 'manager']);
    if (ctx.error) return ctx.error;

    const admin = createAdminClient();
    
    // Check if bucket exists, create if not
    const { data: buckets } = await admin.storage.listBuckets();
    const hasHotelAssets = buckets?.some((b: any) => b.name === 'hotel-assets');
    
    if (!hasHotelAssets) {
      await admin.storage.createBucket('hotel-assets', {
        public: true,
        fileSizeLimit: 52428800,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      });
    }

    return NextResponse.json({ success: true, bucket: 'hotel-assets' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
