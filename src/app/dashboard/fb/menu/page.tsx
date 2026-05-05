import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TopBar } from '@/components/layout/top-bar';
import { CheckCircle2, ExternalLink, KeyRound, Lock, Settings2, AlertTriangle } from 'lucide-react';

const items = [{"title": "Menu Catalog", "description": "เตรียมหมวดหมู่ เมนู ราคา ภาษี และตัวเลือกเสริม", "keys": ["SUPABASE_SERVICE_ROLE_KEY"], "href": "https://supabase.com/dashboard"}];

export default function FBMenuPage() {
  return (
    <div className="container max-w-6xl py-8 animate-fade-in">
      <TopBar title="F&B Menu" description="หน้าเตรียมจัดการเมนูอาหาร เครื่องดื่ม ราคา รูป และ availability" />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <Card className="border-accent/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="warning">Prepared</Badge>
              <Badge variant="outline">Requires external signup / verification</Badge>
            </div>
            <CardTitle>ระบบเตรียมไว้พร้อมเสียบของจริงแล้ว</CardTitle>
            <CardDescription>หน้านี้ไม่บังคับใช้ API key ตอน build เพื่อให้ deploy ผ่านก่อน แล้วค่อยกลับมาใส่ key จริงใน Vercel Environment Variables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /><h3 className="font-medium">{item.title}</h3></div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">{item.keys.map((key) => <code key={key} className="rounded bg-secondary px-2 py-1 text-xs">{key}</code>)}</div>
                  </div>
                  <Button asChild variant="outline" size="sm"><Link href={item.href} target="_blank">สมัคร/ยืนยัน <ExternalLink className="h-3.5 w-3.5" /></Link></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> ขั้นตอนเปิดใช้งานจริง</CardTitle><CardDescription>เอาไว้กันลืม เพราะโลกนี้มี env เยอะกว่าความสุข</CardDescription></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Step icon={KeyRound} title="1. สมัครบริการภายนอก" text="สร้าง account และคัดลอก API key / webhook secret จาก provider" />
            <Step icon={Lock} title="2. ใส่ใน Vercel Environment Variables" text="Production, Preview, Development ใส่ให้ครบตาม key ที่แสดงด้านซ้าย" />
            <Step icon={AlertTriangle} title="3. Redeploy" text="หลังเพิ่ม key ต้อง redeploy ใหม่ ไม่งั้น runtime ยังใช้ค่าเก่า เหมือนตู้เย็นที่เสียแต่คนยังเสียบปลั๊กอยู่" />
            <Step icon={CheckCircle2} title="4. กดทดสอบใน System & Integrations" text="เมนูระบบมีพื้นที่เช็คสถานะและเปิดปิด feature flag เตรียมไว้แล้ว" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
function Step({ icon: Icon, title, text }: { icon: any; title: string; text: string }) { return <div className="flex gap-3 rounded-lg border border-border p-3"><Icon className="mt-0.5 h-4 w-4 text-accent" /><div><div className="font-medium">{title}</div><p className="text-muted-foreground">{text}</p></div></div>; }
