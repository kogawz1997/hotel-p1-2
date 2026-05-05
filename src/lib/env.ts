import { z } from 'zod';

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ANTHROPIC_API_KEY: z.string().min(10).optional(),
  OMISE_PUBLIC_KEY: z.string().optional(),
  OMISE_SECRET_KEY: z.string().optional(),
  OMISE_WEBHOOK_SECRET: z.string().optional(),
  BOOKING_COM_WEBHOOK_TOKEN: z.string().optional(),
  AGODA_WEBHOOK_TOKEN: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_STANDARD: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().optional(),
  BILLING_PROVIDER: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

let cached: z.infer<typeof serverEnvSchema> | null = null;

export function getServerEnv() {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) throw new Error(`Invalid server environment: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
  cached = parsed.data;
  return cached;
}
