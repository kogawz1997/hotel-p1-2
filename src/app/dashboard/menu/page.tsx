import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { TopBar } from '@/components/layout/top-bar';
import {
  Bed, Sparkles, Globe2, Receipt, BarChart3, UtensilsCrossed,
  Heart, Award, Megaphone, Settings, ChevronRight,
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'การดำเนินงาน',
    items: [
      { href: '/dashboard/rooms', icon: Bed, label: 'ห้อง' },
      { href: '/dashboard/housekeeping', icon: Sparkles, label: 'แม่บ้าน' },
    ],
  },
  {
    title: 'การจัดจำหน่าย',
    items: [
      { href: '/dashboard/channels', icon: Globe2, label: 'Channel Manager' },
      { href: '/dashboard/marketing', icon: Megaphone, label: 'Marketing' },
    ],
  },
  {
    title: 'การเงิน',
    items: [
      { href: '/dashboard/accounting', icon: Receipt, label: 'บัญชี & ภาษี' },
      { href: '/dashboard/reports', icon: BarChart3, label: 'รายงาน' },
    ],
  },
  {
    title: 'ส่วนเสริม',
    items: [
      { href: '/dashboard/fb', icon: UtensilsCrossed, label: 'F&B' },
      { href: '/dashboard/spa', icon: Heart, label: 'Spa' },
      { href: '/dashboard/loyalty', icon: Award, label: 'Loyalty' },
    ],
  },
  {
    title: 'ตั้งค่า',
    items: [
      { href: '/dashboard/settings', icon: Settings, label: 'ตั้งค่าโรงแรม' },
    ],
  },
];

export default function MenuPage() {
  return (
    <div className="container py-6 animate-fade-in">
      <TopBar title="เมนู" description="ฟีเจอร์ทั้งหมด" />
      <div className="space-y-6">
        {SECTIONS.map(section => (
          <div key={section.title}>
            <p className="text-2xs uppercase tracking-widest text-muted-foreground mb-2 px-1">
              {section.title}
            </p>
            <Card>
              {section.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors ${
                      i !== section.items.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 font-medium text-sm">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
