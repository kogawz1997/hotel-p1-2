'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Tag, X, Check, AlertCircle } from 'lucide-react';

export function RateCalendarClient({ hotelId, roomTypes }: { hotelId: string; roomTypes: any[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRoomType, setSelectedRoomType] = useState(roomTypes[0]?.id || '');
  const [rates, setRates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [editPanel, setEditPanel] = useState(false);
  const [editForm, setEditForm] = useState({ rate: '', minStay: '1', closedToArrival: false, closedToDeparture: false });
  const [saving, setSaving] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);

  const rt = roomTypes.find(r => r.id === selectedRoomType);

  const load = useCallback(async () => {
    if (!selectedRoomType) return;
    setLoading(true);
    const res = await fetch(`/api/rates?hotelId=${hotelId}&year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`);
    const data = await res.json();
    const map: Record<string, any> = {};
    (data.rates || []).filter((r: any) => r.room_type_id === selectedRoomType).forEach((r: any) => { map[r.date] = r; });
    setRates(map);
    setLoading(false);
  }, [hotelId, selectedRoomType, currentMonth]);

  useEffect(() => { load(); setSelected([]); }, [load]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = getDay(days[0]);

  function toggleDay(dateStr: string) {
    if (isBefore(new Date(dateStr), startOfDay(new Date()))) return;
    setSelected(p => p.includes(dateStr) ? p.filter(d => d !== dateStr) : [...p, dateStr]);
  }

  async function saveRates() {
    if (!selected.length || !editForm.rate) { toast.error('เลือกวันและกรอกราคาก่อน'); return; }
    setSaving(true);
    const res = await fetch('/api/rates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotelId, roomTypeId: selectedRoomType, dates: selected,
        rate: editForm.rate, minStay: Number(editForm.minStay),
        closedToArrival: editForm.closedToArrival,
        closedToDeparture: editForm.closedToDeparture,
      }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('บันทึกไม่สำเร็จ'); return; }
    toast.success(`อัพเดตราคา ${selected.length} วันแล้ว`);
    setSelected([]);
    setEditPanel(false);
    load();
  }

  async function clearRate(dateStr: string) {
    await fetch(`/api/rates?hotelId=${hotelId}&roomTypeId=${selectedRoomType}&date=${dateStr}`, { method: 'DELETE' });
    setRates(p => { const n = { ...p }; delete n[dateStr]; return n; });
    toast.success('รีเซ็ตราคาแล้ว');
  }

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="ปฏิทินราคา" description="ตั้งราคาแต่ละวัน, min stay และ restrictions"
        action={selected.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selected.length} วันที่เลือก</span>
            <button onClick={() => setEditPanel(true)} className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium">
              <Tag className="h-3.5 w-3.5" /> ตั้งราคา
            </button>
            <button onClick={() => setSelected([])} className="p-2 hover:bg-secondary rounded-lg">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Room type selector */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {roomTypes.map(rt => (
          <button key={rt.id} onClick={() => { setSelectedRoomType(rt.id); setSelected([]); }}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors', selectedRoomType === rt.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
            {rt.name} <span className="text-xs opacity-60 ml-1">{formatCurrency(rt.base_rate)}</span>
          </button>
        ))}
      </div>

      {/* Calendar nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(p => subMonths(p, 1))} className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-medium">{format(currentMonth, 'MMMM yyyy', { locale: th })}</span>
        <button onClick={() => setCurrentMonth(p => addMonths(p, 1))} className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
        {[
          { color: 'bg-secondary', label: 'ราคาปกติ (base rate)' },
          { color: 'bg-accent/20 border border-accent/30', label: 'ราคาพิเศษ' },
          { color: 'bg-primary text-primary-foreground', label: 'เลือกแล้ว' },
          { color: 'bg-red-100 dark:bg-red-950', label: 'ปิดรับจอง' },
        ].map(l => <div key={l.label} className="flex items-center gap-1.5"><div className={cn('h-3 w-3 rounded', l.color)} />{l.label}</div>)}
      </div>

      {/* Calendar grid */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} className="border-b border-r border-border h-20" />)}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isPast = isBefore(day, startOfDay(new Date()));
            const hasRate = !!rates[dateStr];
            const rate = rates[dateStr];
            const isSel = selected.includes(dateStr);
            const isClosed = rate?.closed_to_arrival || rate?.closed_to_departure;
            return (
              <div key={dateStr}
                onClick={() => !isPast && toggleDay(dateStr)}
                className={cn(
                  'border-b border-r border-border h-20 p-1.5 cursor-pointer transition-colors relative group',
                  isPast && 'opacity-30 cursor-default',
                  !isPast && !isSel && 'hover:bg-secondary/50',
                  isSel && 'bg-primary/10 border-primary/30',
                  isClosed && !isSel && 'bg-red-50 dark:bg-red-950/30',
                )}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-xs font-medium', isToday(day) && 'text-accent font-bold', isSel && 'text-primary')}>
                    {format(day, 'd')}
                  </span>
                  {isSel && <Check className="h-3 w-3 text-primary" />}
                  {hasRate && !isSel && (
                    <button onClick={e => { e.stopPropagation(); clearRate(dateStr); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {hasRate ? (
                  <div className={cn('text-2xs font-medium', isClosed ? 'text-red-600' : 'text-accent')}>
                    {isClosed ? '🚫 ปิด' : formatCurrency(Number(rate.rate))}
                    {rate.min_stay > 1 && <div className="text-muted-foreground">min {rate.min_stay}คืน</div>}
                  </div>
                ) : (
                  <div className="text-2xs text-muted-foreground/50">
                    {rt ? formatCurrency(rt.base_rate) : '—'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bulk select helpers */}
      {!editPanel && (
        <div className="flex flex-wrap gap-2 mt-4 text-xs">
          <span className="text-muted-foreground self-center">เลือกด่วน:</span>
          {[
            { label: 'ทุกวันศุกร์-เสาร์', action: () => setSelected(days.filter(d => [5,6].includes(getDay(d)) && !isBefore(d, startOfDay(new Date()))).map(d => format(d, 'yyyy-MM-dd'))) },
            { label: 'ทุกวันในเดือน', action: () => setSelected(days.filter(d => !isBefore(d, startOfDay(new Date()))).map(d => format(d, 'yyyy-MM-dd'))) },
            { label: 'ล้างการเลือก', action: () => setSelected([]) },
          ].map(s => (
            <button key={s.label} onClick={s.action} className="px-3 py-1.5 bg-secondary rounded-lg hover:bg-secondary/70 transition-colors text-muted-foreground hover:text-foreground">
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Edit panel */}
      {editPanel && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setEditPanel(false)}>
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-1">ตั้งราคา {selected.length} วัน</h3>
            <p className="text-xs text-muted-foreground mb-4">{rt?.name} · วันที่เลือก: {selected.slice(0,3).join(', ')}{selected.length > 3 ? ` +${selected.length - 3}` : ''}</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">ราคา (บาท/คืน) *</label>
                <input type="number" value={editForm.rate} onChange={e => setEditForm(p => ({ ...p, rate: e.target.value }))}
                  placeholder={rt?.base_rate} className="w-full px-3 py-2.5 bg-secondary border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">จำนวนคืนขั้นต่ำ</label>
                <select value={editForm.minStay} onChange={e => setEditForm(p => ({ ...p, minStay: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-secondary border-0 rounded-xl text-sm focus:outline-none">
                  {[1,2,3,5,7].map(n => <option key={n} value={n}>{n} คืน</option>)}
                </select>
              </div>
              <div className="space-y-2">
                {[
                  { key: 'closedToArrival', label: 'ปิดรับ Check-in (CTA)' },
                  { key: 'closedToDeparture', label: 'ปิดรับ Check-out (CTD)' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => setEditForm(p => ({ ...p, [key]: !(p as any)[key] }))}
                      className={cn('relative w-10 h-5 rounded-full transition-colors', (editForm as any)[key] ? 'bg-accent' : 'bg-muted')}>
                      <div className={cn('absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform', (editForm as any)[key] ? 'translate-x-5' : 'translate-x-0.5')} />
                    </div>
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditPanel(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm">ยกเลิก</button>
              <button onClick={saveRates} disabled={saving || !editForm.rate}
                className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {saving ? 'กำลังบันทึก...' : `บันทึก ${selected.length} วัน`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
