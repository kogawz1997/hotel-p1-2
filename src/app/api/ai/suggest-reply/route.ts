import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateGuestReply, translateText, type Language } from '@/lib/ai';
import { parseJson } from '@/lib/http/validation';
import { requireUser } from '@/lib/auth/guards';
import { rateLimit } from '@/lib/security/rate-limit';

const schema = z.object({ conversationId: z.string().uuid() });

export async function POST(request: Request) {
  const limited = rateLimit(request, 'ai.suggest-reply', 25, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;
  const { conversationId } = parsed.data;

  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  if (!ctx.profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }
  const supabase = ctx.supabase;

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, hotels(name, organization_id, check_in_time, check_out_time, address)')
    .eq('id', conversationId)
    .single();

  if (!conversation || conversation.hotels?.organization_id !== ctx.profile.organization_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('direction, sender_type, original_text, original_language')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20);

  const history = (messages || []).map((m: any) => ({
    role: m.sender_type === 'guest' ? 'guest' as const : 'staff' as const,
    text: m.original_text || '',
  }));

  const { data: knowledge } = await supabase
    .from('knowledge_base')
    .select('title, content')
    .eq('hotel_id', conversation.hotel_id)
    .eq('active', true)
    .limit(10);

  const result = await generateGuestReply({
    conversationHistory: history,
    guestLanguage: (conversation.guest_language || 'en') as Language,
    hotelInfo: {
      name: conversation.hotels.name,
      checkInTime: conversation.hotels.check_in_time,
      checkOutTime: conversation.hotels.check_out_time,
      address: conversation.hotels.address,
    },
    knowledgeBase: knowledge || [],
  });

  if (result.needsHuman) return NextResponse.json({ needsHuman: true, reason: result.reason });

  const { translated: thaiTranslation } = await translateText({
    text: result.reply,
    fromLang: (conversation.guest_language || 'en') as Language,
    toLang: 'th',
    context: 'staff_reply',
  });

  return NextResponse.json({ reply: result.reply, thaiTranslation, confidence: result.confidence });
}
