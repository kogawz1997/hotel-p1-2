'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TopBar } from '@/components/layout/top-bar';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  User, Mail, Phone, Globe2, Star, Calendar, DollarSign,
  Award, TrendingUp, Bed, Plus, Pencil, ArrowLeft, Clock,
  Shield, Heart, MessageSquare, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const TIER_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  bronze: { color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-950', label: 'Bronze' },
  silver: { color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-900', label: 'Silver' },
  gold:   { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-950', label: 'Gold' },
  platinum: { color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-950', label: 'Platinum' },
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  checked_in: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  checked_out: 'bg-secondary text-muted-foreground',
  cancelled: 'bg-red-50 text-red-700 opacity-60',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
};

export function GuestDetailClient({ guest, reservations, loyaltyTx, hotelId }: {
  guest: any; reservations: any[]; loyaltyTx: any[]; hotelId: string;
}) {
  const supabase = createClient();
  const [g, setG] = useState(guest);
  const [showEdit, setShowEdit] = useState(false);
  const [showPoints, setShowPoints] = useState(false);
  const [editForm, setEditForm] = useState({ notes: g.notes || '', preferences: JSON.stringify(g.preferences || {}, null, 2), vip_status: g.vip_status, marketing_consent: g.marketing_consent });
  const [pointsForm, setPointsForm] = useState({ type: 'adjust', points: '', description: '' });
  const [saving, setSaving] = useState(false);

  const tier = TIER_CONFIG[g.loyalty_tier] || TIER_CONFIG.bronze;
  const nextTierPoints = g.loyalty_tier === 'bronze' ? 5000 : g.loyalty_tier === 'silver' ? 20000 : g.loyalty_tier === 'gold' ? 50000 : null;
  const progressPct = nextTierPoints ? Math.min(100, (g.loyalty_points / nextTierPoints) * 100) : 100;

  async function saveEdit() {
    setSaving(true);
    let prefs = g.preferences;
    try { prefs = JSON.parse(editForm.preferences); } catch {}
    const { data, error } = await supabase.from('guests').update({
      notes: editForm.notes,
      preferences: prefs,
      vip_status: editForm.vip_status,
      marketing_consent: editForm.marketing_consent,
    }).eq('id', g.id).select().single();
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    setG(data);
    setShowEdit(false);
    toast.success('อัพเดตแขกแล้ว');
  }

  async function addPoints() {
    if (!pointsForm.points || !pointsForm.description) { toast.error('กรอกข้อมูลให้ครบ'); return; }
    setSaving(true);
    const pts = pointsForm.type === 'redeem' ? -Math.abs(Number(pointsForm.points)) : Math.abs(Number(pointsForm.points));
    const { error } = await supabase.from('loyalty_transactions').insert({
      hotel_id: hotelId, guest_id: g.id,
      type: pointsForm.type, points: pts, description: pointsForm.description,
    });
    if (!error) {
      await supabase.from('guests').update({ loyalty_points: g.loyalty_points + pts }).eq('id', g.id);
      setG((prev: any) => ({ ...prev, loyalty_points: prev.loyalty_points + pts }));
      toast.success(`${pts > 0 ? 'เพิ่ม' : 'หัก'} ${Math.abs(pts)} แต้มแล้ว`);
      setShowPoints(false);
      setPointsForm({ type: 'adjust', points: '', description: '' });
    } else { toast.error('เกิดข้อผิดพลาด'); }
    setSaving(false);
  }

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/guests" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm text-muted-foreground">ฐานข้อมูลแขก</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{g.first_name} {g.last_name || ''}</span>
      </div>

      {/* Header card */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-espresso to-[#4a3c35]" />
        <CardContent className="p-6 -mt-10">
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-display font-medium shadow-lg border-4 border-background">
              {g.first_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-medium">{g.first_name} {g.last_name || ''}</h1>
                {g.vip_status && (
                  <span className="flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    <Star className="h-3 w-3 fill-current" /> VIP
                  </span>
                )}
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', tier.bg, tier.color)}>
                  <Award className="h-3 w-3 inline mr-1" />{tier.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                {g.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{g.email}</span>}
                {g.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{g.phone}</span>}
                {g.nationality && <span className="flex items-center gap-1"><Globe2 className="h-3 w-3" />{g.nationality}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                <Pencil className="h-3.5 w-3.5" /> แก้ไข
              </Button>
              <Button size="sm" onClick={() => setShowPoints(true)}>
                <Plus className="h-3.5 w-3.5" /> แต้ม
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <Stat icon={Calendar} label="จำนวนครั้ง" value={String(g.total_stays || 0)} unit="ครั้ง" />
            <Stat icon={DollarSign} label="รายได้รวม" value={formatCurrency(g.total_revenue || 0)} />
            <Stat icon={Award} label="แต้มสะสม" value={(g.loyalty_points || 0).toLocaleString()} unit="pts" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info + Loyalty */}
        <div className="space-y-4">
          {/* Profile info */}
          <Card>
            <CardHeader><CardTitle className="text-sm">ข้อมูลส่วนตัว</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {g.date_of_birth && <Row label="วันเกิด" value={format(parseISO(g.date_of_birth), 'd MMM yyyy', { locale: th })} />}
              {g.passport_number && <Row label="Passport" value={g.passport_number} mono />}
              {g.id_card_number && <Row label="บัตรประชาชน" value={g.id_card_number} mono />}
              <Row label="ภาษาที่ต้องการ" value={g.preferred_language?.toUpperCase() || 'EN'} />
              <div className="pt-1 border-t border-border">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Marketing consent</span>
                  <span className={g.marketing_consent ? 'text-emerald-600' : 'text-red-500'}>
                    {g.marketing_consent ? 'ยินยอม' : 'ไม่ยินยอม'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loyalty progress */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-accent" />Loyalty</CardTitle></CardHeader>
            <CardContent>
              <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium mb-3', tier.bg, tier.color)}>
                <Award className="h-4 w-4" /> {tier.label}
              </div>
              <div className="text-2xl font-display font-medium mb-1 ticker">{(g.loyalty_points || 0).toLocaleString()} pts</div>
              {nextTierPoints && (
                <>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    อีก {(nextTierPoints - g.loyalty_points).toLocaleString()} แต้ม → tier ถัดไป
                  </p>
                </>
              )}
              {g.notes && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-2xs text-muted-foreground mb-1 uppercase tracking-wider">หมายเหตุ</p>
                  <p className="text-xs leading-relaxed">{g.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferences */}
          {Object.keys(g.preferences || {}).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">ความชอบ</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {Object.entries(g.preferences || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{k}</span>
                      <span className="font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Reservations + Loyalty history */}
        <div className="lg:col-span-2 space-y-4">
          {/* Reservation history */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Bed className="h-4 w-4" />ประวัติการเข้าพัก ({reservations.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              {reservations.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">ยังไม่มีประวัติการเข้าพัก</p>
              ) : (
                <div className="divide-y divide-border">
                  {reservations.map(r => (
                    <div key={r.id} className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-muted-foreground">{r.reservation_code}</span>
                          <span className={cn('text-2xs px-1.5 py-0.5 rounded-full font-medium', STATUS_COLORS[r.status])}>
                            {r.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {r.rooms?.room_number ? `ห้อง ${r.rooms.room_number} · ` : ''}{r.room_types?.name} · {r.nights} คืน
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(r.check_in + 'T00:00:00'), 'd MMM yyyy', { locale: th })} →{' '}
                          {format(new Date(r.check_out + 'T00:00:00'), 'd MMM yyyy', { locale: th })}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-medium text-sm ticker">{formatCurrency(r.total_amount)}</div>
                        {r.paid_amount < r.total_amount && (
                          <div className="text-xs text-destructive">ค้าง {formatCurrency(r.total_amount - r.paid_amount)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loyalty transactions */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />ประวัติแต้ม</CardTitle></CardHeader>
            <CardContent className="p-0">
              {loyaltyTx.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">ยังไม่มีประวัติแต้ม</p>
              ) : (
                <div className="divide-y divide-border">
                  {loyaltyTx.map(tx => (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                        tx.points > 0 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300')}>
                        {tx.points > 0 ? '+' : ''}{tx.points > 0 ? tx.points : tx.points}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">{tx.description}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(tx.created_at), 'd MMM yyyy HH:mm', { locale: th })}
                        </div>
                      </div>
                      <div className={cn('font-medium text-sm ticker shrink-0', tx.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600')}>
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

      {/* Edit modal */}
      <Dialog open={showEdit} onOpenChange={o => !o && setShowEdit(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>แก้ไขข้อมูลแขก</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">หมายเหตุภายใน</label>
              <textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                rows={3} className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Preferences (JSON)</label>
              <textarea value={editForm.preferences} onChange={e => setEditForm(p => ({ ...p, preferences: e.target.value }))}
                rows={4} className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex flex-col gap-2">
              <ToggleCheck label="VIP Status" value={editForm.vip_status} onChange={v => setEditForm(p => ({ ...p, vip_status: v }))} />
              <ToggleCheck label="Marketing Consent" value={editForm.marketing_consent} onChange={v => setEditForm(p => ({ ...p, marketing_consent: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>ยกเลิก</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add points modal */}
      <Dialog open={showPoints} onOpenChange={o => !o && setShowPoints(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>จัดการแต้ม Loyalty</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ประเภท</label>
              <select value={pointsForm.type} onChange={e => setPointsForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="earn">เพิ่มแต้ม (Earn)</option>
                <option value="redeem">ใช้แต้ม (Redeem)</option>
                <option value="adjust">ปรับแต่ง (Manual)</option>
                <option value="expire">หมดอายุ (Expire)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">จำนวนแต้ม</label>
              <input type="number" value={pointsForm.points} onChange={e => setPointsForm(p => ({ ...p, points: e.target.value }))}
                placeholder="500" className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">เหตุผล *</label>
              <input value={pointsForm.description} onChange={e => setPointsForm(p => ({ ...p, description: e.target.value }))}
                placeholder="เช่น โปรโมชั่นพิเศษ, ชดเชยปัญหา..." className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 text-xs text-muted-foreground">
              แต้มปัจจุบัน: <strong>{(g.loyalty_points || 0).toLocaleString()} pts</strong>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPoints(false)}>ยกเลิก</Button>
            <Button onClick={addPoints} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ icon: Icon, label, value, unit }: { icon: any; label: string; value: string; unit?: string }) {
  return (
    <div className="p-3 rounded-xl bg-secondary/50">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Icon className="h-3 w-3" />{label}</div>
      <div className="font-display text-lg font-medium ticker">{value} {unit && <span className="text-xs text-muted-foreground">{unit}</span>}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn('text-xs', mono && 'font-mono')}>{value}</span>
    </div>
  );
}

function ToggleCheck({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-secondary/50">
      <span className="text-sm">{label}</span>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="rounded" />
    </label>
  );
}
