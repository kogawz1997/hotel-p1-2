import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/layout/top-bar';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Award, Star, Crown, Users, TrendingUp, Gift, ChevronRight, Settings } from 'lucide-react';

const DEFAULT_TIERS = [
  { name: 'Bronze', min_points: 0, multiplier: 1.0, color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300', icon: Award, benefits: ['Welcome drink', 'Late check-out 1 ชม.'] },
  { name: 'Silver', min_points: 5000, multiplier: 1.5, color: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300', icon: Star, benefits: ['ส่วนลด 10%', 'Free breakfast', 'Late check-out 2 ชม.'] },
  { name: 'Gold', min_points: 20000, multiplier: 2.0, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', icon: Crown, benefits: ['ส่วนลด 15%', 'Room upgrade', 'Free spa 1 ครั้ง'] },
];

export default async function LoyaltyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user!.id).single();
  const { data: hotels } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) return null;
  const hotelId = hotels[0].id;

  const [{ data: topGuests }, { data: recentTx }, { data: allGuests }] = await Promise.all([
    supabase.from('guests').select('id, first_name, last_name, loyalty_points, loyalty_tier, total_stays, vip_status').eq('hotel_id', hotelId).order('loyalty_points', { ascending: false }).limit(10),
    supabase.from('loyalty_transactions').select('*, guests(first_name, last_name)').eq('hotel_id', hotelId).order('created_at', { ascending: false }).limit(15),
    supabase.from('guests').select('loyalty_tier, loyalty_points').eq('hotel_id', hotelId),
  ]);

  const tierCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  const totalPoints = allGuests?.reduce((s, g) => { tierCounts[g.loyalty_tier as keyof typeof tierCounts] = (tierCounts[g.loyalty_tier as keyof typeof tierCounts] || 0) + 1; return s + (g.loyalty_points || 0); }, 0) || 0;

  const TIER_COLORS: Record<string, string> = {
    bronze: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    silver: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
    gold: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    platinum: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  };

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar title="Loyalty Program" description="โปรแกรมสะสมแต้มและสมาชิก" />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="สมาชิกทั้งหมด" value={(allGuests?.length || 0).toLocaleString()} />
        <StatCard icon={Star} label="สมาชิก Gold+" value={(tierCounts.gold + tierCounts.platinum).toLocaleString()} />
        <StatCard icon={TrendingUp} label="แต้มรวมทั้งระบบ" value={totalPoints.toLocaleString()} unit="pts" />
        <StatCard icon={Gift} label="Silver+" value={(tierCounts.silver + tierCounts.gold + tierCounts.platinum).toLocaleString()} />
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {DEFAULT_TIERS.map(tier => {
          const Icon = tier.icon;
          const count = tierCounts[tier.name.toLowerCase() as keyof typeof tierCounts] || 0;
          return (
            <Card key={tier.name} className="overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-accent/30 to-accent" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tier.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-medium">{count}</div>
                    <div className="text-xs text-muted-foreground">สมาชิก</div>
                  </div>
                </div>
                <div className="font-medium mb-1">{tier.name}</div>
                <div className="text-xs text-muted-foreground mb-3">≥ {tier.min_points.toLocaleString()} แต้ม · {tier.multiplier}x multiplier</div>
                <ul className="space-y-1">
                  {tier.benefits.map(b => (
                    <li key={b} className="text-xs flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-accent shrink-0" />{b}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top members */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Top สมาชิก</CardTitle>
            <Link href="/dashboard/guests?tier=gold" className="text-xs text-accent hover:underline">ดูทั้งหมด</Link>
          </CardHeader>
          <CardContent className="p-0">
            {(topGuests?.length || 0) === 0 ? (
              <EmptyState icon={Award} title="ยังไม่มีสมาชิก" description="เริ่มสะสมแต้มเมื่อแขก check-in" />
            ) : (
              <div className="divide-y divide-border">
                {topGuests!.map((g, i) => (
                  <Link key={g.id} href={`/dashboard/guests/${g.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{g.first_name} {g.last_name || ''}</span>
                        {g.vip_status && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{g.total_stays} ครั้ง</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium ticker">{(g.loyalty_points || 0).toLocaleString()}</div>
                      <span className={`text-2xs px-1.5 py-0.5 rounded-full font-medium ${TIER_COLORS[g.loyalty_tier] || TIER_COLORS.bronze}`}>
                        {g.loyalty_tier}
                      </span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader><CardTitle className="text-sm">ประวัติแต้มล่าสุด</CardTitle></CardHeader>
          <CardContent className="p-0">
            {(recentTx?.length || 0) === 0 ? (
              <EmptyState icon={TrendingUp} title="ยังไม่มีประวัติ" description="แต้มจะถูกบันทึกเมื่อมีการทำรายการ" />
            ) : (
              <div className="divide-y divide-border">
                {recentTx!.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${tx.points > 0 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-950 text-red-700'}`}>
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{(tx.guests as any)?.first_name} {(tx.guests as any)?.last_name || ''}</div>
                      <div className="text-xs text-muted-foreground truncate">{tx.description}</div>
                    </div>
                    <div className={`text-sm font-medium shrink-0 ticker ${tx.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, unit }: any) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-display text-lg font-medium ticker">{value}{unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}</div>
        </div>
      </CardContent>
    </Card>
  );
}
