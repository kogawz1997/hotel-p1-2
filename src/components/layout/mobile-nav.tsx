'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Calendar, Settings2, Bed } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'หน้าหลัก' },
  { href: '/dashboard/inbox', icon: MessageSquare, label: 'Inbox' },
  { href: '/dashboard/reservations', icon: Calendar, label: 'จอง' },
  { href: '/dashboard/rooms', icon: Bed, label: 'ห้อง' },
  { href: '/dashboard/system', icon: Settings2, label: 'ระบบ' },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-xl safe-area-inset-bottom">
      <div className="flex items-center justify-around py-1 pb-safe">
        {ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 text-2xs rounded-xl transition-colors min-w-[56px]',
                isActive ? 'text-accent' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
