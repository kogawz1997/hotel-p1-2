import { NextResponse } from 'next/server';
import { z } from 'zod';
import { translateText, detectLanguage, type Language } from '@/lib/ai';
import { parseJson } from '@/lib/http/validation';
import { requireUser } from '@/lib/auth/guards';
import { rateLimit } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  conversationId: z.string().uuid(),
  text: z.string().trim().min(1).max(4000),
  fromAISuggestion: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const limited = rateLimit(request, 'ai.send-message', 40, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;

  const { conversationId, text, fromAISuggestion } = parsed.data;

  const ctx = await requireUser();
  if (ctx.error) return ctx.error;

  if (!ctx.profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  const supabase = ctx.supabase;

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('*, hotels(organization_id)')
    .eq('id', conversationId)
    .single();

  if (conversationError || !conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (conversation.hotels?.organization_id !== ctx.profile.organization_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const guestLang = (conversation.guest_language || 'en') as Language;
  const sourceLang = detectLanguage(text) as Language;

  let translatedText = text;

  if (sourceLang !== guestLang) {
    const result = await translateText({
      text,
      fromLang: sourceLang,
      toLang: guestLang,
      context: 'staff_reply',
    });

    translatedText = result.translated;
  }

  let channelMessageId = '';
  let status = 'sent';

  try {
    const { getChannel } = await import('@/lib/channels');

    const adapter = getChannel(conversation.channel);

    const result = await adapter.sendMessage({
      channelUserId: conversation.channel_user_id,
      text: translatedText,
    });

    channelMessageId = result.messageId;
    status = result.status;
  } catch (e) {
    console.error('Channel send error:', e);
    status = 'failed';
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      direction: 'outbound',
      sender_type: fromAISuggestion ? 'ai' : 'staff',
      sender_id: ctx.user!.id,
      original_text: translatedText,
      original_language: guestLang,
      translated_text: text,
      message_type: 'text',
      channel_message_id: channelMessageId,
      status,
      ai_generated: !!fromAISuggestion,
      ai_reviewed_by: fromAISuggestion ? ctx.user!.id : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message,
  });
}