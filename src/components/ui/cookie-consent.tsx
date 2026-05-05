'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X, Check } from 'lucide-react';

const STORAGE_KEY = 'maitri_cookie_consent';

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setShow(true);
    } catch {}
  }, []);

  function accept(all: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        necessary: true,
        analytics: all ? true : analytics,
        timestamp: Date.now(),
      }));
    } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-black/10 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-9 w-9 bg-[#FAF7F2] rounded-xl flex items-center justify-center shrink-0">
            <Cookie className="h-5 w-5 text-[#C66A30]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#2A2522] text-sm mb-1">เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์ของคุณ</h3>
            <p className="text-xs text-[#2A2522]/50 leading-relaxed">
              เว็บไซต์นี้ใช้คุกกี้ที่จำเป็นสำหรับการทำงาน (Necessary) และคุกกี้วิเคราะห์ (Analytics)
              ตาม <Link href="/privacy" className="text-[#C66A30] hover:underline">นโยบายความเป็นส่วนตัว</Link> ของเรา (PDPA)
            </p>
          </div>
          <button onClick={() => accept(false)} className="p-1 rounded-lg hover:bg-black/5 shrink-0">
            <X className="h-4 w-4 text-[#2A2522]/30" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 p-2.5 bg-[#FAF7F2] rounded-xl">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#2A2522]">Analytics Cookies</span>
              <span className="text-2xs bg-black/5 text-[#2A2522]/50 px-1.5 py-0.5 rounded">ไม่บังคับ</span>
            </div>
            <p className="text-2xs text-[#2A2522]/40">วิเคราะห์การใช้งานเพื่อปรับปรุงบริการ</p>
          </div>
          <button onClick={() => setAnalytics(p => !p)}
            className={`relative w-11 h-6 rounded-full transition-colors ${analytics ? 'bg-[#C66A30]' : 'bg-black/15'}`}>
            <div className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow transition-transform ${analytics ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={() => accept(false)}
            className="flex-1 py-2 border border-black/10 text-[#2A2522] rounded-xl text-xs font-medium hover:bg-black/5 transition-colors">
            ยอมรับที่เลือก
          </button>
          <button onClick={() => accept(true)}
            className="flex-1 py-2 bg-[#2A2522] text-white rounded-xl text-xs font-medium hover:bg-black transition-colors flex items-center justify-center gap-1.5">
            <Check className="h-3.5 w-3.5" /> ยอมรับทั้งหมด
          </button>
        </div>
      </div>
    </div>
  );
}
