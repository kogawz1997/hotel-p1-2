'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { BillingPlan } from '@/lib/billing/plans';

export function BillingActions({ plan }: { plan: BillingPlan }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function subscribe() {
    setLoading(`subscribe-${plan}`);
    const res = await fetch('/api/billing/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(null);
    if (json.url) {
      window.location.href = json.url;
      return;
    }
    if (!res.ok) { toast.error(json.error || 'เปิด checkout ไม่สำเร็จ'); return; }
    toast.info(json.message || 'Billing endpoint prepared. ใส่ Stripe key แล้วค่อยเปิดใช้งานจริง');
  }

  async function portal() {
    setLoading('portal');
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const json = await res.json().catch(() => ({}));
    setLoading(null);
    if (json.url) {
      window.location.href = json.url;
      return;
    }
    if (!res.ok) { toast.error(json.error || 'เปิด billing portal ไม่สำเร็จ'); return; }
    toast.info(json.message || 'ยังไม่มี Stripe customer');
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={subscribe} disabled={!!loading} size="sm" variant="accent">
        {loading === `subscribe-${plan}` ? 'กำลังเปิด...' : 'Subscribe'}
      </Button>
      <Button onClick={portal} disabled={!!loading} size="sm" variant="outline">
        {loading === 'portal' ? 'กำลังเปิด...' : 'Customer portal'}
      </Button>
    </div>
  );
}
