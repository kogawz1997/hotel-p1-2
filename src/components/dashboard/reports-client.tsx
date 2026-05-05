'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/layout/top-bar';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { th } from 'date-fns/locale';
import { TrendingUp, TrendingDown, DollarSign, Bed, Activity, Download } from 'lucide-react';
import { toast } from 'sonner';

const CHART_COLORS = ['#C66A30', '#7A8471', '#B8956A', '#2A2522', '#A4522A', '#854329'];

const PERIODS = [
  { label: '7 วัน', days: 7, custom: null },
  { label: '30 วัน', days: 30, custom: null },
  { label: '90 วัน', days: 90, custom: null },
  { label: 'เดือนนี้', days: 0, custom: 'month' },
  { label: 'เดือนที่แล้ว', days: 0, custom: 'lastmonth' },
];

export function ReportsClient({ hotelId }: { hotelId: string }) {
  const supabase = createClient();
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [channelMix, setChannelMix] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ adr: 0, revpar: 0, occupancy: 0, totalRevenue: 0 });
  const [period, setPeriod] = useState(30);
  const [customPeriod, setCustomPeriod] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getDateRange = useCallback(() => {
    const today = new Date();
    if (customPeriod === 'month') return { start: startOfMonth(today), end: today };
    if (customPeriod === 'lastmonth') {
      const lm = subMonths(today, 1);
      return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
    return { start: subDays(today, period), end: today };
  }, [period, customPeriod]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { start, end } = getDateRange();
      const days = eachDayOfInterval({ start, end });

      const { data: resvs } = await supabase
        .from('reservations')
        .select('check_in, check_out, total_amount, source, nights, status, num_adults')
        .eq('hotel_id', hotelId)
        .gte('check_in', format(start, 'yyyy-MM-dd'))
        .lte('check_in', format(end, 'yyyy-MM-dd'))
        .neq('status', 'cancelled');

      const { data: rooms } = await supabase.from('rooms').select('id').eq('hotel_id', hotelId);
      const totalRooms = rooms?.length || 1;

      const dailyData = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const occupied = resvs?.filter(r => r.check_in <= dayStr && r.check_out > dayStr) || [];
        const revenue = occupied.reduce((s, r) => s + (Number(r.total_amount) / (r.nights || 1)), 0);
        const occ = (occupied.length / totalRooms) * 100;
        const dateFmt = days.length > 60 ? 'MMM' : 'd MMM';
        return {
          date: format(day, dateFmt, { locale: th }),
          revenue: Math.round(revenue),
          occupancy: Math.round(occ),
          rooms: occupied.length,
        };
      });

      setRevenueData(dailyData);

      const channelData: Record<string, number> = {};
      resvs?.forEach(r => {
        const src = r.source || 'direct';
        channelData[src] = (channelData[src] || 0) + Number(r.total_amount);
      });
      setChannelMix(Object.entries(channelData).map(([name, value]) => ({ name, value })));

      const totalRevenue = resvs?.reduce((s, r) => s + Number(r.total_amount), 0) || 0;
      const checkedIn = resvs?.filter(r => ['confirmed','checked_in','checked_out'].includes(r.status)) || [];
      const avgOcc = dailyData.length > 0 ? dailyData.reduce((s, d) => s + d.occupancy, 0) / dailyData.length : 0;
      const totalNights = checkedIn.reduce((s, r) => s + (r.nights || 1), 0);
      const adr = totalNights > 0 ? totalRevenue / totalNights : 0;
      const revpar = adr * (avgOcc / 100);

      setKpis({ adr: Math.round(adr), revpar: Math.round(revpar), occupancy: Math.round(avgOcc), totalRevenue: Math.round(totalRevenue) });
      setLoading(false);
    }
    load();
  }, [hotelId, period, customPeriod, getDateRange]);

  function exportCSV() {
    if (revenueData.length === 0) { toast.error('ไม่มีข้อมูลให้ export'); return; }
    const headers = ['วันที่', 'รายได้ (บาท)', 'Occupancy (%)', 'ห้องที่ขาย'];
    const rows = revenueData.map(d => [d.date, d.revenue, d.occupancy, d.rooms]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maitri-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV เรียบร้อย');
  }

  function exportReservations() {
    const { start, end } = getDateRange();
    const url = `/api/reports/export?hotelId=${hotelId}&start=${format(start,'yyyy-MM-dd')}&end=${format(end,'yyyy-MM-dd')}`;
    window.open(url, '_blank');
  }

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar
        title="รายงาน"
        description="สถิติรายได้ Occupancy และ RevPAR"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5" /> Revenue CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportReservations}>
              <Download className="h-3.5 w-3.5" /> Reservations CSV
            </Button>
          </div>
        }
      />

      {/* Period selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {PERIODS.map(p => {
          const isActive = p.custom ? customPeriod === p.custom : (!customPeriod && period === p.days);
          return (
            <button
              key={p.label}
              onClick={() => {
                if (p.custom) { setCustomPeriod(p.custom); }
                else { setCustomPeriod(null); setPeriod(p.days); }
              }}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KPICard label="รายได้รวม" value={formatCurrency(kpis.totalRevenue)} icon={DollarSign} />
        <KPICard label="ADR" sublabel="ราคาห้องเฉลี่ย/คืน" value={formatCurrency(kpis.adr)} icon={Activity} />
        <KPICard label="RevPAR" sublabel="รายได้ต่อห้องทั้งหมด" value={formatCurrency(kpis.revpar)} icon={TrendingUp} />
        <KPICard label="Occupancy" sublabel="เฉลี่ยช่วงที่เลือก" value={`${kpis.occupancy}%`} icon={Bed} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>รายได้รายวัน</CardTitle>
            <CardDescription>Revenue trend ในช่วงที่เลือก</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C66A30" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#C66A30" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: any) => formatCurrency(v)}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#C66A30" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Occupancy รายวัน</CardTitle>
            <CardDescription>เปอร์เซ็นต์การเข้าพัก</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  formatter={(v: any) => `${v.toFixed(0)}%`}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Bar dataKey="occupancy" fill="#7A8471" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>สัดส่วนช่องทาง</CardTitle>
          <CardDescription>รายได้แบ่งตามแหล่งที่มา</CardDescription>
        </CardHeader>
        <CardContent>
          {channelMix.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={channelMix} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {channelMix.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => formatCurrency(v)}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center">
                {channelMix.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span>{c.name}</span>
                    <span className="text-muted-foreground">({formatCurrency(c.value)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ label, sublabel, value, icon: Icon }: any) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            {sublabel && <div className="text-2xs text-muted-foreground/60">{sublabel}</div>}
          </div>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="font-display text-2xl font-medium ticker tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
