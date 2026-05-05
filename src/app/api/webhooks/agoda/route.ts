import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { readWebhookToken, verifyBearerOrHeaderToken } from '@/lib/security/webhook';
import { rateLimit } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const limited = rateLimit(request, 'webhooks.agoda_webhook_token', 120, 60_000);
  if (limited) return limited;

  const token = readWebhookToken(request);
  const expected = process.env.AGODA_WEBHOOK_TOKEN;

  if (process.env.NODE_ENV === 'production' && !verifyBearerOrHeaderToken(token, expected)) {
    return NextResponse.json({ error: 'Agoda webhook is not configured' }, { status: 501 });
  }

  let payload: any = null;
  try { payload = JSON.parse(rawBody); } catch {}

  const supabase = createAdminClient();
  await supabase.from('channel_sync_log').insert({
    sync_type: 'booking_pull',
    status: expected ? 'received_unparsed' : 'staged_not_configured',
    records_processed: 0,
    errors: expected ? null : { reason: 'AGODA_WEBHOOK_TOKEN missing or YCS parser not connected', payloadPreview: payload ? Object.keys(payload) : [] },
  });

  return NextResponse.json({ status: expected ? 'received' : 'not_configured', mode: 'staged' }, { status: expected ? 202 : 501 });
}
