import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TopBar } from '@/components/layout/top-bar';
import { formatCurrency } from '@/lib/utils';
import { Users, Star, DollarSign, Award, Mail, Phone, ChevronRight, Search } from 'lucide-react';

const PAGE_SIZE = 50;

export default async function GuestsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; tier?: string }> }) {
  const { q, page: pageStr, tier } = await searchParams;
  const page = Number(pageStr || 0);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user!.id).single();
  const { data: hotels } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) return null;
  const hotelId = hotels[0].id;

  let query = supabase.from('guests').select('*', { count: 'exact' }).eq('hotel_id', hotelId);
  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  if (tier) query = query.eq('loyalty_tier', tier);

  const { data: guests, count } = await query
    .order('total_revenue', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  const { data: stats } = await supabase.from('guests').select('loyalty_tier, vip_status, total_revenue').eq('hotel_id', hotelId);
  const totalGuests = stats?.length || 0;
  const vipCount = stats?.filter(g => g.vip_status).length || 0;
  const totalRevenue = stats?.reduce((s, g) => s + Number(g.total_revenue || 0), 0) || 0;
  const goldCount = stats?.filter(g => ['gold','platinum'].includes(g.loyalty_tier)).length || 0;

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  const TIER_COLORS: Record<string, string> = {
    bronze: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    silver: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
    gold: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    platinum: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  };

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar title="ฐานข้อมูลแขก" description={`${totalGuests.toLocaleString()} แขกในระบบ`} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users, label: 'ทั้งหมด', value: totalGuests.toLocaleString() },
          { icon: Star, label: 'VIP', value: vipCount.toLocaleString() },
          { icon: Award, label: 'Gold+', value: goldCount.toLocaleString() },
          { icon: DollarSign, label: 'รายได้รวม', value: formatCurrency(totalRevenue) },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="font-display text-lg font-medium ticker">{s.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input name="q" defaultValue={q} placeholder="ค้นหาชื่อ, อีเมล, เบอร์..."
              className="w-full pl-9 pr-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </form>
        <div className="flex gap-2">
          {['', 'bronze', 'silver', 'gold', 'platinum'].map(t => (
            <Link key={t} href={`/dashboard/guests${t ? `?tier=${t}` : ''}`}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${tier === t || (!tier && !t) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {t || 'ทั้งหมด'}
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/30">
              <tr>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">แขก</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground hidden md:table-cell">ติดต่อ</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Tier</th>
                <th className="text-right p-4 text-xs font-medium text-muted-foreground">แต้ม</th>
                <th className="text-right p-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">พัก</th>
                <th className="text-right p-4 text-xs font-medium text-muted-foreground">รายได้รวม</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {(guests?.length || 0) === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={Users} title="ไม่พบแขก" description="ลองเปลี่ยนเงื่อนไขการค้นหา" /></td></tr>
              ) : guests!.map(g => (
                <tr key={g.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                        {g.first_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-1.5">
                          {g.first_name} {g.last_name || ''}
                          {g.vip_status && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                        </div>
                        {g.nationality && <div className="text-xs text-muted-foreground">{g.nationality}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {g.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{g.email}</div>}
                      {g.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{g.phone}</div>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-2xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[g.loyalty_tier] || TIER_COLORS.bronze}`}>
                      {g.loyalty_tier}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm ticker">{(g.loyalty_points || 0).toLocaleString()}</td>
                  <td className="p-4 text-right text-muted-foreground hidden sm:table-cell">{g.total_stays || 0}</td>
                  <td className="p-4 text-right font-medium ticker">{formatCurrency(g.total_revenue || 0)}</td>
                  <td className="p-4">
                    <Link href={`/dashboard/guests/${g.id}`} className="flex items-center justify-end gap-1 text-xs text-accent hover:underline">
                      ดู <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              แสดง {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, count || 0)} จาก {count?.toLocaleString()}
            </span>
            <div className="flex gap-2">
              {page > 0 && (
                <Link href={`/dashboard/guests?page=${page - 1}${q ? `&q=${q}` : ''}${tier ? `&tier=${tier}` : ''}`}>
                  <Button variant="outline" size="sm">← ก่อนหน้า</Button>
                </Link>
              )}
              {page < totalPages - 1 && (
                <Link href={`/dashboard/guests?page=${page + 1}${q ? `&q=${q}` : ''}${tier ? `&tier=${tier}` : ''}`}>
                  <Button variant="outline" size="sm">ถัดไป →</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
