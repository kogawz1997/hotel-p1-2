import { NextResponse } from 'next/server';
import { whatsappAdapter, verifyWebhookChallenge } from '@/lib/channels/whatsapp';
import { createAdminClient } from '@/lib/supabase/server';
import { translateText, detectLanguage, type Language } from '@/lib/ai';

// GET = verification challenge from Meta
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (verifyWebhookChallenge(mode || '', token || '')) {
    return new Response(challenge || '', { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  const bodyText = await request.text();
  const signature = request.headers.get('x-hub-signature-256') || '';

  if (process.env.WHATSAPP_APP_SECRET && !whatsappAdapter.verifyWebhook(bodyText, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const body = JSON.parse(bodyText);
  const messages = await whatsappAdapter.parseWebhook(body, {});

  const supabase = createAdminClient();
  const phoneId = body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

  const { data: connection } = await supabase
    .from('channel_connections')
    .select('hotel_id')
    .eq('channel', 'whatsapp')
    .eq('external_property_id', phoneId)
    .single();

  let hotelId = connection?.hotel_id;
  if (!hotelId) {
    const { data: hotels } = await supabase.from('hotels').select('id').limit(1);
    hotelId = hotels?.[0]?.id;
  }
  if (!hotelId) return NextResponse.json({ error: 'No hotel' }, { status: 400 });

  for (const msg of messages) {
    let { data: conversation } = await supabase
      .from('conversations')
      .select('id, guest_language')
      .eq('hotel_id', hotelId)
      .eq('channel', 'whatsapp')
      .eq('channel_user_id', msg.channelUserId)
      .single();

    if (!conversation) {
      const detectedLang = detectLanguage(msg.text);
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          hotel_id: hotelId,
          channel: 'whatsapp',
          channel_user_id: msg.channelUserId,
          guest_name: msg.metadata?.contactName || msg.channelUserId,
          guest_language: detectedLang,
          status: 'open',
        })
        .select('id, guest_language')
        .single();
      conversation = newConv;
    }

    if (!conversation) continue;

    const lang = (conversation.guest_language || 'en') as Language;
    let translatedText = msg.text;
    if (lang !== 'th' && msg.type === 'text') {
      try {
        const result = await translateText({ text: msg.text, fromLang: lang, toLang: 'th', context: 'guest_inquiry' });
        translatedText = result.translated;
      } catch {}
    }

    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      direction: 'inbound',
      sender_type: 'guest',
      original_text: msg.text,
      original_language: lang,
      translated_text: translatedText,
      message_type: msg.type,
      media_url: msg.mediaUrl,
      channel_message_id: msg.channelMessageId,
      status: 'delivered',
    });
  }

  return NextResponse.json({ success: true });
}
