export type BillingPlan = 'starter' | 'standard' | 'pro' | 'enterprise';
export type BillingStatus = 'trial' | 'trialing' | 'active' | 'past_due' | 'unpaid' | 'cancelled' | 'canceled' | 'suspended' | 'incomplete';

export const BILLING_PLANS: Record<BillingPlan, { name: string; monthly: string; features: string[]; envKey: string }> = {
  starter: {
    name: 'Starter',
    monthly: '฿990/mo',
    envKey: 'STRIPE_PRICE_STARTER',
    features: ['1 property', 'Direct booking', 'Guest portal', 'Basic reports'],
  },
  standard: {
    name: 'Standard',
    monthly: '฿2,990/mo',
    envKey: 'STRIPE_PRICE_STANDARD',
    features: ['Multi-user staff', 'Channel inbox', 'Payment tracking', 'Audit log'],
  },
  pro: {
    name: 'Pro',
    monthly: '฿5,990/mo',
    envKey: 'STRIPE_PRICE_PRO',
    features: ['Automation', 'Advanced reports', 'F&B/Spa prepared', 'Priority support'],
  },
  enterprise: {
    name: 'Enterprise',
    monthly: 'Custom',
    envKey: 'STRIPE_PRICE_ENTERPRISE',
    features: ['Multi-property', 'Custom SLA', 'Dedicated onboarding', 'Custom integrations'],
  },
};

export function normalizeBillingStatus(status?: string | null): BillingStatus {
  if (status === 'canceled') return 'cancelled';
  if (status === 'trialing') return 'trialing';
  if (status === 'active') return 'active';
  if (status === 'past_due') return 'past_due';
  if (status === 'unpaid') return 'unpaid';
  if (status === 'suspended') return 'suspended';
  if (status === 'incomplete') return 'incomplete';
  if (status === 'cancelled') return 'cancelled';
  return 'trial';
}

export function isBillingBlocked(status?: string | null) {
  return ['past_due', 'unpaid', 'suspended', 'cancelled', 'canceled', 'incomplete'].includes(status || '');
}

export function getPriceEnvKey(plan: BillingPlan) {
  return BILLING_PLANS[plan]?.envKey || BILLING_PLANS.starter.envKey;
}
