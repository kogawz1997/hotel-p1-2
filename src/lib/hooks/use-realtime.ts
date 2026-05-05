'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onEvent: () => void;
  channelName: string;
}

export function useRealtime({ table, filter, event = '*', onEvent, channelName }: UseRealtimeOptions) {
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const subscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const ch = supabase.channel(channelName);

    ch.on('postgres_changes' as any, { event, schema: 'public', table, filter }, () => {
      retryCount.current = 0;
      onEventRef.current();
    });

    ch.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') { retryCount.current = 0; return; }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        if (retryCount.current < 8) {
          const delay = Math.min(1000 * 2 ** retryCount.current, 30_000);
          retryCount.current++;
          retryTimeout.current = setTimeout(subscribe, delay);
        }
      }
    });

    channelRef.current = ch;
  }, [channelName, table, filter, event]);

  useEffect(() => {
    subscribe();
    return () => {
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [subscribe]);
}
