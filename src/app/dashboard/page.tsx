import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BedDouble, CalendarCheck, CircleDollarSign, MessageSquareWarning, Sparkles, UsersRound, Wrench, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

async function countQuery(query: any) {
  const { count } = await query;
  return count || 0;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, full_name, role')
    .eq('id', user.id)
    .single();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, name, currency, check_in_time, check_out_time')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  if (!hotel) {
    return (
      <main className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                <path d="M4 20V4h4l4 8 4-8h4v16h-3V9l-3 6h-4L7 9v11H4z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="font-display text-3xl font-medium tracking-tight mb-2">ยินดีต้อนรับสู่ Maitri</h1>
            <p className="text-sm text-muted-foreground">เริ่มต้นด้วยการตั้งค่าโรงแรมของคุณ ใช้เวลาไม่เกิน 5 นาที</p>
          </div>

          <div className="space-y-3 mb-8">
            {[
              { step: '1', title: 'ตั้งชื่อและข้อมูลโรงแรม', desc: 'เวลาเช็คอิน-เอาท์, VAT, เลขผู้เสียภาษี', href: '/dashboard/settings' },
              { step: '2', title: 'สร้างประเภทห้อง', desc: 'เช่น Deluxe, Suite พร้อมราคาฐาน', href: '/dashboard/rooms' },
              { step: '3', title: 'เพิ่มห้องพัก', desc: 'หมายเลขห้อง ชั้น สถานะ', href: '/dashboard/rooms' },
              { step: '4', title: 'รับการจองแรก', desc: 'จากหน้า Reservations หรือ Booking Engine', href: '/dashboard/reservations' },
            ].map(item => (
              <a key={item.step} href={item.href} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-all group">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium shrink-0 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </a>
            ))}
          </div>

          <div className="text-center">
            <Button asChild>
              <Link href="/dashboard/settings">เริ่มตั้งค่าโรงแรม</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);

  const [roomsTotal, roomsAvailable, roomsOccupied, checkIns, checkOuts, openInbox, hkPending, guestsTotal] = await Promise.all([
    countQuery(supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id)),
    countQuery(supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'available')),
    countQuery(supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'occupied')),
    countQuery(supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('check_in', today).in('status', ['confirmed', 'pending'])),
    countQuery(supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('check_out', today).eq('status', 'checked_in')),
    countQuery(supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'open')),
    countQuery(supabase.from('housekeeping_tasks').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).in('status', ['pending', 'in_progress'])),
    countQuery(supabase.from('guests').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id)),
  ]);

  const { data: revenueRows } = await supabase
    .from('payments')
    .select('amount')
    .eq('hotel_id', hotel.id)
    .eq('status', 'completed')
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${tomorrow}T00:00:00.000Z`);
  const revenueToday = (revenueRows || []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const occupancyRate = roomsTotal ? Math.round((roomsOccupied / roomsTotal) * 100) : 0;

  const { data: arrivals } = await supabase
    .from('reservations')
    .select('reservation_code, check_in, check_out, status, guests(first_name,last_name), room_types(name)')
    .eq('hotel_id', hotel.id)
    .eq('check_in', today)
    .order('created_at', { ascending: false })
    .limit(6);

  const stats = [
    { label: 'Occupancy', value: `${occupancyRate}%`, sub: `${roomsOccupied}/${roomsTotal} ห้อง`, icon: BedDouble, href: '/dashboard/rooms' },
    { label: 'Check-in วันนี้', value: checkIns, sub: formatDate(today), icon: CalendarCheck, href: '/dashboard/reservations' },
    { label: 'รายได้วันนี้', value: formatCurrency(revenueToday, hotel.currency || 'THB'), sub: 'เฉพาะ payment completed', icon: CircleDollarSign, href: '/dashboard/accounting' },
    { label: 'Inbox เปิดอยู่', value: openInbox, sub: 'ต้องตอบลูกค้า', icon: MessageSquareWarning, href: '/dashboard/inbox' },
  ];

  return (
    <main className="space-y-6 p-6 md:p-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="accent">Maitri PMS</Badge>
            <Badge variant="outline">{profile?.role || 'staff'}</Badge>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{hotel.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">ภาพรวมงานวันนี้ เช็คอิน {hotel.check_in_time?.slice(0, 5)} · เช็คเอาต์ {hotel.check_out_time?.slice(0, 5)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href="/dashboard/reservations">เปิดรายการจอง</Link></Button>
          <Button asChild><Link href="/dashboard/inbox">ตอบลูกค้า</Link></Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Link key={item.label} href={item.href} className="group">
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <div className="rounded-xl border bg-muted/50 p-2 transition group-hover:bg-accent/10"><item.icon className="h-5 w-5" /></div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Arrivals วันนี้</CardTitle>
            <CardDescription>รายชื่อที่ควรเตรียมต้อนรับ ไม่ใช่รอให้แขกยืนงงหน้าเคาน์เตอร์เหมือน NPC</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(arrivals || []).length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">ยังไม่มี check-in วันนี้</div>
              ) : arrivals?.map((item: any) => (
                <div key={item.reservation_code} className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{item.guests?.first_name} {item.guests?.last_name || ''}</p>
                    <p className="text-sm text-muted-foreground">{item.reservation_code} · {item.room_types?.name || 'Room type'} · {item.check_in} → {item.check_out}</p>
                  </div>
                  <Badge variant={item.status === 'confirmed' ? 'success' : 'warning'}>{item.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>งานที่ต้องจับตา</CardTitle>
            <CardDescription>จุดเสี่ยงประจำวัน</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/housekeeping" className="flex items-center justify-between rounded-xl border p-4 transition hover:bg-muted/50">
              <span className="flex items-center gap-3"><Wrench className="h-5 w-5" /> Housekeeping pending</span>
              <Badge variant={hkPending ? 'warning' : 'success'}>{hkPending}</Badge>
            </Link>
            <Link href="/dashboard/guests" className="flex items-center justify-between rounded-xl border p-4 transition hover:bg-muted/50">
              <span className="flex items-center gap-3"><UsersRound className="h-5 w-5" /> Guest database</span>
              <Badge variant="outline">{guestsTotal}</Badge>
            </Link>
            <Link href="/dashboard/marketing" className="flex items-center justify-between rounded-xl border p-4 transition hover:bg-muted/50">
              <span className="flex items-center gap-3"><Sparkles className="h-5 w-5" /> AI/Marketing readiness</span>
              <Badge variant="info">เตรียมใช้งาน</Badge>
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
