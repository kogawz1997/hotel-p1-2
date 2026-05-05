import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, ShieldCheck } from 'lucide-react';

export default function BookingQrPage({ params }: { params: { code: string } }) {
  return <div className="mx-auto max-w-lg px-4 py-10"><Card className="text-center"><CardHeader><div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary"><QrCode className="h-10 w-10 text-accent" /></div><CardTitle>QR Check-in พร้อมใช้งาน</CardTitle><CardDescription>แสดงรหัสนี้ที่เคาน์เตอร์เพื่อให้พนักงานตรวจสอบการจอง</CardDescription></CardHeader><CardContent className="space-y-5"><div className="rounded-2xl border-2 border-dashed border-accent/40 bg-secondary/40 p-8"><div className="text-3xl font-bold tracking-[0.35em] text-accent">{params.code}</div><p className="mt-3 text-xs text-muted-foreground">QR placeholder · รอบต่อไปเสียบ generator จริง</p></div><div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Token verification endpoint prepared</div><Button asChild variant="outline"><Link href="/portal/bookings">กลับไปการจองของฉัน</Link></Button></CardContent></Card></div>;
}
