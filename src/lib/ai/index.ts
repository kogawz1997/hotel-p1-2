import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type Language = 'th' | 'en' | 'zh' | 'ja' | 'ko' | 'ru' | 'fr' | 'de' | 'es' | 'ar' | 'hi' | 'vi' | 'id' | 'ms';

const LANGUAGE_NAMES: Record<Language, string> = {
  th: 'Thai', en: 'English', zh: 'Chinese (Simplified)', ja: 'Japanese',
  ko: 'Korean', ru: 'Russian', fr: 'French', de: 'German', es: 'Spanish',
  ar: 'Arabic', hi: 'Hindi', vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay',
};

const CULTURAL_TONES: Record<Language, string> = {
  th: 'polite, friendly, with appropriate use of ค่ะ/ครับ',
  en: 'professional yet warm and welcoming',
  zh: 'respectful and formal, suitable for hotel hospitality',
  ja: 'very polite using keigo, extremely respectful',
  ko: 'polite and formal using honorifics',
  ru: 'professional and courteous',
  fr: 'polite and elegant',
  de: 'direct, clear, and professional',
  es: 'warm and friendly',
  ar: 'respectful and formal',
  hi: 'respectful and warm',
  vi: 'polite and friendly',
  id: 'warm and friendly',
  ms: 'polite and friendly',
};


export function detectLanguage(text: string): Language {
  const value = text || '';
  if (/[\u0E00-\u0E7F]/.test(value)) return 'th';
  if (/[\u4E00-\u9FFF]/.test(value)) return 'zh';
  if (/[\u3040-\u30FF]/.test(value)) return 'ja';
  if (/[\uAC00-\uD7AF]/.test(value)) return 'ko';
  if (/[\u0400-\u04FF]/.test(value)) return 'ru';
  if (/[\u0600-\u06FF]/.test(value)) return 'ar';
  if (/[\u0900-\u097F]/.test(value)) return 'hi';
  if (/[àâçéèêëîïôûùüÿñæœ]/i.test(value)) return 'fr';
  if (/[äöüß]/i.test(value)) return 'de';
  if (/[áéíóúñ¿¡]/i.test(value)) return 'es';
  return 'en';
}

export interface TranslateOptions {
  text: string;
  fromLang: Language;
  toLang: Language;
  context?: 'guest_inquiry' | 'staff_reply' | 'document' | 'general';
  hotelContext?: string;
}

