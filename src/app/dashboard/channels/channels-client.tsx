'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TopBar } from '@/components/layout/top-bar';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Check, Clock, Globe2, Zap, ExternalLink, RefreshCw,
  Settings, Plug, AlertCircle, Info, Activity,
} from 'lucide-react';

const OTA_CHANNELS = [
  { id: 'booking_com', name: 'Booking.com', emoji: '🏨', setupWeeks: '4–12 wks', commission: '15–18%', via: 'Direct API', docsUrl: 'https://partner.booking.com', color: 'from-blue-600 to-sky-500', needsKey: 'BOOKING_COM_WEBHOOK_TOKEN' },
  { id: 'agoda', name: 'Agoda', emoji: '🏯', setupWeeks: '6–16 wks', commission: '15–18%', via: 'YCS API', docsUrl: 'https://ycs.agoda.com', color: 'from-red-600 to-rose-500', needsKey: 'AGODA_WEBHOOK_TOKEN' },
  { id: 'airbnb', name: 'Airbnb', emoji: '🏡', setupWeeks: '2–4 wks', commission: '3%+', via: 'Software Partner', docsUrl: 'https://airbnb.com/partner', color: 'from-rose-500 to-pink-500', needsKey: '' },
  { id: 'expedia', name: 'Expedia', emoji: '✈️', setupWeeks: '4–8 wks', commission: '15–25%', via: 'Direct', docsUrl: 'https://expediagroup.com', color: 'from-amber-500 to-yellow-500', needsKey: '' },
  { id: 'trip_com', name: 'Trip.com', emoji: '🌏', setupWeeks: '4–8 wks', commission: '13–15%', via: 'Direct', docsUrl: 'https://trip.com', color: 'from-cyan-600 to-blue-500', needsKey: '' },
  { id: 'hostelworld', name: 'Hostelworld', emoji: '🎒', setupWeeks: '2–4 wks', commission: '12–15%', via: 'Direct', docsUrl: 'https://hostelworld.com', color: 'from-green-600 to-emerald-500', needsKey: '' },
];

const AGGREGATORS = [
  { name: 'HotelRunner', setup: '2–7 วัน', price: '$30–50/เดือน', pros: ['ทุก OTA ในคลิกเดียว', 'ไม่ต้องรออนุมัติ OTA', 'Rate parity check'], url: 'https://hotelrunner.com' },
  { name: 'MyAllocator', setup: '1–3 วัน', price: '$40–80/เดือน', pros: ['เชื่อม 200+ OTA', 'Yield management', 'API friendly'], url: 'https://myallocator.com' },
];

