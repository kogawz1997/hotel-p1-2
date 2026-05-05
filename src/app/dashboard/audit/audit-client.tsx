'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TopBar } from '@/components/layout/top-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Shield, Search, X, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const ACTION_META: Record<string, { label: string; color: string }> = {
  'reservation.created':   { label: 'สร้างการจอง',     color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' },
  'reservation.check_in':  { label: 'Check-in',         color: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' },
  'reservation.check_out': { label: 'Check-out',         color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' },
  'reservation.cancel':    { label: 'ยกเลิกการจอง',     color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' },
  'reservation.updated':   { label: 'แก้ไขการจอง',      color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' },
  'payment.created':       { label: 'รับชำระเงิน',       color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' },
  'payment.webhook.completed': { label: 'Payment Completed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' },
  'organization.created':  { label: 'สร้าง Organization', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200' },
  'team.invited':          { label: 'เชิญพนักงาน',       color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200' },
  'team.updated':          { label: 'อัพเดตทีม',          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200' },
};

const PAGE_SIZE = 25;

export function AuditClient({ hotelId }: { hotelId: string }) {
  const supabase = createClient();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('audit_logs')
      .select('*, user_profiles(full_name, email)', { count: 'exact' })
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterAction) query = query.eq('action', filterAction);

    const { data, count, error } = await query;
    if (!error) {
      setLogs(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [hotelId, page, filterAction]);

  useEffect(() => { load(); }, [load]);

  // Search is client-side on current page
  const filtered = search
    ? logs.filter(l =>
        l.action?.includes(search.toLowerCase()) ||
        l.user_profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.user_profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.entity_type?.includes(search.toLowerCase())
      )
    : logs;

  const uniqueActions = Array.from(new Set(Object.keys(ACTION_META)));

  return (
    <div className="container max-w-6xl py-8 animate-fade-in">
      <TopBar
        title="Audit Log"
        description={`${total.toLocaleString()} รายการทั้งหมด`}
        action={
          <Badge variant="outline" className="flex items-center gap-1.5">
            <Shield className="h-3 w-3" /> เฉพาะ Owner / Admin
          </Badge>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา action, ผู้ใช้..."
            className="w-full pl-9 pr-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={filterAction}
          onChange={e => { setFilterAction(e.target.value); setPage(0); }}
          className="px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">ทุก action</option>
          {uniqueActions.map(a => (
            <option key={a} value={a}>{ACTION_META[a]?.label || a}</option>
          ))}
        </select>
        {(search || filterAction) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterAction(''); setPage(0); }}>
            <X className="h-3.5 w-3.5" /> ล้าง
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/30">
              <tr>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground w-44">เวลา</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Action</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">ผู้กระทำ</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Entity</th>
                <th className="w-10 p-4" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-24 rounded-full" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-4" />
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState icon={Shield} title="ไม่พบ log" description="ลองเปลี่ยนเงื่อนไขการค้นหา" />
                  </td>
                </tr>
              ) : (
                filtered.map(log => {
                  const meta = ACTION_META[log.action];
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => setSelected(log)}
                    >
                      <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                        {format(parseISO(log.created_at), 'd MMM yy · HH:mm:ss', { locale: th })}
                      </td>
                      <td className="p-4">
                        <span className={cn('text-2xs px-2 py-0.5 rounded-full font-medium', meta?.color || 'bg-secondary text-muted-foreground')}>
                          {meta?.label || log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium">{log.user_profiles?.full_name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{log.user_profiles?.email || 'system'}</div>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        <span className="font-mono">{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="text-muted-foreground/60 ml-1 truncate hidden md:inline">
                            · {log.entity_id.slice(0, 8)}…
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <button className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              แสดง {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} จาก {total.toLocaleString()}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className={cn('text-2xs px-2 py-0.5 rounded-full font-medium', ACTION_META[selected?.action]?.color || 'bg-secondary')}>
                {ACTION_META[selected?.action]?.label || selected?.action}
              </span>
            </DialogTitle>
            <DialogDescription>
              {selected && format(parseISO(selected.created_at), 'd MMMM yyyy · HH:mm:ss', { locale: th })}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Row label="ผู้กระทำ" value={`${selected.user_profiles?.full_name || '—'} (${selected.user_profiles?.email || 'system'})`} />
              <Row label="Entity" value={`${selected.entity_type} · ${selected.entity_id || '—'}`} mono />
              {selected.changes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Changes</p>
                  <pre className="bg-secondary rounded-lg p-3 text-xs overflow-auto max-h-48 font-mono">
                    {JSON.stringify(selected.changes, null, 2)}
                  </pre>
                </div>
              )}
              {selected.ip_address && <Row label="IP" value={selected.ip_address} mono />}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{label}</span>
      <span className={cn('flex-1 text-sm break-all', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  );
}
