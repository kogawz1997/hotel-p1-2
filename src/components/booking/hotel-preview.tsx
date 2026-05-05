'use client';

import { MapPin, Phone, Mail, Star, ArrowRight, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export function HotelPreview({ hotel, gallery }: { hotel: any; gallery: any[] }) {
  const avgRating = 4.7; // mock

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <nav className="sticky top-0 z-40 border-b border-border/50 bg-white/95 backdrop-blur-sm">
        <div className="container max-w-6xl flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            {hotel.logo_url && <img src={hotel.logo_url} alt="logo" className="h-8" />}
            <div>
              <div className="font-medium text-sm">{hotel.name}</div>
              {hotel.tagline && <div className="text-2xs text-muted-foreground">{hotel.tagline}</div>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="tel:" className="flex items-center gap-1 text-sm hover:text-accent"><Phone className="h-4 w-4" /> Contact</a>
            <Button size="sm">Book Now</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-96 w-full overflow-hidden">
        <img
          src={hotel.hero_image_url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600'}
          alt="hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
          <h1 className="text-5xl font-bold mb-2">{hotel.name}</h1>
          {hotel.tagline && <p className="text-xl">{hotel.tagline}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl py-12">
        {/* About */}
        {hotel.description && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-4">เกี่ยวกับเรา</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {hotel.description}
            </p>
          </section>
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">แกลเลอรี</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gallery.slice(0, 6).map((img, i) => (
                <div
                  key={img.id}
                  className={`relative overflow-hidden rounded-lg h-64 group cursor-pointer ${
                    i === 0 ? 'lg:col-span-2 lg:row-span-2 lg:h-auto' : ''
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {i === 0 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  )}
                </div>
              ))}
            </div>
            {gallery.length > 6 && (
              <div className="text-center mt-6">
                <Button variant="outline" size="lg">
                  ดูรูปทั้งหมด ({gallery.length}) <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Info Cards */}
        <section className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">ติดต่อเรา</h3>
            <div className="space-y-3">
              {hotel.phone && (
                <a href={`tel:${hotel.phone}`} className="flex items-center gap-3 hover:text-accent">
                  <Phone className="h-5 w-5 text-accent" />
                  <span>{hotel.phone}</span>
                </a>
              )}
              {hotel.email && (
                <a href={`mailto:${hotel.email}`} className="flex items-center gap-3 hover:text-accent">
                  <Mail className="h-5 w-5 text-accent" />
                  <span>{hotel.email}</span>
                </a>
              )}
              {hotel.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent mt-0.5" />
                  <span>{hotel.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold">ข้อมูลเข้าพัก</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-lg">
                <div className="text-sm text-muted-foreground">ห้องทั้งหมด</div>
                <div className="text-2xl font-bold">{hotel.total_rooms || '—'}</div>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <div className="text-sm text-muted-foreground">คะแนน</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                  {avgRating}
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                </div>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <div className="text-sm text-muted-foreground">ราคาเริ่ม</div>
                <div className="text-2xl font-bold">{formatCurrency(hotel.base_rate || 0)}</div>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <div className="text-sm text-muted-foreground">ประเภทห้อง</div>
                <div className="text-2xl font-bold">{hotel.room_type_count || '—'}</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">พร้อมที่จะเข้าพัก?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            ระบุวันที่และเลือกห้องของคุณ ทำการจองให้เสร็จในเพียงไม่กี่คลิก
          </p>
          <Link href={`/booking/${hotel.id}`}>
            <Button size="lg" className="rounded-full px-8">
              <Calendar className="h-5 w-5" /> เริ่มจองเลย
            </Button>
          </Link>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8 bg-secondary/30">
        <div className="container max-w-6xl text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {hotel.name}. สงวนสิทธิ์.</p>
        </div>
      </footer>
    </div>
  );
}
