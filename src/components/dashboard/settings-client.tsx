'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { TopBar } from '@/components/layout/top-bar';
import {
  Building2, Plug, MessageCircle, CreditCard, FileText, Calculator, Globe2, ArrowRight,
  Users, Plus, Trash2, Mail, Shield, AlertCircle, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  owner: 'เจ้าของ', admin: 'ผู้ดูแลระบบ', manager: 'ผู้จัดการ',
  front_desk: 'พนักงานต้อนรับ', housekeeping: 'แม่บ้าน', staff: 'พนักงาน',
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  admin: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  front_desk: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  housekeeping: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
  staff: 'bg-secondary text-muted-foreground',
};

const TABS = [
  { key: 'hotel', label: 'โรงแรม', icon: Building2 },
  { key: 'team', label: 'ทีม', icon: Users },
  { key: 'integrations', label: 'การเชื่อมต่อ', icon: Plug },
];

export function SettingsClient({ hotel, profile }: { hotel: any; profile: any }) {
  const [activeTab, setActiveTab] = useState<'hotel' | 'team' | 'integrations'>('hotel');

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <TopBar title="ตั้งค่า" description="จัดการข้อมูลโรงแรม ทีม และการเชื่อมต่อ" />

      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-accent text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'hotel' && <HotelInfoTab hotel={hotel} />}
      {activeTab === 'team' && <TeamTab profile={profile} />}
      {activeTab === 'integrations' && <IntegrationsTab />}
    </div>
  );
}

