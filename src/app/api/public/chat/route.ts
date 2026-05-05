import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

type KnowledgeItem = {
  question: string | null;
  answer: string | null;
};

type ChatHistoryItem = {
  role?: 'user' | 'assistant';
  content?: string;
};

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  const { hotelId, message, history } = await request.json();

  if (!hotelId || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const [{ data: hotel }, { data: knowledge }] = await Promise.all([
    supabase
      .from('hotels')
      .select('name, city, check_in_time, check_out_time, phone, email')
      .eq('id', hotelId)
      .single(),
    supabase
      .from('knowledge_base')
      .select('question, answer')
      .eq('hotel_id', hotelId)
      .eq('active', true)
      .limit(30),
  ]);

  const kb = ((knowledge || []) as KnowledgeItem[])
    .map((k: KnowledgeItem) => `Q: ${k.question || ''}\nA: ${k.answer || ''}`)
    .join('\n\n');

  const systemPrompt = `คุณคือผู้ช่วยออนไลน์ของ ${hotel?.name || 'โรงแรม'} ตั้งอยู่ที่ ${hotel?.city || 'Thailand'}
เวลา Check-in: ${hotel?.check_in_time || '14:00'} | Check-out: ${hotel?.check_out_time || '12:00'}
${hotel?.phone ? `โทร: ${hotel.phone}` : ''} ${hotel?.email ? `| อีเมล: ${hotel.email}` : ''}

${kb ? `ข้อมูลเพิ่มเติม:\n${kb}` : ''}

กฎ:
- ตอบสั้น กระชับ เป็นมิตร ภาษาไทยเป็นหลัก แต่ถ้าแขกถามภาษาอังกฤษให้ตอบภาษาอังกฤษ
- ถ้าไม่รู้คำตอบ แนะนำให้โทรหาโรงแรมโดยตรง
- ห้ามให้ข้อมูลที่ไม่แน่ใจ`;

  const safeHistory = Array.isArray(history) ? history : [];

  const messages = [
    ...safeHistory.slice(-6).flatMap((h: ChatHistoryItem) => {
      if (
        (h.role === 'user' || h.role === 'assistant') &&
        typeof h.content === 'string'
      ) {
        return [{ role: h.role, content: h.content }];
      }

      return [];
    }),
    { role: 'user' as const, content: String(message) },
  ];

  if (!anthropic) {
    return NextResponse.json({
      reply: `ระบบผู้ช่วย AI ยังไม่ได้เปิดใช้งาน กรุณาโทรหาโรงแรมที่ ${hotel?.phone || 'หน้า Contact'}`,
      status: 'prepared',
    });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const firstContent = response.content[0];
    const reply = firstContent?.type === 'text' ? firstContent.text : '';

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({
      reply: `ขออภัย ระบบขัดข้องชั่วคราว กรุณาโทรหาโรงแรมที่ ${hotel?.phone || 'หน้า Contact'}`,
    });
  }
}