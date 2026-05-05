import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TopBar } from '@/components/layout/top-bar';
import { BILLING_PLANS, type BillingPlan, normalizeBillingStatus } from '@/lib/billing/plans';
import { createClient } from '@/lib/supabase/server';
import { BillingActions } from '@/components/billing/billing-actions';
import { CheckCircle2, AlertTriangle, CreditCard, ShieldCheck } from 'lucide-react';

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let org: any = null;
  if (user) {
    const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
    if (profile?.organization_id) {
      const { data } = await supabase
        .from('organizations')
        .select('id,name,subscription_plan,subscription_status,trial_ends_at,current_period_end,billing_email,stripe_customer_id,stripe_subscription_id,suspended_reason')
        .eq('id', profile.organization_id)
        .single();
      org = data;
    }
  }
  const status = normalizeBillingStatus(org?.subscription_status);
  const statusVariant = status === 'active' || status === 'trialing' || status === 'trial' ? 'success' : status === 'past_due' || status === 'unpaid' ? 'warning' : 'destructive';

  return (
    <div className="container max-w-6xl py-8 animate-fade-in">
      <TopBar title="Billing & Subscription" description="Phase 2: เก็บเงิน, webhook, suspend tenant และ customer portal สำหรับ SaaS จริง" />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="border-accent/30">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant as any}>{status}</Badge>
              <Badge variant="outline">{org?.subscription_plan || 'starter'}</Badge>
              {org?.stripe_customer_id ? <Badge variant="success">Stripe linked</Badge> : <Badge variant="warning">Stripe not linked</Badge>}
            </div>
            <CardTitle>{org?.name || 'Organization billing'}</CardTitle>
            <CardDescription>สถานะนี้ใช้ตัดสินว่า tenant ใช้งานต่อได้ไหม ถ้า webhook แจ้งจ่ายเงินพลาดจะเปลี่ยนเป็น past_due/suspended</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Trial ends" value={org?.trial_ends_at ? new Date(org.trial_ends_at).toLocaleDateString() : '-'} />
            <Info label="Current period end" value={org?.current_period_end ? new Date(org.current_period_end).toLocaleDateString() : '-'} />
            <Info label="Billing email" value={org?.billing_email || user?.email || '-'} />
            <Info label="Suspend reason" value={org?.suspended_reason || '-'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Production readiness</CardTitle>
            <CardDescription>ถ้ายังไม่ใส่ Stripe key ปุ่มจะตอบว่า prepared ไม่พัง build เหมือนกับดักโบราณ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Step ok text="/api/billing/subscribe creates Stripe Checkout when key/price env exists" />
            <Step ok text="/api/billing/portal opens customer portal when customer exists" />
            <Step ok text="/api/webhooks/stripe handles invoice.paid / invoice.payment_failed / subscription.deleted" />
            <Step ok text="organizations now store Stripe customer/subscription/status/suspend reason" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(Object.entries(BILLING_PLANS) as [BillingPlan, typeof BILLING_PLANS[BillingPlan]][]).map(([key, plan]) => (
          <Card key={key} className={org?.subscription_plan === key ? 'border-accent' : undefined}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {org?.subscription_plan === key && <Badge variant="accent">Current</Badge>}
              </div>
              <CardDescription>{plan.monthly}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {plan.features.map((feature) => <li key={feature} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> {feature}</li>)}
              </ul>
              <BillingActions plan={key} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-amber-200 bg-amber-50/60 dark:bg-amber-950/20">
        <CardContent className="flex gap-3 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
          <div><b>ต้องทำเอง:</b> สร้าง Stripe products/prices, ใส่ STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_* ใน Vercel แล้วตั้ง webhook URL ไปที่ /api/webhooks/stripe</div>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-secondary/30 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 font-medium">{value}</div></div>;
}

function Step({ ok, text }: { ok?: boolean; text: string }) {
  return <div className="flex gap-2"><CreditCard className="mt-0.5 h-4 w-4 text-accent" /> <span>{text}</span></div>;
}