export async function translateText(opts: TranslateOptions): Promise<{
  translated: string;
  confidence: number;
}> {
  if (opts.fromLang === opts.toLang) {
    return { translated: opts.text, confidence: 1.0 };
  }

  const systemPrompt = `You are a professional hotel translator. Translate text between languages while preserving the meaning, tone, and cultural appropriateness.

CRITICAL RULES:
1. Adapt tone to target culture: ${CULTURAL_TONES[opts.toLang]}
2. Use hotel-industry vocabulary correctly
3. Preserve numbers, dates, prices, and proper nouns exactly
4. If text is ambiguous, choose the meaning most appropriate for hotel context
5. Output ONLY the translation, no explanation, no quotes

${opts.hotelContext ? `Hotel context: ${opts.hotelContext}` : ''}
${opts.context === 'guest_inquiry' ? 'This is from a hotel guest asking a question.' : ''}
${opts.context === 'staff_reply' ? 'This is a hotel staff reply to a guest. Make it warm and helpful.' : ''}`;

  const userPrompt = `Translate this from ${LANGUAGE_NAMES[opts.fromLang]} to ${LANGUAGE_NAMES[opts.toLang]}:

${opts.text}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const translated = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    return { translated, confidence: 0.95 };
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Translation failed');
  }
}

export async function generateGuestReply(opts: {
  conversationHistory: Array<{ role: 'guest' | 'staff' | 'ai'; text: string }>;
  guestLanguage: Language;
  hotelInfo: {
    name: string;
    checkInTime: string;
    checkOutTime: string;
    address?: string;
    amenities?: string[];
    policies?: string[];
  };
  knowledgeBase?: Array<{ title: string; content: string }>;
  reservationContext?: {
    checkIn?: string;
    checkOut?: string;
    roomType?: string;
    guestName?: string;
  };
}): Promise<{
  reply: string;
  confidence: number;
  needsHuman: boolean;
  reason?: string;
}> {
  const systemPrompt = `You are an AI concierge for ${opts.hotelInfo.name}.

# Your Role
- Answer guest questions about the hotel, amenities, area
- Help with booking, check-in/out, special requests
- Be warm, professional, and helpful

# Hard Rules (NEVER violate)
1. NEVER quote prices not provided in your knowledge - say "let me check for you"
2. NEVER promise refunds - escalate to staff
3. NEVER mention competitor hotels
4. NEVER provide medical, legal, or financial advice
5. If unsure, say "Let me check with our team and get back to you"
6. If guest is angry/upset, ALWAYS escalate to human

# Hotel Information
- Name: ${opts.hotelInfo.name}
- Check-in: ${opts.hotelInfo.checkInTime}
- Check-out: ${opts.hotelInfo.checkOutTime}
${opts.hotelInfo.address ? `- Address: ${opts.hotelInfo.address}` : ''}
${opts.hotelInfo.amenities?.length ? `- Amenities: ${opts.hotelInfo.amenities.join(', ')}` : ''}

${opts.knowledgeBase?.length ? `# Knowledge Base\n${opts.knowledgeBase.map(k => `## ${k.title}\n${k.content}`).join('\n\n')}` : ''}

${opts.reservationContext ? `# Current Guest Context
- Name: ${opts.reservationContext.guestName || 'Unknown'}
- Check-in: ${opts.reservationContext.checkIn || 'N/A'}
- Check-out: ${opts.reservationContext.checkOut || 'N/A'}
- Room: ${opts.reservationContext.roomType || 'N/A'}` : ''}

# Tone
${CULTURAL_TONES[opts.guestLanguage]}

# Response Format
Respond ONLY in ${LANGUAGE_NAMES[opts.guestLanguage]}.

If you cannot answer or this needs human attention, respond with exactly:
ESCALATE: <reason in English>`;

  const messages = opts.conversationHistory.map(msg => ({
    role: (msg.role === 'guest' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: msg.text,
  }));

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.length > 0 ? messages : [{ role: 'user', content: 'Hello' }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

    if (text.startsWith('ESCALATE:')) {
      return {
        reply: '',
        confidence: 0,
        needsHuman: true,
        reason: text.replace('ESCALATE:', '').trim(),
      };
    }

    return { reply: text, confidence: 0.85, needsHuman: false };
  } catch (error) {
    console.error('AI reply error:', error);
    return {
      reply: '',
      confidence: 0,
      needsHuman: true,
      reason: 'AI service error',
    };
  }
}

export async function analyzeSentiment(text: string, language: Language = 'en'): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  urgency: 'low' | 'medium' | 'high';
  topics: string[];
}> {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 256,
    system: 'You are a sentiment analysis tool. Output JSON only.',
    messages: [{
      role: 'user',
      content: `Analyze this hotel guest message. Output JSON: { sentiment: "positive"|"neutral"|"negative", score: -1.0 to 1.0, urgency: "low"|"medium"|"high", topics: ["topic1","topic2"] }

Message (${language}): ${text}`,
    }],
  });

  const txt = response.content[0].type === 'text' ? response.content[0].text : '{}';
  try {
    const json = JSON.parse(txt.replace(/```json|```/g, '').trim());
    return json;
  } catch {
    return { sentiment: 'neutral', score: 0, urgency: 'low', topics: [] };
  }
}

export async function generateReviewResponse(opts: {
  review: { rating: number; content: string; language: Language };
  hotelName: string;
  ownerName?: string;
}): Promise<string> {
  const systemPrompt = `You write professional hotel review responses. 

Rules:
- Match the language of the review (${LANGUAGE_NAMES[opts.review.language]})
- For positive reviews: thank genuinely, highlight what they liked
- For negative reviews: apologize sincerely, address specific concerns, invite back
- Always be authentic, never templated
- Keep under 150 words
- Sign as "${opts.ownerName || 'Hotel Manager'} - ${opts.hotelName}"
- Tone: ${CULTURAL_TONES[opts.review.language]}`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `${opts.review.rating}-star review:\n${opts.review.content}\n\nWrite a response.`,
    }],
  });

  return response.content[0].type === 'text' ? response.content[0].text.trim() : '';
}

export async function suggestDynamicPrice(opts: {
  basePrice: number;
  occupancyForecast: number;
  daysToArrival: number;
  competitorPrices?: number[];
  isWeekend: boolean;
  isHoliday: boolean;
  localEvents?: string[];
}): Promise<{
  suggestedPrice: number;
  reasoning: string;
  confidence: number;
}> {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 512,
    system: 'You are a hotel revenue management AI. Output JSON only.',
    messages: [{
      role: 'user',
      content: `Suggest optimal price. Base: ${opts.basePrice} THB.
Occupancy forecast: ${(opts.occupancyForecast * 100).toFixed(0)}%
Days to arrival: ${opts.daysToArrival}
Weekend: ${opts.isWeekend}, Holiday: ${opts.isHoliday}
${opts.competitorPrices?.length ? `Competitor prices: ${opts.competitorPrices.join(', ')}` : ''}
${opts.localEvents?.length ? `Local events: ${opts.localEvents.join(', ')}` : ''}

Output JSON: { suggestedPrice: number, reasoning: "string", confidence: 0-1 }`,
    }],
  });

  const txt = response.content[0].type === 'text' ? response.content[0].text : '{}';
  try {
    return JSON.parse(txt.replace(/```json|```/g, '').trim());
  } catch {
    return { suggestedPrice: opts.basePrice, reasoning: 'Unable to compute', confidence: 0 };
  }
}
