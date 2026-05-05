'use client';

import { useState, useEffect, useRef } from 'react';
import { CURRENCIES, getExchangeRates, convertCurrency, formatWithCurrency } from '@/lib/currency';
import { ChevronDown } from 'lucide-react';

const STORAGE_KEY = 'maitri_currency';

// Context-free: store selected currency in localStorage
export function useCurrency() {
  const [currency, setCurrencyState] = useState('THB');
  const [rates, setRates] = useState<Record<string, number>>({ THB: 1 });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && CURRENCIES[saved]) setCurrencyState(saved);
    getExchangeRates().then(setRates);
  }, []);

  function setCurrency(c: string) {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  }

  function fmt(amountTHB: number) {
    return formatWithCurrency(convertCurrency(amountTHB, currency, rates), currency);
  }

  return { currency, setCurrency, rates, fmt };
}

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const info = CURRENCIES[currency];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#2A2522]/60 hover:bg-black/5 transition-colors">
        <span>{info?.flag}</span>
        <span className="font-medium text-xs">{currency}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-black/8 py-1 z-50 max-h-72 overflow-y-auto">
          {Object.entries(CURRENCIES).map(([code, info]) => (
            <button key={code} onClick={() => { setCurrency(code); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#FAF7F2] transition-colors ${currency === code ? 'bg-[#FAF7F2] font-medium text-[#C66A30]' : 'text-[#2A2522]/70'}`}>
              <span className="text-base">{info.flag}</span>
              <span className="flex-1 text-left">{code}</span>
              <span className="text-xs text-[#2A2522]/30">{info.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
