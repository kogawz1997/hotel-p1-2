'use client';

import { useTheme } from '@/components/providers/theme-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { type Locale, LOCALES } from '@/lib/i18n/translations';
import { Sun, Moon, Globe, Bell, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function TopBar({ title, description, action }: TopBarProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-medium tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {action}

        {/* Lang switcher */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen(v => !v)}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium transition-colors"
            title="เปลี่ยนภาษา"
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{LOCALES[locale].flag}</span>
            <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', langOpen && 'rotate-180')} />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-9 z-50 bg-card border border-border rounded-xl shadow-[var(--shadow-lg)] py-1 min-w-[140px] animate-scale-in">
              {(Object.entries(LOCALES) as [Locale, typeof LOCALES[Locale]][]).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => { setLocale(code); setLangOpen(false); }}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-secondary transition-colors',
                    locale === code && 'text-accent font-medium'
                  )}
                >
                  <span>{info.flag}</span>
                  <span>{info.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-all hover:scale-105"
          title={resolvedTheme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}
        >
          {resolvedTheme === 'dark'
            ? <Sun className="h-3.5 w-3.5 text-amber-400" />
            : <Moon className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}
