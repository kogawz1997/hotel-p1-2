import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'THB'): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string, locale = 'th-TH'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string, locale = 'th-TH'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
}

export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const ci = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
  const co = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
  return Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
}

export function generateInvoiceNumber(prefix = 'INV'): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${year}${month}${random}`;
}

// Detect language using simple heuristics + can fall back to AI
export function detectLanguage(text: string): string {
  if (/[\u0E00-\u0E7F]/.test(text)) return 'th';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  return 'en';
}

export function calculateVAT(subtotal: number, rate = 0.07): { subtotal: number; vat: number; total: number } {
  const vat = subtotal * rate;
  return { subtotal, vat, total: subtotal + vat };
}

export function extractVATFromTotal(total: number, rate = 0.07): { subtotal: number; vat: number; total: number } {
  const subtotal = total / (1 + rate);
  return { subtotal, vat: total - subtotal, total };
}
