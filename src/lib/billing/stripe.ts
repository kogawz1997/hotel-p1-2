import crypto from 'crypto';
import { getServerEnv } from '@/lib/env';
import type { BillingPlan } from '@/lib/billing/plans';
import { getPriceEnvKey } from '@/lib/billing/plans';

type StripeFormValue = string | number | boolean | null | undefined;

function stripeSecret() {
  return getServerEnv().STRIPE_SECRET_KEY || '';
}

export function isStripeConfigured() {
  return Boolean(getServerEnv().STRIPE_SECRET_KEY);
}

export function configuredStripePrice(plan: BillingPlan) {
  const env = getServerEnv() as any;
  return env[getPriceEnvKey(plan)] as string | undefined;
}

async function stripeRequest(path: string, body: Record<string, StripeFormValue>) {
  const key = stripeSecret();
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  const params = new URLSearchParams();
  Object.entries(body).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.append(k, String(v));
  });
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `Stripe request failed: ${res.status}`);
  return json;
}

export async function createStripeCheckoutSession(input: {
  plan: BillingPlan;
  priceId: string;
  organizationId: string;
  customerEmail?: string | null;
  customerId?: string | null;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripeRequest('/checkout/sessions', {
    mode: 'subscription',
    'line_items[0][price]': input.priceId,
    'line_items[0][quantity]': 1,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer: input.customerId || undefined,
    customer_email: input.customerId ? undefined : input.customerEmail || undefined,
    client_reference_id: input.organizationId,
    'metadata[organization_id]': input.organizationId,
    'metadata[plan]': input.plan,
    'subscription_data[metadata][organization_id]': input.organizationId,
    'subscription_data[metadata][plan]': input.plan,
  });
}

export async function createStripePortalSession(input: { customerId: string; returnUrl: string }) {
  return stripeRequest('/billing_portal/sessions', {
    customer: input.customerId,
    return_url: input.returnUrl,
  });
}

export function verifyStripeWebhook(rawBody: string, signature: string | null): { ok: true } | { ok: false; error: string } {
  const secret = getServerEnv().STRIPE_WEBHOOK_SECRET;
  if (!secret) return { ok: false, error: 'STRIPE_WEBHOOK_SECRET is not configured' };
  if (!signature) return { ok: false, error: 'Missing Stripe signature' };
  const parts = Object.fromEntries(signature.split(',').map(part => {
    const [key, ...rest] = part.split('=');
    return [key, rest.join('=')];
  }));
  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return { ok: false, error: 'Invalid Stripe signature format' };
  const payload = `${timestamp}.${rawBody}`;
  const digest = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (digest.length !== expected.length) return { ok: false, error: 'Invalid Stripe signature' };
  const valid = crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(expected));
  return valid ? { ok: true } : { ok: false, error: 'Invalid Stripe signature' };
}
