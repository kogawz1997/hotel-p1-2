import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // DB check
  try {
    const admin = createAdminClient();
    const t0 = Date.now();
    const { error } = await admin.from('organizations').select('id').limit(1);
    checks.database = { ok: !error, latencyMs: Date.now() - t0 };
    if (error) checks.database.error = 'DB query failed';
  } catch (e: any) {
    checks.database = { ok: false, error: e.message };
  }

  // Env vars check (existence only — no values exposed)
  const requiredEnvs = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY'];
  const missingEnvs = requiredEnvs.filter(k => !process.env[k]);
  checks.environment = {
    ok: missingEnvs.length === 0,
    error: missingEnvs.length ? `Missing: ${missingEnvs.join(', ')}` : undefined,
  };

  // Anthropic API check (lightweight — no actual call)
  checks.ai = {
    ok: !!process.env.ANTHROPIC_API_KEY,
    error: !process.env.ANTHROPIC_API_KEY ? 'ANTHROPIC_API_KEY not set' : undefined,
  };

  // Payment gateway check
  checks.payment = {
    ok: !!process.env.OMISE_SECRET_KEY,
    error: !process.env.OMISE_SECRET_KEY ? 'OMISE_SECRET_KEY not set' : undefined,
  };

  const allOk = Object.values(checks).every(c => c.ok);
  const totalMs = Date.now() - start;

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      version: process.env.npm_package_version || '0.1.0',
      timestamp: new Date().toISOString(),
      totalMs,
      checks,
    },
    {
      status: allOk ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