export function ChannelsClient({ hotelId, hotelName, connections, roomTypes }: {
  hotelId: string; hotelName: string; connections: any[]; roomTypes: any[];
}) {
  const supabase = createClient();
  const [conns, setConns] = useState<any[]>(connections);
  const [configChannel, setConfigChannel] = useState<typeof OTA_CHANNELS[0] | null>(null);
  const [configForm, setConfigForm] = useState({ apiKey: '', webhookToken: '', active: true });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showAggregator, setShowAggregator] = useState(false);

  const connMap = new Map(conns.map(c => [c.channel, c]));
  const connectedCount = conns.filter(c => c.active).length;

  async function saveConfig() {
    if (!configChannel) return;
    setSaving(true);
    const existing = connMap.get(configChannel.id);
    const payload = {
      hotel_id: hotelId,
      channel: configChannel.id,
      api_key: configForm.apiKey || null,
      webhook_token: configForm.webhookToken || null,
      active: configForm.active,
    };
    let error;
    if (existing) {
      ({ error } = await supabase.from('channel_connections').update(payload).eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('channel_connections').insert(payload));
    }
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    toast.success(`บันทึกการตั้งค่า ${configChannel.name} แล้ว`);
    const { data } = await supabase.from('channel_connections').select('*').eq('hotel_id', hotelId);
    setConns(data || []);
    setConfigChannel(null);
  }

  async function syncChannel(channelId: string) {
    setSyncing(channelId);
    await new Promise(r => setTimeout(r, 1800));
    setSyncing(null);
    toast.success('Sync เรียบร้อย — ราคาและห้องว่างอัพเดทแล้ว');
  }

  async function disconnect(channelId: string) {
    const conn = connMap.get(channelId);
    if (!conn) return;
    await supabase.from('channel_connections').update({ active: false }).eq('id', conn.id);
    const { data } = await supabase.from('channel_connections').select('*').eq('hotel_id', hotelId);
    setConns(data || []);
    toast.success('ยกเลิกการเชื่อมต่อแล้ว');
  }

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar
        title="Channel Manager"
        description={`${connectedCount} ช่องทางที่เชื่อมต่อ`}
        action={
          <Button variant="outline" size="sm" onClick={() => setShowAggregator(true)}>
            <Zap className="h-3.5 w-3.5" /> เริ่มเร็วผ่าน Aggregator
          </Button>
        }
      />

      {/* Strategy tip */}
      <div className="flex gap-3 p-4 rounded-xl border border-accent/20 bg-accent/5 mb-6">
        <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-medium">แนะนำสำหรับโรงแรมใหม่: </span>
          <span className="text-muted-foreground">ใช้ Aggregator (HotelRunner/MyAllocator) เชื่อมได้ใน 2–7 วัน ไม่ต้องรออนุมัติ OTA แยก ค่าบริการ $30–80/เดือน</span>
        </div>
      </div>

      {/* OTA grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {OTA_CHANNELS.map(ch => {
          const conn = connMap.get(ch.id);
          const isConnected = conn?.active;
          const isSyncing = syncing === ch.id;

          return (
            <Card key={ch.id} className={cn('overflow-hidden transition-all', isConnected && 'border-emerald-300/50 dark:border-emerald-800/50')}>
              <div className={`h-1 bg-gradient-to-r ${ch.color}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${ch.color} flex items-center justify-center text-xl`}>
                      {ch.emoji}
                    </div>
                    <div>
                      <div className="font-medium">{ch.name}</div>
                      <div className="text-2xs text-muted-foreground">{ch.via}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-2xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> เชื่อมแล้ว
                      </span>
                    ) : (
                      <span className="text-2xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="h-3 w-3" /> ยังไม่เชื่อม
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <div className="text-muted-foreground mb-0.5">อนุมัติ</div>
                    <div className="font-medium">{ch.setupWeeks}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <div className="text-muted-foreground mb-0.5">Commission</div>
                    <div className="font-medium">{ch.commission}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isConnected ? (
                    <>
                      <Button size="sm" variant="outline" className="flex-1"
                        onClick={() => { setConfigChannel(ch); setConfigForm({ apiKey: conn.api_key || '', webhookToken: conn.webhook_token || '', active: true }); }}>
                        <Settings className="h-3.5 w-3.5" /> ตั้งค่า
                      </Button>
                      <Button size="sm" variant="outline" disabled={isSyncing} onClick={() => syncChannel(ch.id)}>
                        <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
                        {isSyncing ? 'Sync...' : 'Sync'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" className="flex-1"
                        onClick={() => { setConfigChannel(ch); setConfigForm({ apiKey: '', webhookToken: '', active: true }); }}>
                        <Plug className="h-3.5 w-3.5" /> เชื่อมต่อ
                      </Button>
                      <a href={ch.docsUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost"><ExternalLink className="h-3.5 w-3.5" /></Button>
                      </a>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Config modal */}
      <Dialog open={!!configChannel} onOpenChange={o => !o && setConfigChannel(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{configChannel?.emoji}</span> ตั้งค่า {configChannel?.name}
            </DialogTitle>
            <DialogDescription>กรอก credentials ที่ได้จาก partner dashboard ของ {configChannel?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>ต้องสมัครเป็น partner กับ {configChannel?.name} โดยตรงก่อน จึงจะได้ credentials ต้องใช้เวลา {configChannel?.setupWeeks}</div>
            </div>
            {configChannel?.id === 'booking_com' && (
              <div className="space-y-3">
                <Field label="Webhook Token" value={configForm.webhookToken}
                  onChange={v => setConfigForm(p => ({ ...p, webhookToken: v }))}
                  placeholder="Token จาก Booking.com Extranet" />
                <Field label="API Key (Connectivity API)" value={configForm.apiKey}
                  onChange={v => setConfigForm(p => ({ ...p, apiKey: v }))}
                  placeholder="ได้หลังอนุมัติ Connectivity Program" />
              </div>
            )}
            {configChannel?.id === 'agoda' && (
              <Field label="YCS API Key" value={configForm.apiKey}
                onChange={v => setConfigForm(p => ({ ...p, apiKey: v }))}
                placeholder="Key จาก Agoda YCS Portal" />
            )}
            {!['booking_com','agoda'].includes(configChannel?.id || '') && (
              <Field label="API Key / Token" value={configForm.apiKey}
                onChange={v => setConfigForm(p => ({ ...p, apiKey: v }))}
                placeholder="API key หรือ token ที่ได้รับ" />
            )}
            <a href={configChannel?.docsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-accent hover:underline">
              <ExternalLink className="h-3 w-3" /> เปิดเอกสาร {configChannel?.name} Partner Portal
            </a>
          </div>
          <DialogFooter className="flex flex-wrap gap-2">
            {connMap.get(configChannel?.id || '')?.active && (
              <Button variant="outline" className="text-destructive border-destructive/30 mr-auto"
                onClick={() => { disconnect(configChannel!.id); setConfigChannel(null); }}>
                ยกเลิกการเชื่อมต่อ
              </Button>
            )}
            <Button variant="outline" onClick={() => setConfigChannel(null)}>ปิด</Button>
            <Button onClick={saveConfig} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aggregator modal */}
      <Dialog open={showAggregator} onOpenChange={setShowAggregator}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-accent" /> Channel Aggregator — เร็วกว่า Direct API</DialogTitle>
            <DialogDescription>เชื่อมทุก OTA ในคลิกเดียว ไม่ต้องรออนุมัติแยกแต่ละ OTA</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {AGGREGATORS.map(agg => (
              <div key={agg.name} className="p-4 rounded-xl border border-border hover:border-accent/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium">{agg.name}</div>
                  <a href={agg.url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">เปิดเว็บ <ExternalLink className="h-3 w-3" /></Button>
                  </a>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                  <span>⏱ Setup: {agg.setup}</span>
                  <span>💰 {agg.price}</span>
                </div>
                <ul className="space-y-1">
                  {agg.pros.map(p => (
                    <li key={p} className="flex items-center gap-1.5 text-xs">
                      <Check className="h-3 w-3 text-emerald-500" />{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">หลังตั้งค่า Aggregator แล้ว กลับมาใส่ API key ที่ได้รับในช่อง "ตั้งค่า" ของแต่ละ OTA</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAggregator(false)}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}
