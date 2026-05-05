'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TopBar } from '@/components/layout/top-bar';
import { Sparkles, Plus, Check, Clock, AlertCircle, Bed } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

const COLUMNS = [
  { key: 'pending', label: 'รอดำเนินการ', icon: Clock, accent: 'amber' },
  { key: 'in_progress', label: 'กำลังทำ', icon: Sparkles, accent: 'sky' },
  { key: 'completed', label: 'เสร็จแล้ววันนี้', icon: Check, accent: 'emerald' },
];

export function HousekeepingClient({ hotelId }: { hotelId: string }) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('housekeeping_tasks')
      .select('*, rooms(room_number)')
      .eq('hotel_id', hotelId)
      .or(`status.in.(pending,in_progress),and(status.eq.completed,completed_at.gte.${today})`)
      .order('priority', { ascending: false });
    setTasks(data || []);

    const { data: rs } = await supabase
      .from('rooms').select('id, room_number')
      .eq('hotel_id', hotelId).order('room_number');
    setRooms(rs || []);
  }

  async function updateStatus(id: string, status: string) {
    const updates: any = { status };
    if (status === 'in_progress') updates.started_at = new Date().toISOString();
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      const task = tasks.find(t => t.id === id);
      if (task?.room_id) {
        await supabase.from('rooms').update({ status: 'available' }).eq('id', task.room_id);
      }
    }
    const { error } = await supabase.from('housekeeping_tasks').update(updates).eq('id', id);
    if (error) toast.error(error.message);
    else load();
  }

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar
        title="งานแม่บ้าน"
        description={`${tasks.filter(t => t.status === 'pending').length} งานรอ · ${tasks.filter(t => t.status === 'in_progress').length} กำลังทำ`}
        action={<Button size="sm" onClick={() => setShowModal(true)}><Plus className="h-3.5 w-3.5" /> เพิ่มงาน</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          const Icon = col.icon;
          return (
            <div key={col.key}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Icon className={cn(
                  'h-4 w-4',
                  col.accent === 'amber' && 'text-amber-600',
                  col.accent === 'sky' && 'text-sky-600',
                  col.accent === 'emerald' && 'text-emerald-600'
                )} />
                <h2 className="font-medium text-sm">{col.label}</h2>
                <span className="text-xs text-muted-foreground ml-auto">{colTasks.length}</span>
              </div>

              <div className="space-y-2">
                {colTasks.length === 0 ? (
                  <div className="border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground">
                    ไม่มีงาน
                  </div>
                ) : colTasks.map(task => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">ห้อง {task.rooms?.room_number}</span>
                        </div>
                        {task.priority === 'urgent' && <Badge variant="destructive" className="text-2xs">ด่วน</Badge>}
                        {task.priority === 'high' && <Badge variant="warning" className="text-2xs">สำคัญ</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">{taskTypeLabel(task.task_type)}</div>
                      {task.notes && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.notes}</p>
                      )}
                      <div className="text-2xs text-muted-foreground mb-3">
                        {formatDateTime(task.created_at)}
                      </div>
                      {task.status === 'pending' && (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => updateStatus(task.id, 'in_progress')}>
                          เริ่มทำ
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button size="sm" className="w-full" onClick={() => updateStatus(task.id, 'completed')}>
                          <Check className="h-3.5 w-3.5" /> เสร็จแล้ว
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <NewTaskModal
        open={showModal}
        onClose={() => setShowModal(false)}
        hotelId={hotelId}
        rooms={rooms}
        onSuccess={() => { setShowModal(false); load(); }}
      />
    </div>
  );
}

function taskTypeLabel(type: string) {
  const map: Record<string, string> = {
    cleaning: 'ทำความสะอาด',
    turnover: 'เปลี่ยนผ้าปู (Turnover)',
    deep_cleaning: 'ทำความสะอาดลึก',
    inspection: 'ตรวจสอบ',
    maintenance: 'ซ่อมบำรุง',
  };
  return map[type] || type;
}

function NewTaskModal({ open, onClose, hotelId, rooms, onSuccess }: any) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from('housekeeping_tasks').insert({
      hotel_id: hotelId,
      room_id: fd.get('room_id'),
      task_type: fd.get('task_type'),
      priority: fd.get('priority'),
      notes: fd.get('notes'),
      status: 'pending',
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success('สร้างงานสำเร็จ'); onSuccess(); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>เพิ่มงานแม่บ้าน</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select name="room_id" label="ห้อง" required>
            <option value="">เลือกห้อง</option>
            {rooms.map((r: any) => <option key={r.id} value={r.id}>ห้อง {r.room_number}</option>)}
          </Select>
          <Select name="task_type" label="ประเภทงาน" required>
            <option value="cleaning">ทำความสะอาด</option>
            <option value="turnover">เปลี่ยนผ้าปู (Turnover)</option>
            <option value="deep_cleaning">ทำความสะอาดลึก</option>
            <option value="inspection">ตรวจสอบ</option>
            <option value="maintenance">ซ่อมบำรุง</option>
          </Select>
          <Select name="priority" label="ความสำคัญ" defaultValue="normal">
            <option value="low">ไม่เร่ง</option>
            <option value="normal">ปกติ</option>
            <option value="high">สำคัญ</option>
            <option value="urgent">ด่วน</option>
          </Select>
          <Input name="notes" label="หมายเหตุ" placeholder="เช่น แขกขอผ้าเสริม" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button type="submit" disabled={loading}>สร้างงาน</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