// ─── Hotel Info Tab ────────────────────────────────────────────────────────
function HotelInfoTab({ hotel }: { hotel: any }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from('hotels').update({
      name: fd.get('name'),
      type: fd.get('type'),
      address: fd.get('address'),
      city: fd.get('city'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      website: fd.get('website'),
      tax_id: fd.get('tax_id'),
      check_in_time: fd.get('check_in_time'),
      check_out_time: fd.get('check_out_time'),
      currency: fd.get('currency'),
      vat_rate: Number(fd.get('vat_rate')),
    }).eq('id', hotel.id);
    setSaving(false);
    if (error) toast.error('บันทึกไม่สำเร็จ');
    else toast.success('บันทึกเรียบร้อย');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ข้อมูลโรงแรม</CardTitle>
        <CardDescription>ข้อมูลพื้นฐาน ใช้ในใบกำกับและการสื่อสารกับแขก</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="name" label="ชื่อโรงแรม" defaultValue={hotel.name} required />
            <Select name="type" label="ประเภท" defaultValue={hotel.type}>
              <option value="hotel">Hotel</option>
              <option value="hostel">Hostel</option>
              <option value="pool_villa">Pool Villa</option>
              <option value="serviced_apartment">Serviced Apartment</option>
              <option value="resort">Resort</option>
              <option value="boutique">Boutique</option>
            </Select>
          </div>
          <Input name="address" label="ที่อยู่" defaultValue={hotel.address || ''} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="city" label="จังหวัด" defaultValue={hotel.city || ''} />
            <Input name="phone" label="เบอร์โทร" defaultValue={hotel.phone || ''} />
            <Input name="email" type="email" label="อีเมล" defaultValue={hotel.email || ''} />
          </div>
          <Input name="website" label="Website" defaultValue={hotel.website || ''} placeholder="https://..." />
          <Input name="tax_id" label="เลขประจำตัวผู้เสียภาษี" hint="13 หลัก สำหรับใบกำกับภาษี" defaultValue={hotel.tax_id || ''} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="check_in_time" type="time" label="เวลา Check-in" defaultValue={hotel.check_in_time} />
            <Input name="check_out_time" type="time" label="เวลา Check-out" defaultValue={hotel.check_out_time} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="currency" label="สกุลเงิน" defaultValue={hotel.currency} />
            <Input name="vat_rate" type="number" step="0.01" label="VAT Rate" defaultValue={hotel.vat_rate} hint="0.07 = 7%" />
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Team Tab ───────────────────────────────────────────────────────────────
function TeamTab({ profile }: { profile: any }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('front_desk');
  const [inviteError, setInviteError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<any>(null);

  const isOwnerOrAdmin = ['owner', 'admin'].includes(profile?.role);

  async function loadMembers() {
    const res = await fetch('/api/team');
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members || []);
    }
    setLoading(false);
  }

  useEffect(() => { loadMembers(); }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    if (!inviteEmail.trim() || !/\S+@\S+\.\S+/.test(inviteEmail)) {
      setInviteError('กรุณากรอกอีเมลที่ถูกต้อง');
      return;
    }
    setInviting(true);
    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    const data = await res.json();
    setInviting(false);
    if (!res.ok) { setInviteError(data.error || 'ส่งคำเชิญไม่สำเร็จ'); return; }
    toast.success(`ส่งคำเชิญไปที่ ${inviteEmail} แล้ว`);
    setShowInvite(false);
    setInviteEmail('');
    setInviteRole('front_desk');
    loadMembers();
  }

  async function updateRole(userId: string, role: string) {
    const res = await fetch('/api/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) { toast.success('อัพเดต role แล้ว'); loadMembers(); }
    else { const d = await res.json(); toast.error(d.error || 'ไม่สามารถอัพเดตได้'); }
  }

  async function deactivate(userId: string) {
    const res = await fetch('/api/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, active: false }),
    });
    if (res.ok) { toast.success('ปิดการใช้งานแล้ว'); setConfirmRemove(null); loadMembers(); }
    else { const d = await res.json(); toast.error(d.error || 'ไม่สามารถลบได้'); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>ทีมงาน</CardTitle>
            <CardDescription>จัดการสิทธิ์และเชิญพนักงานเข้าร่วมระบบ</CardDescription>
          </div>
          {isOwnerOrAdmin && (
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <Plus className="h-3.5 w-3.5" /> เชิญพนักงาน
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {members.map(m => (
                <div key={m.id} className={cn('flex items-center gap-4 px-6 py-4', !m.active && 'opacity-50')}>
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                    {(m.full_name || m.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{m.full_name || m.email}</span>
                      {!m.active && <span className="text-2xs text-muted-foreground">(ปิดใช้งาน)</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">{m.email}</span>
                    </div>
                  </div>

                  {/* Role badge / selector */}
                  {isOwnerOrAdmin && m.role !== 'owner' && m.id !== profile?.id ? (
                    <select
                      value={m.role}
                      onChange={e => updateRole(m.id, e.target.value)}
                      className="text-xs border border-border rounded-lg px-2 py-1.5 bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner').map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={cn('text-2xs px-2 py-1 rounded-md font-medium', ROLE_COLORS[m.role])}>
                      {ROLE_LABELS[m.role] || m.role}
                    </span>
                  )}

                  {isOwnerOrAdmin && m.role !== 'owner' && m.id !== profile?.id && m.active && (
                    <button
                      onClick={() => setConfirmRemove(m)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                      title="ปิดการใช้งาน"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role permissions reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" /> สิทธิ์แต่ละ Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">สิทธิ์</th>
                  {['owner','admin','manager','front_desk','housekeeping','staff'].map(r => (
                    <th key={r} className="text-center py-2 px-2 text-muted-foreground font-medium">{ROLE_LABELS[r]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {[
                  { label: 'จัดการการจอง', roles: ['owner','admin','manager','front_desk'] },
                  { label: 'จัดการห้อง', roles: ['owner','admin','manager','front_desk'] },
                  { label: 'ดู/ตอบ Inbox', roles: ['owner','admin','manager','front_desk'] },
                  { label: 'งานแม่บ้าน', roles: ['owner','admin','manager','front_desk','housekeeping'] },
                  { label: 'ดูรายงาน', roles: ['owner','admin','manager'] },
                  { label: 'จัดการบัญชี', roles: ['owner','admin','manager'] },
                  { label: 'ตั้งค่าระบบ', roles: ['owner','admin'] },
                  { label: 'จัดการทีม', roles: ['owner','admin'] },
                  { label: 'Billing', roles: ['owner'] },
                ].map(row => (
                  <tr key={row.label}>
                    <td className="py-2 pr-4 text-muted-foreground">{row.label}</td>
                    {['owner','admin','manager','front_desk','housekeeping','staff'].map(r => (
                      <td key={r} className="text-center py-2 px-2">
                        {row.roles.includes(r)
                          ? <Check className="h-3.5 w-3.5 text-emerald-600 mx-auto" />
                          : <span className="text-muted-foreground/30">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invite modal */}
      <Dialog open={showInvite} onOpenChange={(o) => !o && setShowInvite(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>เชิญพนักงาน</DialogTitle>
            <DialogDescription>ส่งลิงก์เชิญทางอีเมล พนักงานจะตั้งรหัสผ่านเองได้</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">อีเมล *</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => { setInviteEmail(e.target.value); setInviteError(''); }}
                placeholder="staff@hotel.com"
                className={cn(
                  'w-full px-3 py-2 bg-secondary border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                  inviteError ? 'border-destructive' : 'border-0'
                )}
              />
              {inviteError && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {inviteError}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner').map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>ยกเลิก</Button>
              <Button type="submit" disabled={inviting}>
                {inviting ? 'กำลังส่ง...' : 'ส่งคำเชิญ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm deactivate */}
      <Dialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ปิดการใช้งาน {confirmRemove?.full_name || confirmRemove?.email}?</DialogTitle>
            <DialogDescription>พนักงานจะไม่สามารถเข้าสู่ระบบได้ แต่ข้อมูลยังถูกเก็บไว้</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={() => deactivate(confirmRemove?.id)}>ปิดการใช้งาน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Integrations Tab ───────────────────────────────────────────────────────
function IntegrationsTab() {
  const integrations = [
    { name: 'LINE Official Account', description: 'รับ-ส่งข้อความผ่าน LINE OA', icon: MessageCircle, status: 'pending' },
    { name: 'WhatsApp Business', description: 'รับข้อความแขกชาวต่างชาติ', icon: MessageCircle, status: 'pending' },
    { name: 'Channel Manager', description: 'Sync OTA (Booking, Agoda, Airbnb)', icon: Globe2, status: 'pending' },
    { name: 'Omise Payment', description: 'รับชำระเงิน PromptPay/บัตรเครดิต', icon: CreditCard, status: 'pending' },
    { name: 'e-Tax Invoice', description: 'ออกใบกำกับภาษีอิเล็กทรอนิกส์', icon: FileText, status: 'pending' },
    { name: 'PEAK / FlowAccount', description: 'เชื่อมระบบบัญชี', icon: Calculator, status: 'pending' },
  ];
  return (
    <div className="space-y-3">
      {integrations.map(i => {
        const Icon = i.icon;
        return (
          <Card key={i.name}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium">{i.name}</span>
                  <Badge variant="outline" className="text-2xs">ยังไม่ได้ตั้งค่า</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{i.description}</p>
              </div>
              <Button size="sm" variant="outline">ตั้งค่า <ArrowRight className="h-3.5 w-3.5" /></Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
