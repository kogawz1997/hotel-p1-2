'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Send, Sparkles, MessageSquare, Globe2, Search, Filter,
  Phone, Video, MoreVertical, ChevronLeft, Check, CheckCheck,
  AlertCircle, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  channel: string;
  guest_name?: string;
  guest_language: string;
  last_message_preview?: string;
  last_message_at: string;
  unread_count: number;
  status: string;
  needs_human?: boolean;
}

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  sender_type: string;
  original_text?: string;
  original_language?: string;
  translated_text?: string;
  message_type: string;
  ai_generated: boolean;
  ai_confidence?: number;
  status: string;
  created_at: string;
}

const CHANNEL_META: Record<string, { label: string; color: string; bg: string }> = {
  line: { label: 'LINE', color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-950' },
  whatsapp: { label: 'WhatsApp', color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-950' },
  wechat: { label: 'WeChat', color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-950' },
  email: { label: 'Email', color: 'text-blue-700', bg: 'bg-blue-100 dark:bg-blue-950' },
  instagram: { label: 'Instagram', color: 'text-pink-700', bg: 'bg-pink-100 dark:bg-pink-950' },
  messenger: { label: 'Messenger', color: 'text-blue-700', bg: 'bg-blue-100 dark:bg-blue-950' },
  webchat: { label: 'Web', color: 'text-gray-700', bg: 'bg-gray-100 dark:bg-gray-900' },
};

const LANGUAGE_FLAGS: Record<string, string> = {
  th: '🇹🇭', en: '🇬🇧', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷',
  ru: '🇷🇺', fr: '🇫🇷', de: '🇩🇪', es: '🇪🇸', ar: '🇸🇦',
  hi: '🇮🇳', vi: '🇻🇳', id: '🇮🇩', ms: '🇲🇾',
};

export function InboxClient({ hotelId, hotelName }: { hotelId: string; hotelName: string }) {
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [composeText, setComposeText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiOriginalSuggestion, setAiOriginalSuggestion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations + realtime
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('last_message_at', { ascending: false })
        .limit(100);
      setConversations(data || []);
      setConversationsLoading(false);
      if (data?.[0] && !activeId) setActiveId(data[0].id);
    }
    load();

    const channel = supabase
      .channel(`conversations-${hotelId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'conversations',
        filter: `hotel_id=eq.${hotelId}`,
      }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hotelId]);

  // Load messages for active
  useEffect(() => {
    if (!activeId) return;
    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      // Mark as read
      await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', activeId);
    }
    loadMessages();

    const channel = supabase
      .channel(`messages-${activeId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${activeId}`,
      }, () => loadMessages())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeId]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (filterChannel && c.channel !== filterChannel) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.guest_name?.toLowerCase().includes(q) ||
          c.last_message_preview?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [conversations, filterChannel, searchQuery]);

  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    conversations.forEach((c) => {
      counts[c.channel] = (counts[c.channel] || 0) + 1;
    });
    return counts;
  }, [conversations]);

  const activeConversation = conversations.find((c) => c.id === activeId);

  async function generateAISuggestion() {
    if (!activeId) return;
    setGenerating(true);
    try {
      const response = await fetch('/api/ai/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId }),
      });
      const data = await response.json();
      if (data.needsHuman) {
        toast.warning('ควรให้พนักงานตอบเอง', { description: data.reason });
        setGenerating(false);
        return;
      }
      setAiOriginalSuggestion(data.reply || '');
      setAiSuggestion(data.thaiTranslation || data.reply || '');
      setComposeText(data.thaiTranslation || data.reply || '');
      composeRef.current?.focus();
    } catch (e) {
      toast.error('ไม่สามารถสร้างข้อความได้');
    } finally {
      setGenerating(false);
    }
  }

  async function sendMessage() {
    if (!composeText.trim() || !activeId) return;
    setLoading(true);

    // Optimistic update — show message immediately
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      direction: 'outbound',
      sender_type: aiSuggestion ? 'ai' : 'staff',
      original_text: composeText,
      original_language: 'th',
      message_type: 'text',
      ai_generated: !!aiSuggestion,
      status: 'sending',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    const sentText = composeText;
    const wasAI = !!aiSuggestion;
    setComposeText('');
    setAiSuggestion('');
    setAiOriginalSuggestion('');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const response = await fetch('/api/ai/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeId,
          text: sentText,
          fromAISuggestion: wasAI,
        }),
      });
      if (!response.ok) throw new Error();
      // Real message will arrive via Realtime subscription — remove optimistic
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } catch {
      toast.error('ส่งข้อความไม่สำเร็จ');
      // Mark optimistic as failed
      setMessages(prev => prev.map(m =>
        m.id === optimisticMsg.id ? { ...m, status: 'failed' } : m
      ));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-[calc(100vh-0px)] md:h-screen overflow-hidden">
      {/* Conversation list */}
      <div className={cn(
        'w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col',
        showMobileChat && 'hidden md:flex'
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-2xl font-medium tracking-tight">Inbox</h1>
            <span className="text-xs text-muted-foreground">{conversations.length}</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาบทสนทนา..."
              className="w-full pl-9 pr-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Channel filters */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <button
              onClick={() => setFilterChannel(null)}
              className={cn(
                'text-2xs px-2 py-1 rounded-md transition-colors',
                !filterChannel ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              ทั้งหมด ({conversations.length})
            </button>
            {Object.entries(channelCounts).map(([ch, count]) => {
              const meta = CHANNEL_META[ch];
              if (!meta) return null;
              return (
                <button
                  key={ch}
                  onClick={() => setFilterChannel(filterChannel === ch ? null : ch)}
                  className={cn(
                    'text-2xs px-2 py-1 rounded-md transition-colors',
                    filterChannel === ch ? 'bg-primary text-primary-foreground' : `${meta.bg} ${meta.color}`
                  )}
                >
                  {meta.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {conversationsLoading ? (
            <div className="p-3 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="ยังไม่มีบทสนทนา"
              description="เชื่อมต่อ LINE หรือ WhatsApp เพื่อเริ่มรับข้อความ"
            />
          ) : (
            filteredConversations.map((c) => {
              const meta = CHANNEL_META[c.channel];
              return (
                <button
                  key={c.id}
                  onClick={() => { setActiveId(c.id); setShowMobileChat(true); }}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-border/50 hover:bg-secondary/50 transition-colors',
                    activeId === c.id && 'bg-secondary'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {c.guest_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className="absolute -bottom-1 -right-1 text-sm">
                        {LANGUAGE_FLAGS[c.guest_language] || ''}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <span className="font-medium text-sm truncate">
                          {c.guest_name || 'แขก'}
                        </span>
                        <span className="text-2xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false, locale: th })}
                        </span>
                      </div>
                      <p className={cn(
                        'text-xs line-clamp-1',
                        c.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                      )}>
                        {c.last_message_preview}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {meta && (
                          <span className={cn('text-2xs px-1.5 py-px rounded', meta.bg, meta.color)}>
                            {meta.label}
                          </span>
                        )}
                        {c.needs_human && (
                          <Badge variant="warning" className="text-2xs">รอตอบ</Badge>
                        )}
                        {c.unread_count > 0 && (
                          <span className="ml-auto text-2xs px-1.5 py-px rounded-full bg-accent text-accent-foreground font-medium">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Conversation view */}
      <div className={cn(
        'flex-1 flex flex-col bg-secondary/20',
        !showMobileChat && 'hidden md:flex'
      )}>
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="เลือกบทสนทนา"
              description="เลือกบทสนทนาทางซ้ายเพื่อเริ่มตอบกลับ"
            />
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="border-b border-border bg-card p-4 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setShowMobileChat(false)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                {activeConversation.guest_name?.charAt(0).toUpperCase() || '?'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{activeConversation.guest_name}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {LANGUAGE_FLAGS[activeConversation.guest_language]}
                    <span>{activeConversation.guest_language.toUpperCase()}</span>
                  </span>
                  <span>·</span>
                  <span>{CHANNEL_META[activeConversation.channel]?.label}</span>
                </div>
              </div>

              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  ยังไม่มีข้อความในบทสนทนานี้
                </div>
              ) : (
                messages.map((msg, i) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    showAvatar={i === 0 || messages[i - 1].direction !== msg.direction}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose */}
            <div className="border-t border-border bg-card p-4">
              {aiOriginalSuggestion && (
                <div className="mb-3 p-3 rounded-lg bg-accent/5 border border-accent/20 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-2xs uppercase tracking-wider text-accent font-medium mb-1">
                        AI suggested · {activeConversation.guest_language}
                      </div>
                      <div className="text-sm">{aiOriginalSuggestion}</div>
                    </div>
                    <button
                      onClick={() => { setAiSuggestion(''); setAiOriginalSuggestion(''); setComposeText(''); }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  ref={composeRef}
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="พิมพ์เป็นภาษาไทย ระบบจะแปลให้แขกอัตโนมัติ..."
                  rows={2}
                  className="flex-1 px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring scrollbar-thin"
                />
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generateAISuggestion}
                    disabled={generating}
                    title="AI generate"
                  >
                    {generating ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    onClick={sendMessage}
                    disabled={loading || !composeText.trim()}
                    title="Send (⌘+Enter)"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-2xs text-muted-foreground mt-2">
                ⌘ Enter เพื่อส่ง · AI แปลและปรับโทนให้แล้ว
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message, showAvatar }: { message: Message; showAvatar: boolean }) {
  const isOutbound = message.direction === 'outbound';
  const hasTranslation = message.translated_text && message.translated_text !== message.original_text;

  return (
    <div className={cn('flex gap-2', isOutbound && 'flex-row-reverse')}>
      <div className="w-8 shrink-0">
        {showAvatar && (
          <div className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center text-xs',
            isOutbound
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          )}>
            {isOutbound ? (message.ai_generated ? <Sparkles className="h-3.5 w-3.5" /> : 'S') : <User className="h-3.5 w-3.5" />}
          </div>
        )}
      </div>

      <div className={cn('max-w-[75%] space-y-1', isOutbound && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5',
            isOutbound
              ? 'bg-primary text-primary-foreground rounded-tr-md'
              : 'bg-card border border-border rounded-tl-md'
          )}
        >
          {hasTranslation && !isOutbound && (
            <div className="text-sm">{message.translated_text}</div>
          )}
          <div className={cn(
            'text-sm whitespace-pre-wrap break-words',
            hasTranslation && !isOutbound && 'text-2xs opacity-70 mt-1.5 pt-1.5 border-t border-current/10'
          )}>
            {message.original_text}
          </div>
        </div>

        <div className={cn(
          'flex items-center gap-1 px-1 text-2xs text-muted-foreground',
          isOutbound && 'flex-row-reverse'
        )}>
          <span>{format(new Date(message.created_at), 'HH:mm')}</span>
          {message.ai_generated && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5 text-accent">
                <Sparkles className="h-2.5 w-2.5" /> AI
              </span>
            </>
          )}
          {isOutbound && (
            <>
              <span>·</span>
              {message.status === 'read' ? <CheckCheck className="h-3 w-3 text-accent" /> :
               message.status === 'delivered' ? <CheckCheck className="h-3 w-3" /> :
               message.status === 'failed' ? <AlertCircle className="h-3 w-3 text-destructive" /> :
               <Check className="h-3 w-3" />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
