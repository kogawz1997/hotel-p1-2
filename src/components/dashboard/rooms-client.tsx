'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TopBar } from '@/components/layout/top-bar';
import { Plus, Bed, Users, Maximize2, MoreHorizontal } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; variant: any }> = {
  available: { label: 'ว่าง', variant: 'success' },
  occupied: { label: 'มีแขก', variant: 'info' },
  cleaning: { label: 'กำลังทำความสะอาด', variant: 'warning' },
  maintenance: { label: 'ซ่อมบำรุง', variant: 'warning' },
  blocked: { label: 'ปิด', variant: 'destructive' },
};

export function RoomsClient({ hotelId }: { hotelId: string }) {
  const supabase = createClient();
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ roomId: string; status: string; roomNumber: string } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: rs }, { data: rts }] = await Promise.all([
      supabase.from('rooms').select('*, room_types(name, base_rate)').eq('hotel_id', hotelId).order('room_number'),
      supabase.from('room_types').select('*').eq('hotel_id', hotelId),
    ]);
    setRooms(rs || []);
    setRoomTypes(rts || []);
  }

  async function updateStatus(roomId: string, status: string) {
    const { error } = await supabase.from('rooms').update({ status }).eq('id', roomId);
    if (error) toast.error('ไม่สามารถอัพเดตสถานะได้');
    else { toast.success('อัพเดตเรียบร้อย'); load(); }
  }

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar
        title="ห้องพัก"
        description={`${rooms.length} ห้อง · ${roomTypes.length} ประเภท`}
      />

      {/* Room Types Section */}
      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>ประเภทห้อง</CardTitle>
            <CardDescription>กำหนดประเภทห้อง ราคาฐาน และจำนวนผู้พัก</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowRoomTypeModal(true)}>
            <Plus className="h-3.5 w-3.5" /> เพิ่มประเภท
          </Button>
        </CardHeader>
        <CardContent>
          {roomTypes.length === 0 ? (
            <EmptyState
              icon={Bed}
              title="ยังไม่มีประเภทห้อง"
              description="เริ่มจากการสร้างประเภทห้อง เช่น Deluxe, Suite ก่อนแล้วค่อยเพิ่มห้องเฉพาะ"
              action={
                <Button onClick={() => setShowRoomTypeModal(true)}>
                  <Plus className="h-3.5 w-3.5" /> สร้างประเภทแรก
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomTypes.map(rt => (
                <Card key={rt.id} className="border-2 hover:border-accent transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-display text-lg font-medium">{rt.name}</h3>
                      {rt.code && <span className="text-xs text-muted-foreground font-mono">{rt.code}</span>}
                    </div>
                    <div className="text-2xl font-display font-medium ticker mb-3">
                      {formatCurrency(rt.base_rate)}<span className="text-xs text-muted-foreground font-sans font-normal ml-1">/คืน</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {rt.max_occupancy}
                      </span>
                      {rt.size_sqm && (
                        <span className="flex items-center gap-1">
                          <Maximize2 className="h-3 w-3" /> {rt.size_sqm} ตร.ม.
                        </span>
                      )}
                      {rt.bed_type && <span>· {rt.bed_type}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rooms Grid */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>ห้องทั้งหมด</CardTitle>
            <CardDescription>คลิกเพื่อเปลี่ยนสถานะห้อง</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowRoomModal(true)} disabled={roomTypes.length === 0}>
            <Plus className="h-3.5 w-3.5" /> เพิ่มห้อง
          </Button>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <EmptyState
              icon={Bed}
              title="ยังไม่มีห้อง"
              description="เพิ่มห้องเข้าระบบเพื่อเริ่มรับการจอง"
              action={
                roomTypes.length > 0 ? (
                  <Button onClick={() => setShowRoomModal(true)}>
                    <Plus className="h-3.5 w-3.5" /> เพิ่มห้องแรก
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">กรุณาสร้างประเภทห้องก่อน</p>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {rooms.map(r => {
                const config = STATUS_CONFIG[r.status];
                return (
                  <div
                    key={r.id}
                    className="group relative border border-border rounded-xl p-4 hover:border-accent transition-colors bg-card"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-display text-2xl font-medium">{r.room_number}</div>
                        <div className="text-2xs text-muted-foreground">{r.room_types?.name}</div>
                      </div>
                      <Bed className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Badge variant={config?.variant} className="mb-3">{config?.label}</Badge>
                    <select
                      value={r.status}
                      onChange={(e) => setPendingStatus({ roomId: r.id, status: e.target.value, roomNumber: r.room_number })}
                      className="w-full text-xs border border-border rounded px-2 py-1 bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm status change dialog */}
      <Dialog open={!!pendingStatus} onOpenChange={(o) => !o && setPendingStatus(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>เปลี่ยนสถานะห้อง {pendingStatus?.roomNumber}</DialogTitle>
            <DialogDescription>
              เปลี่ยนเป็น &quot;{STATUS_CONFIG[pendingStatus?.status || '']?.label}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingStatus(null)}>ยกเลิก</Button>
            <Button onClick={() => {
              if (pendingStatus) updateStatus(pendingStatus.roomId, pendingStatus.status);
              setPendingStatus(null);
            }}>ยืนยัน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RoomTypeModal
        open={showRoomTypeModal}
        onClose={() => setShowRoomTypeModal(false)}
        hotelId={hotelId}
        onSuccess={() => { setShowRoomTypeModal(false); load(); }}
      />
      <RoomModal
        open={showRoomModal}
        onClose={() => setShowRoomModal(false)}
        hotelId={hotelId}
        roomTypes={roomTypes}
        onSuccess={() => { setShowRoomModal(false); load(); }}
      />
    </div>
  );
}

function RoomTypeModal({ open, onClose, hotelId, onSuccess }: any) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from('room_types').insert({
      hotel_id: hotelId,
      name: fd.get('name'),
      code: fd.get('code'),
      max_occupancy: Number(fd.get('max_occupancy')),
      base_rate: Number(fd.get('base_rate')),
      bed_type: fd.get('bed_type'),
      size_sqm: Number(fd.get('size_sqm')) || null,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success('สร้างประเภทห้องสำเร็จ'); onSuccess(); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>สร้างประเภทห้อง</DialogTitle>
          <DialogDescription>เช่น Deluxe, Suite, Pool Villa</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="name" label="ชื่อประเภท" placeholder="Deluxe Room" required />
          <Input name="code" label="รหัส (optional)" placeholder="DLX" />
          <div className="grid grid-cols-2 gap-3">
            <Input name="max_occupancy" type="number" defaultValue={2} label="จำนวนผู้พักสูงสุด" required />
            <Input name="base_rate" type="number" label="ราคาฐาน (บาท/คืน)" required />
          </div>
          <Select name="bed_type" label="ประเภทเตียง">
            <option value="king">King</option>
            <option value="queen">Queen</option>
            <option value="twin">Twin</option>
            <option value="single">Single</option>
          </Select>
          <Input name="size_sqm" type="number" label="ขนาด (ตร.ม.)" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button type="submit" disabled={loading}>{loading ? 'กำลังสร้าง...' : 'สร้าง'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoomModal({ open, onClose, hotelId, roomTypes, onSuccess }: any) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from('rooms').insert({
      hotel_id: hotelId,
      room_type_id: fd.get('room_type_id'),
      room_number: fd.get('room_number'),
      floor: Number(fd.get('floor')) || null,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success('เพิ่มห้องสำเร็จ'); onSuccess(); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มห้องใหม่</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="room_number" label="หมายเลขห้อง" placeholder="101" required />
          <Select name="room_type_id" label="ประเภทห้อง" required>
            {roomTypes.map((rt: any) => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
          </Select>
          <Input name="floor" type="number" label="ชั้น" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button type="submit" disabled={loading}>{loading ? 'กำลังเพิ่ม...' : 'เพิ่มห้อง'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
