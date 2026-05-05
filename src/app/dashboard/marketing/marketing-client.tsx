'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TopBar } from '@/components/layout/top-bar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { MessageCircle, Mail, Send, Star, Plus, Megaphone, Users, BarChart3, AlertCircle } from 'lucide-react';

const CAMPAIGN_TYPES = [
  { id: 'line_broadcast', label: 'LINE Broadcast', icon: MessageCircle, color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300', desc: 'ส่งถึงผู้ติดตาม LINE OA' },
  { id: 'email', label: 'Email', icon: Mail, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', desc: 'Newsletter ถึงแขกที่ยินยอม' },
  { id: 'sms', label: 'SMS', icon: MessageCircle, color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300', desc: 'SMS reminder/promotion' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-secondary text-muted-foreground',
  scheduled: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  sending: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  sent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
};

export function MarketingClient({ hotelId, campaigns, reviews, eligibleGuests }: {
  hotelId: string; campaigns: any[]; reviews: any[]; eligibleGuests: number;
}) {
  const supabase = createClient();
  const [camps, setCamps] = useState(campaigns);
  const [revs, setRevs] = useState(reviews);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'email', subject: '', body: '', audience: 'all', scheduledAt: '' });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'reviews'>('campaigns');

  const avgRating = revs.length ? (revs.reduce((s, r) => s + r.rating, 0) / revs.length).toFixed(1) : '—';

  async function createCampaign() {
    if (!form.name || !form.body) { toast.error('กรอก ชื่อและเนื้อหาก่อน'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('marketing_campaigns').insert({
      hotel_id: hotelId,
      name: form.name,
      type: form.type,
      status: form.scheduledAt ? 'scheduled' : 'draft',
      audience_filter: { group: form.audience },
      content: { subject: form.subject, body: form.body },
      scheduled_at: form.scheduledAt || null,
    }).select().single();
    setSaving(false);
    if (error) { toast.error('สร้าง campaign ไม่สำเร็จ'); return; }
    setCamps(prev => [data, ...prev]);
    setShowCreate(false);
    setForm({ name: '', type: 'email', subject: '', body: '', audience: 'all', scheduledAt: '' });
    toast.success('สร้าง campaign แล้ว');
  }

  async function sendCampaign(id: string) {
    await supabase.from('marketing_campaigns').update({ status: 'sending', sent_at: new Date().toISOString() }).eq('id', id);
    setCamps(prev => prev.map(c => c.id === id ? { ...c, status: 'sending' } : c));
    toast.info('กำลังส่ง... (Demo: จริงๆ จะเชื่อมกับ LINE/SendGrid API)');
    setTimeout(async () => {
      const mockSent = Math.floor(eligibleGuests * 0.8);
      await supabase.from('marketing_campaigns').update({ status: 'sent', recipient_count: mockSent, open_count: Math.floor(mockSent * 0.35) }).eq('id', id);
      setCamps(prev => prev.map(c => c.id === id ? { ...c, status: 'sent', recipient_count: mockSent, open_count: Math.floor(mockSent * 0.35) } : c));
      toast.success(`ส่งเรียบร้อย ${mockSent} คน`);
    }, 2000);
  }

  async function replyReview(reviewId: string, reply: string) {
    await supabase.from('reviews').update({ reply_text: reply, replied_at: new Date().toISOString() }).eq('id', reviewId);
    setRevs(prev => prev.map(r => r.id === reviewId ? { ...r, reply_text: reply, replied_at: new Date().toISOString() } : r));
    toast.success('ตอบรีวิวแล้ว');
  }

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar title="การตลาด" description="Campaigns, รีวิว และการวิเคราะห์"
        action={<Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-3.5 w-3.5" /> สร้าง Campaign</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Campaigns ทั้งหมด" value={camps.length} />
        <StatCard label="แขกรับข่าวได้" value={eligibleGuests} unit="คน" />
        <StatCard label="คะแนนรีวิวเฉลี่ย" value={avgRating} unit="/ 5" />
        <StatCard label="รีวิวทั้งหมด" value={revs.length} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {[{ id: 'campaigns', label: 'Campaigns', icon: Megaphone }, { id: 'reviews', label: 'รีวิว', icon: Star }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === t.id ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {camps.length === 0 ? (
            <EmptyState icon={Send} title="ยังไม่มี Campaign"
              description="สร้าง campaign แรกเพื่อส่งโปรโมชั่นถึงแขก"
              action={<Button onClick={() => setShowCreate(true)}><Plus className="h-3.5 w-3.5" /> สร้าง Campaign</Button>}
            />
          ) : camps.map(c => (
            <Card key={c.id}>
              <CardContent className="p-5 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium">{c.name}</span>
                    <span className={cn('text-2xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[c.status] || STATUS_COLORS.draft)}>
                      {c.status}
                    </span>
                    <span className="text-2xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{c.type}</span>
                  </div>
                  {c.recipient_count > 0 && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> ส่ง {c.recipient_count?.toLocaleString()}</span>
                      {c.open_count > 0 && <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> เปิด {c.open_count?.toLocaleString()} ({Math.round((c.open_count/c.recipient_count)*100)}%)</span>}
                    </div>
                  )}
                  {c.scheduled_at && c.status === 'scheduled' && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      กำหนดส่ง: {format(parseISO(c.scheduled_at), 'd MMM yyyy HH:mm', { locale: th })}
                    </div>
                  )}
                </div>
                {c.status === 'draft' && (
                  <Button size="sm" onClick={() => sendCampaign(c.id)}>
                    <Send className="h-3.5 w-3.5" /> ส่งเลย
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {revs.length === 0 ? (
            <EmptyState icon={Star} title="ยังไม่มีรีวิว" description="รีวิวจาก OTA จะแสดงที่นี่" />
          ) : revs.map(r => (
            <ReviewCard key={r.id} review={r} onReply={(reply: string) => { replyReview(r.id, reply); }} />
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      <Dialog open={showCreate} onOpenChange={o => !o && setShowCreate(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>สร้าง Campaign ใหม่</DialogTitle>
            <DialogDescription>ส่งข้อความถึงแขกที่ให้ marketing consent ({eligibleGuests} คน)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ชื่อ Campaign *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="เช่น Songkran Special 2025" className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ช่องทาง</label>
              <div className="grid grid-cols-3 gap-2">
                {CAMPAIGN_TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} onClick={() => setForm(p => ({ ...p, type: t.id }))}
                      className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium',
                        form.type === t.id ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30')}>
                      <Icon className="h-4 w-4" />{t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {form.type === 'email' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="หัวข้ออีเมล" className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">เนื้อหา *</label>
              <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                rows={4} placeholder="เนื้อหาที่ต้องการส่ง..." className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">กลุ่มเป้าหมาย</label>
              <select value={form.audience} onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="all">ทุกคนที่ยินยอม ({eligibleGuests} คน)</option>
                <option value="vip">VIP เท่านั้น</option>
                <option value="silver_plus">Silver tier ขึ้นไป</option>
                <option value="recent">เข้าพักใน 6 เดือนที่ผ่านมา</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">กำหนดส่ง (เว้นว่าง = save as draft)</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
            <Button onClick={createCampaign} disabled={saving}>{saving ? 'กำลังบันทึก...' : form.scheduledAt ? 'กำหนดการส่ง' : 'บันทึก Draft'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewCard({ review: r, onReply }: { review: any; onReply: (reply: string) => void }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState(r.reply_text || '');
  const stars = Math.min(5, Math.max(1, Math.round(r.rating)));
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-sm font-medium shrink-0">
            {(r.reviewer_name || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{r.reviewer_name || 'แขกไม่ระบุชื่อ'}</span>
              <span className="text-2xs text-muted-foreground">{r.platform}</span>
              {r.created_at && <span className="text-2xs text-muted-foreground">{format(parseISO(r.created_at), 'd MMM yyyy', { locale: th })}</span>}
            </div>
            <div className="flex mt-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn('h-3.5 w-3.5', i < stars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30')} />)}</div>
          </div>
        </div>
        {r.comment && <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{r.comment}</p>}
        {r.reply_text ? (
          <div className="ml-4 p-3 rounded-xl bg-secondary/50 text-xs">
            <div className="font-medium mb-1 text-accent">ตอบกลับของโรงแรม</div>
            <p className="text-muted-foreground">{r.reply_text}</p>
          </div>
        ) : (
          <div>
            {showReply ? (
              <div className="space-y-2">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3}
                  placeholder="พิมพ์ตอบกลับ..." className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowReply(false)}>ยกเลิก</Button>
                  <Button size="sm" onClick={() => { onReply(replyText); setShowReply(false); }}>ส่งตอบกลับ</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setShowReply(true)}>ตอบกลับรีวิว</Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, unit }: { label: string; value: number | string; unit?: string }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-display text-2xl font-medium ticker">{value}{unit && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}</div>
    </CardContent></Card>
  );
}
