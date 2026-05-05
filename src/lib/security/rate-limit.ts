import { NextResponse } from 'next/server';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function getIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}

export function rateLimit(request: Request, key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const id = `${key}:${getIp(request)}`;
  const current = buckets.get(id);
  if (!current || current.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    return null;
  }
  current.count += 1;
  if (current.count > limit) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    return NextResponse.json({ error: 'Too many requests', retryAfter }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }
  return null;
}

export function requireProductionSecret(name: string) {
  const value = process.env[name];
  if (process.env.NODE_ENV === 'production' && !value) {
    return NextResponse.json({ error: `${name} is not configured` }, { status: 503 });
  }
  return null;
}
