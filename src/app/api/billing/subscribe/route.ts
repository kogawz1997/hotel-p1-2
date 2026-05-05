import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/guards';
import { BILLING_PLANS, type BillingPlan } from '@/lib/billing/plans';
import { configuredStripePrice, createStripeCheckoutSession, isStripeConfigured } from '@/lib/billing/stripe';
import { getServerEnv } from '@/lib/env';
import { writeAuditLog } from '@/lib/audit';

const schema = z.object({ plan: z.enum(['starter', 'standard', 'pro', 'enterprise']).default('starter') });

export async function GET() {
  return NextResponse.json({
    status: isStripeConfigured() ? 'configured' : 'prepared',
    provider: 'stripe',
    plans: BILLING_PLANS,
    next: isStripeConfigured() ? ['Create Stripe price ids in env', 'POST with selected plan'] : ['Add STRIPE_SECRET_KEY', 'Add STRIPE_PRICE_* env vars', 'Redeploy'],
  });
}

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const plan = parsed.data.plan as BillingPlan;
  const env = getServerEnv();
  const appUrl = env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';

  if (!isStripeConfigured()) {
    return NextResponse.json({
      status: 'prepared',
      message: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_PRICE_* to Vercel, then redeploy.',
      plan,
    }, { status: 202 });
  }

  const priceId = configuredStripePrice(plan);
  if (!priceId) {
    return NextResponse.json({ error: `Missing Stripe price env for ${plan}` }, { status: 400 });
  }

  const { data: org } = await ctx.supabase
    .from('organizations')
    .select('id, name, billing_email, stripe_customer_id')
    .eq('id', ctx.profile.organization_id)
    .single();

  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  const session = await createStripeCheckoutSession({
    plan,
    priceId,
    organizationId: org.id,
    customerEmail: org.billing_email || ctx.user.email,
    customerId: org.stripe_customer_id,
    successUrl: `${appUrl}/dashboard/billing?checkout=success`,
    cancelUrl: `${appUrl}/dashboard/billing?checkout=cancelled`,
  });

  await writeAuditLog(ctx.supabase, {
    organizationId: org.id,
    userId: ctx.user.id,
    action: 'billing.checkout_created',
    entityType: 'organization',
    entityId: org.id,
    after: { plan, sessionId: session.id },
    request,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
