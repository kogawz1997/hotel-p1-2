# Maitri — Quick TODO

## 🔴 Sprint 1 — ทำก่อน launch

- [x] **Booking confirmation email** → แก้ `src/app/api/reservations/route.ts` เพิ่ม emailAdapter.sendMessage()
- [ ] **Reset password page** → สร้าง `src/app/portal/reset-password/page.tsx`
- [ ] **Wishlist page** → สร้าง `src/app/portal/wishlist/page.tsx` + `src/app/api/guest/wishlist/route.ts`
- [x] **Terms of Service** → สร้าง `src/app/terms/page.tsx`
- [x] **Privacy Policy (PDPA)** → สร้าง `src/app/privacy/page.tsx`
- [ ] **Email verification** → เปิดใน Supabase Dashboard + แก้ register flow

## 🟠 Sprint 2 — Core features

- [x] **Onboarding wizard** → สร้าง `src/app/onboarding/` (3 steps)
- [x] **Rate calendar UI** → สร้าง `src/app/dashboard/rates/page.tsx`
- [ ] **Room type images** → แก้ `src/components/dashboard/rooms-client.tsx` + upload API
- [x] **Cancellation email** → แก้ `src/app/api/guest/bookings/[id]/route.ts`
- [ ] **Pay at hotel** → แก้ booking-engine.tsx เพิ่ม payment method option

## 🟡 Sprint 3 — OTA-level UX

- [x] **Search page** → สร้าง `src/app/search/page.tsx` + `src/app/api/public/search/route.ts`
- [x] **Price graph** → สร้าง `src/components/booking/price-graph.tsx`
- [x] **Photo lightbox** → สร้าง `src/components/ui/lightbox.tsx`
- [x] **Urgency indicators** → แก้ booking-engine.tsx เพิ่ม "เหลือ X ห้อง"
- [ ] **Guest AI chatbot** → สร้าง `src/components/booking/guest-chat-widget.tsx`

## 🟢 Sprint 4 — Scale & Legal

- [ ] **Subscription billing** → สร้าง `src/app/dashboard/billing/page.tsx` + Stripe integration
- [ ] **Cookie consent banner** → สร้าง `src/components/ui/cookie-consent.tsx`
- [ ] **Data export PDPA** → สร้าง `src/app/api/guest/export/route.ts`
- [ ] **Sentry** → install `@sentry/nextjs` + config files
- [ ] **Redis rate limit** → แก้ `src/lib/security/rate-limit.ts` → Upstash
- [ ] **PWA manifest** → สร้าง `public/manifest.json` + icons
- [ ] **OpenGraph images** → สร้าง `src/app/h/[slug]/opengraph-image.tsx`

## ⚡ Sprint 5 — Full features

- [ ] **F&B POS** → สร้าง `src/app/dashboard/fb/menu/`, `fb/orders/`
- [ ] **Spa booking** → สร้าง `src/app/dashboard/spa/services/`, `spa/bookings/`
- [ ] **Maintenance** → สร้าง `src/app/dashboard/maintenance/page.tsx`
- [ ] **Multi-currency** → สร้าง `src/lib/currency.ts` + switcher
- [ ] **QR check-in** → สร้าง `src/app/portal/bookings/[code]/qr/page.tsx`
- [ ] **Image optimization** → สร้าง `src/app/api/storage/optimize/route.ts` (sharp)
- [ ] **DB indexes** → สร้าง `supabase/migrations/00006_performance_indexes.sql`

## ENV vars ที่ยังขาด
```
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
STRIPE_SECRET_KEY=sk_live_xxx (ถ้าทำ billing)
SENTRY_DSN=https://xxx@sentry.io/xxx (ถ้าทำ monitoring)
```

ดูรายละเอียดแต่ละข้อเพิ่มเติมใน **ROADMAP.md**

## 🎨 Sprint UX/UI — Luxury Redesign

- [x] **src/lib/images.ts** — Curated Unsplash luxury hotel images
- [x] **Luxury CSS animations** — stagger, shimmer, card-lift, glass, reveal
- [x] **useScrollReveal hook** — IntersectionObserver
- [x] **useCounter hook** — animated number counter
- [x] **AnimatedNumber component** — เลข count ขึ้นเมื่อ scroll เข้ามา
- [x] **Landing page redesign** — Full hero image, stats, pricing 3 plans, testimonials, footer ครบ
- [ ] **Hotel public page** — Airbnb-style gallery grid + sticky sidebar
- [ ] **Booking engine** — animated step progress, trust badges
- [ ] **Search page** — Map/List toggle, infinite scroll, compare mode
- [ ] **Global page transitions** — page-enter animation
- [ ] **Loading skeletons** — ทุก async section
