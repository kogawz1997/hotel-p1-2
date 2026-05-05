// Exchange rates — cached 1h, fetched from open.er-api.com (free, no key)
let cache: { rates: Record<string, number>; ts: number } | null = null;
const TTL = 3600000; // 1 hour

export const CURRENCIES: Record<string, { symbol: string; name: string; flag: string }> = {
  THB: { symbol: '฿',   name: 'Thai Baht',     flag: '🇹🇭' },
  USD: { symbol: '$',   name: 'US Dollar',      flag: '🇺🇸' },
  EUR: { symbol: '€',   name: 'Euro',           flag: '🇪🇺' },
  GBP: { symbol: '£',   name: 'British Pound',  flag: '🇬🇧' },
  JPY: { symbol: '¥',   name: 'Japanese Yen',   flag: '🇯🇵' },
  CNY: { symbol: '¥',   name: 'Chinese Yuan',   flag: '🇨🇳' },
  KRW: { symbol: '₩',   name: 'Korean Won',     flag: '🇰🇷' },
  SGD: { symbol: 'S$',  name: 'Singapore Dollar', flag: '🇸🇬' },
  AUD: { symbol: 'A$',  name: 'Australian Dollar', flag: '🇦🇺' },
  INR: { symbol: '₹',   name: 'Indian Rupee',   flag: '🇮🇳' },
};

export async function getExchangeRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.ts < TTL) return cache.rates;
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/THB', { next: { revalidate: 3600 } });
    const data = await res.json();
    if (data.result === 'success') {
      cache = { rates: data.rates, ts: Date.now() };
      return data.rates;
    }
  } catch {}
  // Fallback rates (approximate)
  return { THB: 1, USD: 0.028, EUR: 0.026, GBP: 0.022, JPY: 4.2, CNY: 0.20, KRW: 37, SGD: 0.038, AUD: 0.044, INR: 2.35 };
}

export function convertCurrency(amountTHB: number, toCurrency: string, rates: Record<string, number>): number {
  if (toCurrency === 'THB') return amountTHB;
  const rate = rates[toCurrency];
  return rate ? amountTHB * rate : amountTHB;
}

export function formatWithCurrency(amount: number, currency: string): string {
  const info = CURRENCIES[currency] || CURRENCIES.THB;
  if (currency === 'THB') return `฿${amount.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
  if (['JPY', 'KRW'].includes(currency)) return `${info.symbol}${Math.round(amount).toLocaleString()}`;
  return `${info.symbol}${amount.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
