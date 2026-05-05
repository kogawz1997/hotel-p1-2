import { createAdminClient } from '@/lib/supabase/server';
import { BookingEngine } from '@/components/booking/booking-engine';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ hotel: string }> }): Promise<Metadata> {
  const { hotel: slug } = await params;
  const supabase = createAdminClient();
  const { data: hotel } = await supabase.from('hotels').select('name,description,hero_image_url,city').eq('slug', slug).single();
  if (!hotel) return {};
  return {
    title: `จองห้องพัก — ${hotel.name}`,
    description: hotel.description || `จองห้องพักที่ ${hotel.name} ราคาดีที่สุด`,
    openGraph: {
      title: `จองห้องพัก — ${hotel.name}`,
      description: hotel.description || `จองห้องพักที่ ${hotel.name}`,
      images: hotel.hero_image_url ? [hotel.hero_image_url] : [],
    },
  };
}

export default async function BookingPage({ params }: { params: Promise<{ hotel: string }> }) {
  const { hotel: slug } = await params;
  const supabase = createAdminClient();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('*, hotel_gallery(id, image_url, alt_text, display_order)')
    .eq('slug', slug)
    .single();
  if (!hotel) notFound();

  // Sort gallery
  if (hotel.hotel_gallery) {
    hotel.hotel_gallery.sort((a: any, b: any) => a.display_order - b.display_order);
  }

  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('*, room_type_images(image_url, display_order)')
    .eq('hotel_id', hotel.id)
    .order('base_rate');

  return <BookingEngine hotel={hotel} roomTypes={roomTypes || []} />;
}
