import { Card, CardContent } from '@/components/ui/card';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, Calendar, Users, ArrowRight } from 'lucide-react';

export default async function SpaPage() {
  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="Spa & Wellness" description="บริการสปาและทรีตเมนต์" />

      <Card className="border-accent/30">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
              <Heart className="h-8 w-8 text-accent" />
            </div>
            <div className="flex-1">
              <span className="text-2xs uppercase tracking-widest text-accent">Phase 2 · Coming Q3 2026</span>
              <h2 className="font-display text-2xl font-medium tracking-tight mt-2 mb-3">
                Spa Booking System
              </h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                จัดการบริการสปา หมอนวด ตารางการจอง และ commission tracking
                Schema พร้อมแล้วใน database — UI กำลังพัฒนาเฟส 2
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <Feature icon={Sparkles} label="Services" />
                <Feature icon={Calendar} label="Booking" />
                <Feature icon={Users} label="Therapists" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Feature({ icon: Icon, label }: any) {
  return (
    <div className="p-3 border border-border rounded-lg flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
