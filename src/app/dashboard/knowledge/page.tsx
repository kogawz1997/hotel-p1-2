'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TopBar } from '@/components/layout/top-bar';
import { BookOpen, Plus, Pencil, Trash2, Sparkles, HelpCircle, Map, Coffee, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'faq',       label: 'FAQ',           icon: HelpCircle, color: 'text-blue-600' },
  { value: 'policy',    label: 'นโยบาย',        icon: FileText,   color: 'text-amber-600' },
  { value: 'amenity',   label: 'สิ่งอำนวยความสะดวก', icon: Coffee,  color: 'text-emerald-600' },
  { value: 'local_info',label: 'ข้อมูลพื้นที่', icon: Map,        color: 'text-purple-600' },
];

interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  language: string;
  active: boolean;
  created_at: string;
}

export default function KnowledgePage() {
  const supabase = createClient();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotelId, setHotelId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<KnowledgeItem | null>(null);
  const [form, setForm] = useState({ category: 'faq', title: '', content: '', language: 'th', active: true });
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
      const { data: hotels } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1);
      if (hotels?.[0]) { setHotelId(hotels[0].id); load(hotels[0].id); }
    }
    init();
  }, []);

  async function load(hid = hotelId) {
    setLoading(true);
    const { data } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('hotel_id', hid)
      .order('category')
      .order('title');
    setItems(data || []);
    setLoading(false);
  }

  function openCreate() {
    setEditItem(null);
    setForm({ category: 'faq', title: '', content: '', language: 'th', active: true });
    setShowModal(true);
  }

  function openEdit(item: KnowledgeItem) {
    setEditItem(item);
    setForm({ category: item.category, title: item.title, content: item.content, language: item.language, active: item.active });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('กรุณากรอกชื่อและเนื้อหา'); return;
    }
    setSaving(true);
    try {
      if (editItem) {
        const { error } = await supabase.from('knowledge_base').update({
          category: form.category, title: form.title.trim(),
          content: form.content.trim(), language: form.language, active: form.active,
        }).eq('id', editItem.id);
        if (error) throw error;
        toast.success('อัพเดตสำเร็จ');
      } else {
        const { error } = await supabase.from('knowledge_base').insert({
          hotel_id: hotelId, category: form.category, title: form.title.trim(),
          content: form.content.trim(), language: form.language, active: form.active,
        });
        if (error) throw error;
        toast.success('เพิ่มข้อมูลสำเร็จ');
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      toast.error(e.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('ต้องการลบรายการนี้?')) return;
    const { error } = await supabase.from('knowledge_base').delete().eq('id', id);
    if (error) { toast.error('ลบไม่สำเร็จ'); return; }
    toast.success('ลบแล้ว');
    load();
  }

  async function toggleActive(item: KnowledgeItem) {
    await supabase.from('knowledge_base').update({ active: !item.active }).eq('id', item.id);
    load();
  }

  const filtered = filterCategory ? items.filter(i => i.category === filterCategory) : items;

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar
        title="Knowledge Base"
        description="ข้อมูลที่ AI ใช้ตอบคำถามแขก — ยิ่งมาก AI ยิ่งแม่น"
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> เพิ่มข้อมูล
          </Button>
        }
      />

      {/* AI note */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-accent/20 bg-accent/5 mb-6">
        <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-medium text-accent">AI ใช้ข้อมูลเหล่านี้ตอบแขกอัตโนมัติ</span>
          <span className="text-muted-foreground"> — เพิ่ม FAQ, นโยบาย, และข้อมูลพื้นที่เพื่อให้ AI ตอบได้แม่นยำขึ้น</span>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterCategory('')}
          className={cn('text-xs px-3 py-1.5 rounded-full transition-colors',
            !filterCategory ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}
        >
          ทั้งหมด ({items.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = items.filter(i => i.category === cat.value).length;
          return (
            <button key={cat.value}
              onClick={() => setFilterCategory(cat.value === filterCategory ? '' : cat.value)}
              className={cn('text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5',
                filterCategory === cat.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="ยังไม่มีข้อมูล"
          description={filterCategory ? 'ไม่มีข้อมูลในหมวดนี้' : 'เพิ่มข้อมูลแรกเพื่อให้ AI ตอบแขกได้ดีขึ้น'}
          action={<Button onClick={openCreate}><Plus className="h-3.5 w-3.5" /> เพิ่มข้อมูล</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const cat = CATEGORIES.find(c => c.value === item.category);
            const Icon = cat?.icon || BookOpen;
            return (
              <Card key={item.id} className={cn('transition-all', !item.active && 'opacity-50')}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Icon className={cn('h-4 w-4', cat?.color || 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{item.title}</span>
                      <Badge variant="outline" className="text-2xs">{cat?.label || item.category}</Badge>
                      <Badge variant="outline" className="text-2xs">{item.language}</Badge>
                      {!item.active && <Badge variant="secondary" className="text-2xs">ปิดใช้</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(item)}>
                      {item.active ? 'ปิด' : 'เปิด'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* AI Test Panel */}
      <AITestPanel hotelId={hotelId} itemCount={items.filter(i => i.active).length} />

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={(o) => !o && setShowModal(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">หมวดหมู่</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">ภาษา</label>
                <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="th">ไทย</option>
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">หัวข้อ *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="เช่น เวลาเช็คอิน-เช็คเอาท์"
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">เนื้อหา *</label>
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                rows={5} placeholder="เช่น เช็คอินตั้งแต่ 14:00 น. เช็คเอาท์ก่อน 12:00 น. สามารถฝากกระเป๋าได้ที่ reception..."
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                className="rounded" />
              เปิดใช้งาน (AI จะใช้ข้อมูลนี้)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.content.trim()}>
              {saving ? 'กำลังบันทึก...' : editItem ? 'บันทึก' : 'เพิ่มข้อมูล'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AITestPanel({ hotelId, itemCount }: { hotelId: string; itemCount: number }) {
  const [testMsg, setTestMsg] = useState('');
  const [result, setResult] = useState('');
  const [testing, setTesting] = useState(false);

  async function test() {
    if (!testMsg.trim()) return;
    setTesting(true);
    setResult('');
    try {
      const res = await fetch('/api/ai/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMode: true, hotelId, message: testMsg }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.suggestedReply || data.reply || 'AI ตอบกลับสำเร็จ (ดูใน Inbox จริง)');
      } else {
        setResult('ทดสอบไม่สำเร็จ — กรุณาตั้งค่า ANTHROPIC_API_KEY ก่อน');
      }
    } catch {
      setResult('Connection error — ตรวจสอบ API key');
    }
    setTesting(false);
  }

  return (
    <div className="mt-8 p-5 rounded-2xl border border-accent/20 bg-accent/5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="font-medium text-sm">ทดสอบ AI — ใช้ Knowledge Base {itemCount} รายการ</span>
      </div>
      <div className="flex gap-2">
        <input
          value={testMsg}
          onChange={e => setTestMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && test()}
          placeholder="ลองถามเหมือนแขก เช่น 'What time is check-in?'"
          className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button size="sm" onClick={test} disabled={testing || !testMsg.trim()}>
          {testing ? <><span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />ทดสอบ...</> : 'ทดสอบ'}
        </Button>
      </div>
      {result && (
        <div className="mt-3 p-3 rounded-xl bg-card border border-border text-sm whitespace-pre-wrap">
          <div className="text-xs text-accent mb-1 font-medium">AI ตอบว่า:</div>
          {result}
        </div>
      )}
    </div>
  );
}
