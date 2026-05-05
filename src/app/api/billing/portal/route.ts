import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { createStripePortalSession, isStripeConfigured } from '@/lib/billing/stripe';
import { getServerEnv } from '@/lib/env';

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  const env = getServerEnv();
  const appUrl = env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';

  const { data: org } = await ctx.supabase
    .from('organizations')
    .select('id, stripe_customer_id')
    .eq('id', ctx.profile.organization_id)
    .single();

  if (!org?.stripe_customer_id) {
    return NextResponse.json({ status: 'prepared', message: 'No Stripe customer yet. Subscribe first or add customer id after migration.' }, { status: 202 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ status: 'prepared', message: 'STRIPE_SECRET_KEY is missing.' }, { status: 202 });
  }

  const session = await createStripePortalSession({
    customerId: org.stripe_customer_id,
    returnUrl: `${appUrl}/dashboard/billing`,
  });
  return NextResponse.json({ url: session.url });
}
