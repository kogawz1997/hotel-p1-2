'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message { role: 'user' | 'assistant'; content: string; }

export function GuestChatWidget({ hotelId, hotelName }: { hotelId: string; hotelName: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `สวัสดีครับ! 🙏 ยินดีต้อนรับสู่ ${hotelName}\nมีอะไรให้ช่วยเหลือไหมครับ?` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const QUICK = ['เวลาเช็คอิน?', 'มีที่จอดรถไหม?', 'ใกล้ BTS ไหม?', 'อาหารเช้ารวมไหม?'];

  async function send(text?: string) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: msg };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    const res = await fetch('/api/public/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotelId, message: msg, history: messages.slice(-4) }),
    });
    const data = await res.json();
    setMessages(p => [...p, { role: 'assistant', content: data.reply || 'ขออภัย เกิดข้อผิดพลาด' }]);
    setLoading(false);
  }

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-black/8 flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {/* Header */}
          <div className="bg-[#2A2522] text-white px-4 py-3 flex items-center gap-3">
            <div className="h-8 w-8 bg-[#C66A30] rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{hotelName}</p>
              <p className="text-xs text-white/50 flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" /> ออนไลน์ · AI ตอบทันที
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF7F2]">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn('h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                  m.role === 'assistant' ? 'bg-[#2A2522]' : 'bg-[#C66A30]')}>
                  {m.role === 'assistant' ? <Bot className="h-3.5 w-3.5 text-white" /> : <User className="h-3.5 w-3.5 text-white" />}
                </div>
                <div className={cn('max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                  m.role === 'assistant'
                    ? 'bg-white text-[#2A2522] rounded-tl-sm shadow-sm'
                    : 'bg-[#C66A30] text-white rounded-tr-sm')}>
                  {m.content.split('\n').map((line, j) => <span key={j}>{line}{j < m.content.split('\n').length - 1 && <br />}</span>)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="h-7 w-7 rounded-full bg-[#2A2522] flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-white px-3 py-2 rounded-2xl rounded-tl-sm shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-[#2A2522]/30" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies (only on first message) */}
          {messages.length === 1 && (
            <div className="px-3 pt-2 flex flex-wrap gap-1.5 bg-white border-t border-black/5">
              {QUICK.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="px-2.5 py-1 text-xs border border-[#C66A30]/30 text-[#C66A30] rounded-full hover:bg-[#C66A30]/5 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-black/5 flex items-center gap-2">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="พิมพ์คำถาม..."
              className="flex-1 px-3 py-2 bg-[#FAF7F2] rounded-xl text-sm focus:outline-none" />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="h-9 w-9 bg-[#C66A30] disabled:bg-[#C66A30]/30 text-white rounded-xl flex items-center justify-center transition-colors">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setOpen(p => !p)}
        className={cn(
          'fixed bottom-4 right-4 sm:right-6 z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all',
          open ? 'bg-[#2A2522] rotate-90' : 'bg-[#C66A30] hover:bg-[#A4522A] hover:scale-110'
        )}>
        {open ? <X className="h-5 w-5 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
        {!open && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-400 rounded-full border-2 border-white" />
        )}
      </button>
    </>
  );
}
