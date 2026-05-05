'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Calendar, MessageSquare, Users, Bed,
  Sparkles, BarChart3, Receipt, Globe2, UtensilsCrossed,
  Heart, Award, Megaphone, Settings, LogOut, ChevronDown,
  Building2, Search, Shield, Settings2, Palette, CalendarRange,
  Wrench, CreditCard, QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { hasMinimumRole, normalizeRole, type AppRole } from '@/lib/auth/roles';

interface SidebarProps {
  hotelName: string;
  hotelId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

const NAV_GROUPS = [
  {
    label: 'ภาพรวม',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
      { href: '/dashboard/inbox', icon: MessageSquare, label: 'Inbox', showUnread: true },
    ],
  },
  {
    label: 'การดำเนินงาน',
    items: [
      { href: '/dashboard/reservations', icon: Calendar, label: 'การจอง' },
      { href: '/dashboard/rooms', icon: Bed, label: 'ห้อง' },
      { href: '/dashboard/rates', icon: CalendarRange, label: 'ปฏิทินราคา' },
      { href: '/dashboard/guests', icon: Users, label: 'แขก' },
      { href: '/dashboard/housekeeping', icon: Sparkles, label: 'แม่บ้าน' },
      { href: '/dashboard/maintenance', icon: Wrench, label: 'ซ่อมบำรุง' },
      { href: '/dashboard/checkin', icon: QrCode, label: 'QR Check-in' },
    ],
  },
  {
    label: 'การจัดจำหน่าย',
    items: [
      { href: '/dashboard/channels', icon: Globe2, label: 'Channel Manager' },
      { href: '/dashboard/marketing', icon: Megaphone, label: 'Marketing' },
    ],
  },
  {
    label: 'การเงิน',
    items: [
      { href: '/dashboard/accounting', icon: Receipt, label: 'บัญชี & ภาษี', minRole: 'admin' as AppRole },
      { href: '/dashboard/reports', icon: BarChart3, label: 'รายงาน', minRole: 'manager' as AppRole },
      { href: '/dashboard/audit', icon: Shield, label: 'Audit Log', minRole: 'admin' as AppRole },
      { href: '/dashboard/system', icon: Settings2, label: 'ระบบ & Integrations', minRole: 'admin' as AppRole },
      { href: '/dashboard/billing', icon: CreditCard, label: 'Billing', minRole: 'hotel_owner' as AppRole },
    ],
  },
  {
    label: 'ส่วนเสริม',
    items: [
      { href: '/dashboard/fb', icon: UtensilsCrossed, label: 'F&B' },
      { href: '/dashboard/spa', icon: Heart, label: 'Spa' },
      { href: '/dashboard/loyalty', icon: Award, label: 'Loyalty' },
    ],
  },
  {
    label: 'ตั้งค่า',
    items: [
      { href: '/dashboard/branding', icon: Palette, label: 'Branding & Gallery' },
      { href: '/dashboard/settings', icon: Settings, label: 'ตั้งค่าทั่วไป', minRole: 'admin' as AppRole },
    ],
  },
];

export function Sidebar({ hotelName, hotelId, userName, userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();
  const normalizedRole = normalizeRole(userRole);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!hotelId) return;

    async function loadUnread() {
      const { count } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('hotel_id', hotelId!)
        .gt('unread_count', 0)
        .eq('status', 'open');
      setUnreadCount(count || 0);
    }

    loadUnread();

    const channel = supabase
      .channel(`sidebar-unread-${hotelId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'conversations',
        filter: `hotel_id=eq.${hotelId}`,
      }, loadUnread)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hotelId]);

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path d="M4 20V4h4l4 8 4-8h4v16h-3V9l-3 6h-4L7 9v11H4z" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-display text-lg font-medium tracking-tight">Maitri</span>
        </Link>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg hover:bg-secondary transition-colors group">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium truncate flex-1">{hotelName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="p-3">
        <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-md hover:bg-secondary transition-colors">
          <Search className="h-3 w-3" />
          <span className="flex-1 text-left">ค้นหา...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-secondary rounded">⌘K</kbd>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-3 mb-1 text-2xs uppercase tracking-widest text-muted-foreground/70 font-medium">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.filter((item: any) => !item.minRole || hasMinimumRole(normalizedRole, item.minRole)).map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const showBadge = (item as any).showUnread && unreadCount > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors group',
                      isActive
                        ? 'bg-secondary text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-accent')} />
                    <span className="flex-1">{item.label}</span>
                    {showBadge && (
                      <span className="text-2xs px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-medium min-w-[1.25rem] text-center tabular-nums">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors',
            pathname.startsWith('/dashboard/settings') && 'bg-secondary'
          )}
        >
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
            {(userName || userEmail || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{userName || userEmail}</div>
            <div className="text-2xs text-muted-foreground truncate">{userRole || 'staff'}</div>
          </div>
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
        <form action="/api/auth/logout" method="post" className="mt-1">
          <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <LogOut className="h-3.5 w-3.5" />
            ออกจากระบบ
          </button>
        </form>
      </div>
    </aside>
  );
}
