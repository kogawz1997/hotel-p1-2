import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { readWebhookToken, verifyBearerOrHeaderToken } from '@/lib/security/webhook';
import { rateLimit } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  const body = await request.text();
  const limited = rateLimit(request, 'webhooks.booking_com_webhook_token', 120, 60_000);
  if (limited) return limited;

  const token = readWebhookToken(request);
  const expected = process.env.BOOKING_COM_WEBHOOK_TOKEN;

  if (process.env.NODE_ENV === 'production' && !verifyBearerOrHeaderToken(token, expected)) {
    return NextResponse.json({ error: 'Booking.com webhook is not configured' }, { status: 501 });
  }

  const supabase = createAdminClient();
  await supabase.from('channel_sync_log').insert({
    sync_type: 'booking_pull',
    status: expected ? 'received_unparsed' : 'staged_not_configured',
    records_processed: 0,
    errors: expected ? null : { reason: 'BOOKING_COM_WEBHOOK_TOKEN missing or partner parser not connected', sampleBytes: body.length },
  });

  return new Response('<?xml version="1.0"?><response status="received" mode="staged"/>', {
    headers: { 'Content-Type': 'application/xml' },
    status: expected ? 202 : 501,
  });
}
