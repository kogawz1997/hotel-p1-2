import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

export async function parseJson<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      data: null,
      error: NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      ),
    };
  }
  return { data: parsed.data, error: null };
}

/** Sanitize DB errors — never send raw Postgres messages to clients */
export function dbError(error: any, status = 500): NextResponse {
  // Unique constraint — tell user without exposing column names
  if (error?.code === '23505') {
    return NextResponse.json({ error: 'A record with these details already exists' }, { status: 409 });
  }
  // Foreign key — safe to say "not found"
  if (error?.code === '23503') {
    return NextResponse.json({ error: 'Referenced record not found' }, { status: 400 });
  }
  // Log full error server-side only
  console.error('[DB Error]', error?.code, error?.message);
  return NextResponse.json({ error: 'An unexpected error occurred' }, { status });
}
