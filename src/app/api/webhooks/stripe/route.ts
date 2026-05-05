import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getServerEnv } from '@/lib/env';
import { verifyStripeWebhook } from '@/lib/billing/stripe';

function statusFromStripe(status?: string) {
  if (status === 'active') return 'active';
  if (status === 'trialing') return 'trialing';
  if (status === 'past_due') return 'past_due';
  if (status === 'unpaid') return 'unpaid';
  if (status === 'canceled') return 'cancelled';
  if (status === 'incomplete') return 'incomplete';
  return null;
}

async function findOrgId(event: any) {
  const obj = event?.data?.object || {};
  return (
    obj?.metadata?.organization_id ||
    obj?.client_reference_id ||
    obj?.subscription_details?.metadata?.organization_id ||
    null
  );
}

export async function GET() {
  return NextResponse.json({
    status: 'prepared',
    message:
      'Stripe webhook endpoint is ready. Configure it in Stripe Dashboard and set STRIPE_WEBHOOK_SECRET.',
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const env = getServerEnv();

  // ✅ FIX TYPE ERROR ตรงนี้
  if (env.STRIPE_WEBHOOK_SECRET) {
    const verification = verifyStripeWebhook(
      rawBody,
      request.headers.get('stripe-signature')
    );

    if (!verification.ok) {
      const message =
        'error' in verification
          ? verification.error
          : 'Invalid Stripe webhook signature';

      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const event = JSON.parse(rawBody || '{}');
  const admin = createAdminClient();
  const orgId = await findOrgId(event);
  const obj = event?.data?.object || {};

  await admin.from('subscription_events').upsert(
    {
      organization_id: orgId,
      provider: 'stripe',
      provider_event_id: event.id,
      event_type: event.type || 'unknown',
      payload: event,
    },
    { onConflict: 'provider_event_id' }
  );

  const update: Record<string, any> = {};

  if (event.type === 'checkout.session.completed') {
    update.stripe_customer_id = obj.customer;
    update.stripe_subscription_id = obj.subscription;
    update.subscription_status = 'active';
    update.billing_email =
      obj.customer_details?.email || obj.customer_email || null;
    update.subscription_plan = obj.metadata?.plan || undefined;
    update.suspended_at = null;
    update.suspended_reason = null;
  }

  if (event.type === 'customer.subscription.updated') {
    const status = statusFromStripe(obj.status);
    if (status) update.subscription_status = status;

    update.stripe_subscription_id = obj.id;
    update.stripe_customer_id = obj.customer;

    if (obj.current_period_end) {
      update.current_period_end = new Date(
        obj.current_period_end * 1000
      ).toISOString();
    }

    if (obj.metadata?.plan) {
      update.subscription_plan = obj.metadata.plan;
    }

    if (status === 'active' || status === 'trialing') {
      update.suspended_at = null;
      update.suspended_reason = null;
    }
  }

  if (event.type === 'invoice.paid') {
    update.subscription_status = 'active';
    update.stripe_customer_id = obj.customer;
    update.stripe_subscription_id = obj.subscription;
    update.suspended_at = null;
    update.suspended_reason = null;
  }

  if (event.type === 'invoice.payment_failed') {
    update.subscription_status = 'past_due';
    update.stripe_customer_id = obj.customer;
    update.stripe_subscription_id = obj.subscription;
    update.suspended_reason = 'invoice.payment_failed';
  }

  if (event.type === 'customer.subscription.deleted') {
    update.subscription_status = 'suspended';
    update.stripe_subscription_id = obj.id;
    update.stripe_customer_id = obj.customer;
    update.suspended_at = new Date().toISOString();
    update.suspended_reason = 'subscription.deleted';
  }

  if (Object.keys(update).length > 0) {
    let query = admin.from('organizations').update(update);

    if (orgId) {
      query = query.eq('id', orgId);
    } else if (update.stripe_customer_id) {
      query = query.eq(
        'stripe_customer_id',
        update.stripe_customer_id
      );
    } else if (update.stripe_subscription_id) {
      query = query.eq(
        'stripe_subscription_id',
        update.stripe_subscription_id
      );
    }

    await query;
  }

  return NextResponse.json({ received: true });
}