import { Card, CardContent } from '@/components/ui/card';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Coffee, Wine, Hotel, ArrowRight } from 'lucide-react';

export default async function FBPage() {
  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="Food & Beverage" description="ร้านอาหาร บาร์ และรูมเซอร์วิส" />

      <Card className="mb-6 border-accent/30">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="h-8 w-8 text-accent" />
            </div>
            <div className="flex-1">
              <span className="text-2xs uppercase tracking-widest text-accent">Phase 2 · Coming Q3 2026</span>
              <h2 className="font-display text-2xl font-medium tracking-tight mt-2 mb-3">
                Restaurant POS ครบเครื่อง
              </h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Database schema พร้อมแล้ว — outlets, menu items, orders, KOT/BOT
                รองรับ multiple outlets, charge to room, split bill, และ tab management
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mb-6">
                <Feature icon={Coffee} label="Restaurant" />
                <Feature icon={Wine} label="Bar / Lounge" />
                <Feature icon={Hotel} label="Room Service" />
              </div>
              <Button variant="outline" size="sm">
                ดู roadmap <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium text-sm mb-3">วิธีใช้งานชั่วคราว</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>บันทึกค่าอาหาร/เครื่องดื่มเป็น <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">folio_items</code> ใน folio ของแขก</li>
            <li>เมื่อ check-out ระบบจะรวมค่าอาหารกับค่าห้องในใบกำกับเดียว</li>
            <li>ใช้ POS ชั่วคราว เช่น Loyverse / FoodStory แล้วบันทึก manual</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function Feature({ icon: Icon, label }: any) {
  return (
    <div className="p-3 border border-border rounded-lg flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
