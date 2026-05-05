import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { TopBar } from '@/components/layout/top-bar';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, FileText, Globe2, Building2, ArrowRight, AlertCircle } from 'lucide-react';

export default async function AccountingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles').select('organization_id').eq('id', user!.id).single();
  const { data: hotels } = await supabase
    .from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) return null;

  const monthStart = new Date().toISOString().slice(0, 7) + '-01';

  const [{ data: invoices }, { data: tm30 }, { data: payments }] = await Promise.all([
    supabase.from('invoices').select('*').eq('hotel_id', hotels[0].id).order('issue_date', { ascending: false }).limit(20),
    supabase.from('tm30_reports').select('*').eq('hotel_id', hotels[0].id).order('created_at', { ascending: false }).limit(10),
    supabase.from('payments').select('amount, status, created_at').eq('hotel_id', hotels[0].id).gte('created_at', monthStart),
  ]);

  const monthlyRevenue = payments?.filter((p: any) => p.status === 'completed').reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
  const monthlyVAT = monthlyRevenue * 0.07 / 1.07;
  const pendingTM30 = tm30?.filter((t: any) => t.status === 'pending').length || 0;

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar title="บัญชีและภาษี" description="ใบกำกับ ภาษี ทร.30 และเชื่อมโปรแกรมบัญชี" />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Receipt className="h-3.5 w-3.5" /> รายได้เดือนนี้
          </div>
          <div className="font-display text-2xl font-medium ticker">{formatCurrency(monthlyRevenue)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <FileText className="h-3.5 w-3.5" /> ภาษีมูลค่าเพิ่ม
          </div>
          <div className="font-display text-2xl font-medium ticker">{formatCurrency(monthlyVAT)}</div>
          <div className="text-2xs text-muted-foreground mt-1">7% รวมในยอด</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Globe2 className="h-3.5 w-3.5" /> ทร.30 รอแจ้ง
          </div>
          <div className="font-display text-2xl font-medium ticker flex items-center gap-2">
            {pendingTM30}
            {pendingTM30 > 0 && <AlertCircle className="h-4 w-4 text-amber-500" />}
          </div>
        </CardContent></Card>
      </div>

      {/* Invoices */}
      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>ใบกำกับภาษี / ใบเสร็จ</CardTitle>
            <CardDescription>เอกสารทางการเงินทั้งหมด</CardDescription>
          </div>
          <Button size="sm">ออกใบใหม่</Button>
        </CardHeader>
        <CardContent className="p-0">
          {(invoices?.length || 0) === 0 ? (
            <EmptyState icon={Receipt} title="ยังไม่มีใบกำกับภาษี" description="ใบกำกับจะถูกสร้างอัตโนมัติเมื่อมีการชำระเงิน" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/30">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">เลขที่</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">วันที่</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ลูกค้า</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ยอดรวม</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">e-Tax</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">สถานะ</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {invoices?.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(inv.issue_date)}</td>
                      <td className="px-4 py-3">{inv.buyer_name || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3 font-medium ticker">{formatCurrency(inv.total_amount)}</td>
                      <td className="px-4 py-3">
                        {inv.is_etax ? (
                          <Badge variant="success" className="text-2xs">{inv.etax_status}</Badge>
                        ) : (
                          <span className="text-2xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="text-2xs">{inv.status}</Badge></td>
                      <td className="px-4 py-3">
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline"
                        >
                          ดู PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>ทร.30 (รายงานชาวต่างชาติ)</CardTitle>
            <CardDescription>ส่งให้ตรวจคนเข้าเมืองภายใน 24 ชม.</CardDescription>
          </CardHeader>
          <CardContent>
            {(tm30?.length || 0) === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">ยังไม่มีรายงาน</p>
            ) : (
              <div className="space-y-2">
                {tm30?.map((r: any) => (
                  <div key={r.id} className="flex justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                    <div className="text-sm">
                      <div className="font-medium font-mono text-xs">{r.passport_number}</div>
                      <div className="text-2xs text-muted-foreground mt-0.5">
                        {r.nationality} · มา {formatDate(r.arrival_date)}
                      </div>
                    </div>
                    <Badge variant={r.status === 'submitted' ? 'success' : 'warning'} className="text-2xs">
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>เชื่อมต่อโปรแกรมบัญชี</CardTitle>
            <CardDescription>ส่งข้อมูลไปบัญชีอัตโนมัติ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'PEAK', logo: '📊', status: 'ติดต่อ support' },
                { name: 'FlowAccount', logo: '💰', status: 'มี API' },
                { name: 'Express', logo: '📋', status: 'ส่งออก CSV' },
                { name: 'Xero', logo: '🌐', status: 'มี API' },
              ].map(p => (
                <button key={p.name} className="p-4 border border-border rounded-xl hover:border-accent transition-colors text-left">
                  <div className="text-2xl mb-1">{p.logo}</div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-2xs text-muted-foreground mt-0.5">{p.status}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
