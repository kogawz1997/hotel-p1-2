# Maitri PMS — Roadmap สู่ Production

> อัพเดต: พฤษภาคม 2026 | สถานะ: Pre-launch

---

## สถานะปัจจุบัน

| ส่วน | สถานะ | หมายเหตุ |
|------|--------|----------|
| Dashboard โรงแรม | ✅ ครบ | 15 หน้า, 33 API routes |
| Guest Booking Engine | ✅ ครบ | 5-step flow, availability จริง |
| Guest Portal | ✅ ครบ | Login/Register/My Bookings/Profile |
| Hotel Public Page `/h/[slug]` | ✅ ครบ | Gallery, Rooms, Reviews, Contact |
| Branding & Gallery | ✅ ครบ | Logo, Hero, Gallery management |
| AI Inbox | ✅ ครบ | LINE, WhatsApp, Email + AI reply |
| Payment (Omise) | ✅ ครบ | Charge + Webhook |
| TM30 + eTax | ✅ ครบ | Auto-submit |
| Channel Manager | ✅ ครบ | Booking.com, Agoda, Airbnb UI |

---

## 🔴 กลุ่ม 1 — Critical Bugs (ทำก่อน launch)

### 1. Booking Confirmation Email
**ปัญหา:** แขกจองสำเร็จแล้วไม่ได้รับอีเมล SendGrid wired แล้วแต่ยังไม่ถูก call

**ไฟล์ที่ต้องแก้:**
- `src/app/api/reservations/route.ts` — เพิ่ม call `emailAdapter.sendMessage()` หลัง insert สำเร็จ
- `src/lib/channels/email.ts` — มี sendMessage แล้ว แค่ต้อง import มาใช้

**Template ที่ต้องสร้าง:**
```
src/lib/email-templates/
  booking-confirmation.ts   — แขก: รหัสจอง, วันที่, ราคา, QR code
  booking-cancellation.ts   — แขก: แจ้งยกเลิก, เหตุผล
  new-booking-alert.ts      — โรงแรม: แจ้งมีจองใหม่
  check-in-reminder.ts      — แขก: เตือน 24 ชม.ก่อนเช็คอิน
  review-request.ts         — แขก: ขอรีวิวหลัง check-out
```

**ENV ที่ต้องตั้ง:**
```
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=ชื่อโรงแรม
```

---

### 2. Reset Password Page
**ปัญหา:** `POST /api/guest/auth/forgot-password` ส่ง email มีลิงก์ไป `/portal/reset-password` แต่หน้านี้ไม่มี → 404

**ไฟล์ที่ต้องสร้าง:**
```
src/app/portal/reset-password/page.tsx
```

**Logic:**
1. อ่าน `access_token` จาก URL hash (`#access_token=...`)
2. Call `supabase.auth.updateUser({ password: newPassword })`
3. Redirect ไป `/portal/bookings`

---

### 3. Wishlist Page
**ปัญหา:** Middleware protect `/portal/wishlist` แต่หน้าไม่มี → 500 error เมื่อ login แล้วเข้า

**ไฟล์ที่ต้องสร้าง:**
```
src/app/portal/wishlist/page.tsx
src/app/portal/wishlist/wishlist-client.tsx
```

**ฟีเจอร์:**
- ดึงจาก `guest_wishlists` table (มีใน migration 00005)
- แสดงการ์ดโรงแรม/ห้องที่ save ไว้
- ลบออกจาก wishlist ได้
- ปุ่ม "จองเลย" ไป booking engine

**API ที่ต้องสร้าง:**
```
POST /api/guest/wishlist          — เพิ่ม
DELETE /api/guest/wishlist/[id]   — ลบ
GET /api/guest/wishlist           — ดึงทั้งหมด
```

---

### 4. Rate Limiting — ย้ายจาก In-Memory เป็น Vercel KV
**ปัญหา:** `src/lib/security/rate-limit.ts` ใช้ `Map` ใน memory → Vercel serverless cold start ทุกครั้ง map reset → ป้องกัน spam ไม่ได้จริง

**ไฟล์ที่ต้องแก้:**
- `src/lib/security/rate-limit.ts` — เปลี่ยนเป็น Vercel KV หรือ Upstash Redis

**วิธีแก้ด้วย Upstash Redis (ฟรี):**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '1 m'),
});
```

**ENV ที่ต้องเพิ่ม:**
```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

---

### 5. Email Verification
**ปัญหา:** ตอนนี้ signup แล้วใช้งานได้ทันทีโดยไม่ต้อง verify email → บัญชีปลอมได้

**ไฟล์ที่ต้องแก้:**
- `src/app/api/guest/auth/register/route.ts` — เพิ่ม `emailRedirectTo` ใน signUp options
- `src/app/portal/login/page.tsx` — แสดง banner "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ"

**Supabase config:**
- ไป Supabase Dashboard → Authentication → Email → Enable email confirmation

---

## 🟠 กลุ่ม 2 — Missing Core Features

### 6. Onboarding Wizard
**ปัญหา:** Sign up เสร็จแล้วเข้า Dashboard ว่างเปล่า ไม่รู้ต้องทำอะไรก่อน

**ไฟล์ที่ต้องสร้าง:**
```
src/app/onboarding/page.tsx
src/app/onboarding/steps/
  01-hotel-info.tsx     — ชื่อโรงแรม, ที่อยู่, เบอร์, เช็คอิน/เอาท์
  02-add-rooms.tsx      — เพิ่มประเภทห้องอย่างน้อย 1 ประเภท
  03-upload-images.tsx  — logo, hero image
  04-done.tsx           — สรุปและ redirect ไป dashboard
```

**ไฟล์ที่ต้องแก้:**
- `src/app/dashboard/page.tsx` — ตรวจสอบว่า onboarding เสร็จหรือยัง ถ้ายังให้ redirect
- `src/middleware.ts` — ถ้า user ยังไม่ผ่าน onboarding และไม่ได้อยู่ที่ `/onboarding` ให้ redirect

**DB check:**
```sql
-- ถ้า hotels ไม่มีห้องเลย = ยังไม่ onboarding
SELECT COUNT(*) FROM rooms WHERE hotel_id = $1
```

---

### 7. Rate Calendar UI
**ปัญหา:** `rate_calendar` table มีในฐานข้อมูลแล้วแต่ไม่มี UI ตั้งราคา → ราคาแต่ละวันเป็น `base_rate` เดียวตลอด

**ไฟล์ที่ต้องสร้าง:**
```
src/app/dashboard/rates/page.tsx
src/app/dashboard/rates/rate-calendar-client.tsx
src/app/api/rates/route.ts          — GET/POST bulk rate update
src/app/api/rates/[id]/route.ts     — PATCH single date
```

**ฟีเจอร์ที่ต้องมี:**
- Calendar view รายเดือน
- คลิกวันเดียวหรือ drag เลือกหลายวันเพื่อตั้งราคา
- Bulk update (เช่น ราคาช่วงปีใหม่ทั้งเดือน)
- Min stay per date
- Close to arrival / departure
- Import ราคาจาก Excel (optional)

**Sidebar:** เพิ่มลิงก์ "ราคา & ปฏิทิน" ในกลุ่ม "ห้องพัก"

---

### 8. Room Type Image Upload
**ปัญหา:** Booking engine แสดงห้องแต่ไม่มีรูป → แขกไม่มั่นใจ

**ไฟล์ที่ต้องแก้:**
- `src/components/dashboard/rooms-client.tsx` — เพิ่ม upload UI ในส่วนแก้ไขประเภทห้อง
- `src/app/api/room-types/[id]/images/route.ts` — POST upload, DELETE ลบ

**Table ที่มีแล้ว:**
```sql
room_type_images (id, room_type_id, image_url, display_order, alt_text)
-- อยู่ใน migration 00005
```

**Storage bucket:**
- ใช้ bucket `hotel-assets` ที่มีแล้ว
- Path: `{hotelId}/room-types/{roomTypeId}/{timestamp}-{filename}`

---

### 9. Subscription Billing
**ปัญหา:** ไม่มีระบบเก็บเงินโรงแรมที่ใช้ Maitri → รายได้ SaaS เป็น 0

**ไฟล์ที่ต้องสร้าง:**
```
src/app/dashboard/billing/page.tsx
src/app/api/billing/subscribe/route.ts
src/app/api/billing/portal/route.ts         — Stripe Customer Portal
src/app/api/webhooks/stripe/route.ts        — subscription events
```

**แผนแนะนำ (ใช้ Stripe):**
```
Starter:  ฿1,500/เดือน — 15 ห้อง, 1 OTA
Standard: ฿3,500/เดือน — 50 ห้อง, OTA ไม่จำกัด
Pro:      ฿8,000/เดือน — ไม่จำกัด, multi-property
```

**ENV ที่ต้องเพิ่ม:**
```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_STARTER_PRICE_ID=price_xxx
STRIPE_STANDARD_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
```

---

### 10. Cancellation Email
**ปัญหา:** แขกยกเลิกจาก portal → ไม่มีการแจ้งเตือนใดๆ ทั้งแขกและโรงแรม

**ไฟล์ที่ต้องแก้:**
- `src/app/api/guest/bookings/[id]/route.ts` — เพิ่ม send email หลัง update status เป็น cancelled

---

## 🟡 กลุ่ม 3 — UX เหมือนเว็บ OTA ใหญ่

### 11. Search Page
**ปัญหา:** ไม่มีหน้าค้นหาโรงแรม ลูกค้าต้องรู้ slug โรงแรมก่อนถึงเข้าได้

**ไฟล์ที่ต้องสร้าง:**
```
src/app/search/page.tsx                    — หน้าค้นหาหลัก
src/app/search/search-results.tsx          — grid ผลการค้นหา
src/app/api/public/search/route.ts         — search API
```

**Search API logic:**
```typescript
// Filter: city, type, priceMin, priceMax, rating, amenities
// Real-time availability check per hotel
// Sort: price, rating, distance (ถ้ามี lat/lng)
```

**DB ที่ต้องเพิ่ม:**
```sql
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS latitude DECIMAL;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS longitude DECIMAL;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS star_rating INT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS base_price_from DECIMAL; -- cached min price

-- Full text search
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX hotels_search_idx ON hotels USING GIN(search_vector);
```

---

### 12. Price Graph (30 วัน)
**ปัญหา:** Booking.com/Agoda แสดงกราฟราคาแต่ละวัน ช่วยแขกเลือกวันที่ถูกที่สุด

**ไฟล์ที่ต้องสร้าง:**
```
src/components/booking/price-graph.tsx
src/app/api/public/price-calendar/route.ts
```

**Logic:**
- ดึง `rate_calendar` 30-90 วันข้างหน้า
- แสดง bar chart ราคาแต่ละวัน
- Highlight วันที่ถูกที่สุด
- คลิกวันในกราฟเพื่อ set check-in

---

### 13. Photo Lightbox
**ปัญหา:** คลิกรูปในหน้าโรงแรมไม่ได้ทำอะไร

**ไฟล์ที่ต้องสร้าง:**
```
src/components/ui/lightbox.tsx
```

**Library แนะนำ:** `yet-another-react-lightbox` (ไม่มีใน package.json ต้องเพิ่ม)
หรือสร้าง custom ด้วย CSS + portal

---

### 14. Urgency Indicators
**ปัญหา:** ไม่มี FOMO signals — Trip.com แสดง "เหลือ 2 ห้อง" "มีคน 5 คนกำลังดูอยู่"

**ไฟล์ที่ต้องแก้:**
- `src/components/booking/booking-engine.tsx` — เพิ่ม urgency badge บนการ์ดห้อง
- `src/app/api/public/availability/route.ts` — return `available_rooms` count แล้ว (มีแล้ว)

**Logic:**
```typescript
// available_rooms <= 3 → แสดง "เหลือ X ห้องสุดท้าย!"
// check_in วันนี้-พรุ่งนี้ → แสดง "Last minute deal"
// peak season dates → แสดง "ราคาสูงกว่าปกติ X%"
```

---

### 15. AI Chatbot สำหรับแขก
**ปัญหา:** ระบบ AI มีแล้วใน Inbox (staff) แต่แขกไม่มีช่องทางถามคำถามก่อนจอง

**ไฟล์ที่ต้องสร้าง:**
```
src/components/booking/guest-chat-widget.tsx   — floating chat button
src/app/api/public/chat/route.ts               — ใช้ AI + knowledge_base ของโรงแรมนั้น
```

**Logic:**
- Widget ลอยอยู่มุมขวาล่างทุกหน้า booking
- ใช้ `knowledge_base` table ของโรงแรมนั้นตอบ (มีระบบอยู่แล้วใน AI suggest-reply)
- ไม่ต้อง login

---

### 16. Loyalty Points แสดงให้แขกเห็น
**ปัญหา:** แต้ม loyalty มีใน DB แต่แขกดูไม่ได้ มีแค่ใน staff dashboard

**ไฟล์ที่ต้องแก้:**
- `src/app/portal/bookings/my-bookings-client.tsx` — แสดงแต้มสะสมใน header
- `src/app/api/guest/bookings/route.ts` — JOIN กับ `guests` table เพื่อ return loyalty_points

---

### 17. Multi-currency Display
**ปัญหา:** แขกต่างชาติเห็นแค่ THB

**ไฟล์ที่ต้องสร้าง:**
```
src/lib/currency.ts              — exchange rate fetcher (ใช้ open.er-api.com ฟรี)
src/components/ui/currency-switcher.tsx
```

**ไฟล์ที่ต้องแก้:**
- `src/components/booking/booking-engine.tsx` — เพิ่ม dropdown เลือก currency
- `src/components/booking/hotel-preview.tsx` — ราคาในหน่วยที่เลือก

---

### 18. Pay at Hotel Option
**ปัญหา:** ตอนนี้มีแค่ "จ่ายออนไลน์" Booking.com มีตัวเลือก "จ่ายที่โรงแรม" ดึงดูดคนไม่อยากสำรองบัตร

**ไฟล์ที่ต้องแก้:**
- `src/components/booking/booking-engine.tsx` step details — เพิ่ม radio "จ่ายตอนนี้ / จ่ายที่โรงแรม"
- `src/app/api/reservations/route.ts` — ถ้า `payment_method = 'pay_at_hotel'` ไม่ต้อง charge

---

## 🟢 กลุ่ม 4 — Legal & Compliance

### 19. Terms of Service
**ปัญหา:** Booking engine มี link `/terms` แต่หน้าไม่มี

**ไฟล์ที่ต้องสร้าง:**
```
src/app/terms/page.tsx
```

**เนื้อหาที่ต้องมี:**
- ข้อตกลงการใช้งาน
- นโยบายการยกเลิกและคืนเงิน
- ความรับผิดชอบ
- กฎหมายที่ใช้บังคับ (กฎหมายไทย)

---

### 20. Privacy Policy (PDPA)
**ปัญหา:** เก็บข้อมูลส่วนบุคคลแต่ไม่มี privacy policy → ผิด PDPA

**ไฟล์ที่ต้องสร้าง:**
```
src/app/privacy/page.tsx
```

**เนื้อหาที่ PDPA บังคับให้มี:**
- ข้อมูลที่เก็บและวัตถุประสงค์
- ระยะเวลาเก็บข้อมูล
- สิทธิของเจ้าของข้อมูล (ขอดู, ขอลบ, ขอแก้ไข)
- ช่องทางติดต่อ DPO

---

### 21. Cookie Consent Banner
**ปัญหา:** ใช้ cookies (Supabase session) โดยไม่ขอ consent → ผิด PDPA

**ไฟล์ที่ต้องสร้าง:**
```
src/components/ui/cookie-consent.tsx
```

**Logic:**
- แสดงครั้งแรกที่เข้าเว็บ
- บันทึก consent ใน localStorage
- แบ่ง: Necessary / Analytics / Marketing

---

### 22. Data Export (PDPA Right to Portability)
**ปัญหา:** แขกมีสิทธิขอข้อมูลตัวเองทั้งหมดตาม PDPA

**ไฟล์ที่ต้องสร้าง:**
```
src/app/api/guest/export/route.ts    — return JSON ข้อมูลทั้งหมดของ guest
```

**ไฟล์ที่ต้องแก้:**
- `src/app/portal/profile/guest-profile-client.tsx` — เพิ่มปุ่ม "ดาวน์โหลดข้อมูลของฉัน"
- เพิ่มปุ่ม "ลบบัญชี" (Right to Erasure)

---

## ⚡ กลุ่ม 5 — Performance & Infrastructure

### 23. Image Optimization Pipeline
**ปัญหา:** รูปโรงแรม upload เข้า Supabase Storage ตรงๆ ไม่มี resize → ไฟล์ใหญ่ โหลดช้า

**วิธีแก้:**
```
src/app/api/storage/optimize/route.ts
```

**Logic:**
1. รับรูป
2. Resize เป็น 3 ขนาด: thumbnail (400px), medium (800px), large (1600px)
3. Convert เป็น WebP
4. Upload ทั้ง 3 เข้า Supabase Storage

**Library:** `sharp` (ต้อง install: `npm install sharp`)

---

### 24. Sentry Error Tracking
**ปัญหา:** Production ไม่รู้เมื่อมี error ต้องรอลูกค้าโทรบอก

**ไฟล์ที่ต้องสร้าง/แก้:**
```
src/app/global-error.tsx        — catch-all error boundary
sentry.client.config.ts
sentry.server.config.ts
sentry.edge.config.ts
next.config.js                  — withSentryConfig wrapper
```

**Install:** `npm install @sentry/nextjs`

**ENV:**
```
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=maitri-pms
```

---

### 25. PWA Manifest + Icons
**ปัญหา:** Staff ใช้บน iPad/Android ไม่มีไอคอน ไม่สามารถ Add to Home Screen

**ไฟล์ที่ต้องสร้าง:**
```
public/manifest.json
public/icons/
  icon-192.png
  icon-512.png
  icon-maskable-512.png
src/app/sw.ts                    — service worker (offline support)
```

**`manifest.json`:**
```json
{
  "name": "Maitri PMS",
  "short_name": "Maitri",
  "theme_color": "#2A2522",
  "background_color": "#FAF7F2",
  "display": "standalone",
  "icons": [...]
}
```

---

### 26. OpenGraph Images
**ปัญหา:** แชร์ลิงก์โรงแรมใน LINE/Facebook ไม่มีรูป preview

**ไฟล์ที่ต้องสร้าง:**
```
src/app/h/[slug]/opengraph-image.tsx   — dynamic OG image ด้วย @vercel/og
src/app/booking/[hotel]/opengraph-image.tsx
```

**ต้องมี metadata ครบในทุกหน้า public:**
```typescript
export const metadata: Metadata = {
  openGraph: {
    title, description,
    images: [{ url: hotel.hero_image_url, width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};
```

---

### 27. Database Performance
**ปัญหา:** ยังขาด index สำคัญบางตัว

**Migration ที่ต้องสร้าง:**
```sql
-- 00006_performance_indexes.sql

-- Hotel search
CREATE INDEX IF NOT EXISTS hotels_city_idx ON hotels(city);
CREATE INDEX IF NOT EXISTS hotels_type_idx ON hotels(type);
CREATE INDEX IF NOT EXISTS hotels_slug_idx ON hotels(slug);

-- Availability query (hot path)
CREATE INDEX IF NOT EXISTS reservations_checkin_checkout_idx
  ON reservations(hotel_id, check_in, check_out, status);

-- Guest portal
CREATE INDEX IF NOT EXISTS reservations_guest_account_idx
  ON reservations(guest_account_id);
CREATE INDEX IF NOT EXISTS guest_accounts_email_idx
  ON guest_accounts(email);

-- Reviews
CREATE INDEX IF NOT EXISTS reviews_hotel_rating_idx
  ON booking_reviews(hotel_id, rating);

-- Full text search
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('thai', coalesce(name,'') || ' ' ||
    coalesce(city,'') || ' ' || coalesce(description,'') || ' ' ||
    coalesce(address,''))
  ) STORED;
CREATE INDEX hotels_search_idx ON hotels USING GIN(search_vector);
```

---

### 28. Connection Pooling (Vercel + Supabase)
**ปัญหา:** Vercel serverless function เปิด DB connection ใหม่ทุกครั้ง → connection exhausted

**ไฟล์ที่ต้องแก้:**
- `src/lib/supabase/server.ts` — ใช้ `?pgbouncer=true` และ `connection_limit=1` ใน connection string

**ENV ที่ต้องแก้:**
```
# ใช้ pooler URL แทน direct URL
SUPABASE_DB_URL=postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

---

## 📱 กลุ่ม 6 — Mobile & Staff UX

### 29. Check-in QR Code
**ปัญหา:** แขกมาถึงโรงแรมต้องรอ staff เช็คชื่อ ถ้ามี QR ทำได้เร็วกว่า

**ไฟล์ที่ต้องสร้าง:**
```
src/app/portal/bookings/[code]/qr/page.tsx    — แสดง QR ให้แขก
src/app/dashboard/checkin/page.tsx            — staff scan QR
src/app/api/checkin/verify/route.ts           — verify QR token
```

---

### 30. F&B POS (Restaurant & Room Service)
**ปัญหา:** `fb_orders`, `fb_menu_items`, `fb_outlets` tables มีแล้วแต่ UI ยังเป็น Coming Soon

**ไฟล์ที่ต้องสร้าง:**
```
src/app/dashboard/fb/menu/page.tsx      — จัดการเมนู
src/app/dashboard/fb/orders/page.tsx    — รับออร์เดอร์ (KOT)
src/app/dashboard/fb/outlets/page.tsx   — จัดการร้าน
src/app/api/fb/orders/route.ts
src/app/api/fb/menu/route.ts
```

---

### 31. Spa Booking UI
**ปัญหา:** `spa_bookings`, `spa_services`, `spa_therapists` tables มีแล้วแต่ UI ยังเป็น Coming Soon

**ไฟล์ที่ต้องสร้าง:**
```
src/app/dashboard/spa/services/page.tsx    — จัดการบริการ
src/app/dashboard/spa/bookings/page.tsx    — ปฏิทินนัดหมาย
src/app/dashboard/spa/therapists/page.tsx  — จัดการนักบำบัด
src/app/api/spa/bookings/route.ts
```

---

### 32. Maintenance Requests
**ปัญหา:** `maintenance_requests` table มีแล้วแต่ไม่มี UI

**ไฟล์ที่ต้องสร้าง:**
```
src/app/dashboard/maintenance/page.tsx
src/app/api/maintenance/route.ts
```

---

## ลำดับการพัฒนาแนะนำ

```
Sprint 1 (สัปดาห์ 1-2) — ปิด Bug:
  ☐ Booking confirmation email
  ☐ Reset password page (/portal/reset-password)
  ☐ Wishlist page + API
  ☐ Terms & Privacy pages
  ☐ Email verification

Sprint 2 (สัปดาห์ 3-4) — Core Complete:
  ☐ Onboarding wizard (3 steps)
  ☐ Rate calendar UI
  ☐ Room type image upload
  ☐ Cancellation email
  ☐ Pay at hotel option

Sprint 3 (สัปดาห์ 5-6) — OTA-Level UX:
  ☐ Search page (/search)
  ☐ Price graph
  ☐ Photo lightbox
  ☐ Urgency indicators
  ☐ Guest AI chatbot widget

Sprint 4 (สัปดาห์ 7-8) — Scale & Legal:
  ☐ Subscription billing (Stripe)
  ☐ PDPA compliance (Cookie consent + Data export)
  ☐ Sentry error tracking
  ☐ Redis rate limiting
  ☐ PWA manifest + icons
  ☐ OpenGraph images

Sprint 5 (เดือน 3) — เต็มรูปแบบ:
  ☐ F&B POS
  ☐ Spa booking UI
  ☐ Maintenance requests
  ☐ Multi-currency
  ☐ Loyalty points visible to guest
  ☐ Check-in QR code
  ☐ Image optimization pipeline
  ☐ DB performance indexes
```

---

## สรุป ENV vars ที่ยังขาด

```env
# ต้องเพิ่มก่อน launch
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME="ชื่อโรงแรม"
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# ถ้าทำ Subscription billing
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# ถ้าทำ Error tracking
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

*อัพเดตล่าสุด: พฤษภาคม 2026 | Maitri PMS v1.x*

---

## 🎨 กลุ่ม 7 — UX/UI Luxury Redesign

> เป้าหมาย: ประสบการณ์ระดับ Trip.com แต่โทนหรูหรา ทันสมัย ไม่รก
> Reference: Four Seasons, Amanresorts website, Booking.com Hero UX

### UX Principles ที่ต้องยึด

```
1. Luxury-first typography — Fraunces italic สำหรับ headline, clean sans สำหรับ body
2. Whitespace breathing room — padding ใจกว้าง ไม่ยัดเนื้อหา
3. Micro-interactions — ทุก hover/click มี feedback ที่ smooth
4. Progressive disclosure — แสดงข้อมูลทีละชั้น ไม่โชว์ทุกอย่างพร้อมกัน
5. Cinematic imagery — รูปภาพ full-bleed, parallax, aspect ratio ที่สวย
```

---

### 31. Landing Page — Luxury Redesign

**ปัญหา:** Hero section ไม่มีรูปภาพจริง, pricing section ว่างเปล่า, ไม่มี testimonials

**ไฟล์:** `src/app/page.tsx`

**ต้องเพิ่ม:**

```
Hero Section:
  - Full-viewport background video/image จาก Unsplash
  - Parallax scroll effect
  - Animated text reveal (staggered)
  - CTA button with shimmer effect

Social Proof Strip:
  - Logos โรงแรมที่ใช้ระบบ (placeholder)
  - "Trusted by X hotels across Thailand"

Features Grid:
  - Icon + animated number counters
  - Hover cards with depth

Pricing Section (จริง):
  - 3 cards: Starter/Standard/Pro
  - Toggle monthly/yearly (-20%)
  - Feature checklist per plan
  - CTA button per plan

Testimonials:
  - 3 quotes จากเจ้าของโรงแรม (ภาษาไทย)
  - Avatar + hotel name + star rating

Footer:
  - Links ครบ (Terms, Privacy, Docs)
  - Social links
```

---

### 32. Hotel Public Page `/h/[slug]` — Redesign

**ต้องเพิ่ม:**
- **Hero** — Full-screen gallery grid เหมือน Airbnb (1 ใหญ่ + 4 เล็ก), "ดูรูปทั้งหมด" button
- **Sticky booking sidebar** — ราคา + date picker ติดข้างขวาตลอด
- **Animated review stars** — fill animation เมื่อ scroll เข้ามา
- **Map embed** — Google Maps static image พร้อมลิงก์
- **Amenities grid** — icon + label สวยงาม แบ่งหมวด
- **Nearby attractions** — 3-4 สถานที่ใกล้เคียง

**รูปภาพที่ต้องใช้:**
```typescript
// Luxury hotel hero images from Unsplash (free)
const HOTEL_IMAGES = {
  lobby:     'photo-1566073771259-6a8506099945', // luxury hotel lobby
  pool:      'photo-1571896349842-33c89424de2d', // infinity pool
  room:      'photo-1631049307264-da0ec9d70304', // luxury room
  dining:    'photo-1414235077428-338989a2e8c0', // fine dining
  exterior:  'photo-1542314831-068cd1dbfeeb', // hotel exterior
  beach:     'photo-1582719478250-c89cae4dc85b', // beachside resort
  spa:       'photo-1540555700478-4be289fbecef', // spa
  suite:     'photo-1611892440504-42a792e24d32', // presidential suite
};
```

---

### 33. Booking Engine — Luxury UX

**ต้องเพิ่ม:**
- **Animated step indicator** — progress bar ที่ animate
- **Room cards** — fullscreen image hover, amenity tags สวย
- **Date picker** — calendar UI แบบ 2 เดือน side-by-side
- **Price breakdown accordion** — expand/collapse
- **Trust badges** — 🔒 SSL · ✓ Verified · 🛡 Secure Payment
- **Loading skeleton** — ขณะโหลด availability

---

### 34. Search Page — UX Upgrade

**ต้องเพิ่ม:**
- **Animated search bar** — expand on focus
- **Map/List toggle** — เลือกดูแบบ map หรือ list
- **Infinite scroll** — โหลดเพิ่มเมื่อ scroll
- **Filter chips** — แสดง active filters เป็น removable chips
- **Hotel card hover** — slide รูป + show amenities
- **Compare mode** — เลือกสูงสุด 3 โรงแรมมาเปรียบเทียบ

---

### 35. Animation System — Global

**ไฟล์:** `src/app/globals.css`, `tailwind.config.js`

**Animations ที่ต้องเพิ่ม:**

```css
/* Stagger children animation */
.stagger-children > * { animation: fade-in-up var(--duration, 0.5s) var(--ease-out) both; }
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 80ms; }
.stagger-children > *:nth-child(3) { animation-delay: 160ms; }
.stagger-children > *:nth-child(4) { animation-delay: 240ms; }
.stagger-children > *:nth-child(5) { animation-delay: 320ms; }

/* Scroll reveal (IntersectionObserver) */
.reveal { opacity: 0; transform: translateY(20px); transition: all 0.6s var(--ease-out); }
.reveal.visible { opacity: 1; transform: translateY(0); }

/* Number ticker */
@keyframes ticker { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }

/* Shimmer loading */
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

/* Magnetic hover (JS + CSS) */
.magnetic { transition: transform 0.3s var(--ease-spring); }

/* Page transition */
@keyframes page-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
```

**JS Interactions ที่ต้องเพิ่ม:**
```typescript
// src/hooks/use-scroll-reveal.ts — IntersectionObserver
// src/hooks/use-counter.ts — animated number counter
// src/hooks/use-parallax.ts — parallax on scroll
// src/components/ui/animated-number.tsx — เลข animate ขึ้น
// src/components/ui/image-reveal.tsx — รูปเปิดเหมือน curtain
```

---

### 36. Image Strategy

**ใช้ Unsplash Free (ไม่ต้องขอ API key สำหรับ static URL)**

```typescript
// src/lib/images.ts
export const IMAGES = {
  // Landing page
  heroHotel:    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&auto=format&fit=crop',
  heroPool:     'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&auto=format&fit=crop',
  heroLobby:    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&auto=format&fit=crop',

  // Room types
  deluxeRoom:   'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop',
  suite:        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format&fit=crop',
  poolVilla:    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
  standardRoom: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop',

  // Amenities
  spa:          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop',
  dining:       'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop',
  pool:         'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&auto=format&fit=crop',
  gym:          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop',

  // Thailand scenes
  bangkok:      'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&auto=format&fit=crop',
  chiangMai:    'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&auto=format&fit=crop',
  phuket:       'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&auto=format&fit=crop',
  samui:        'https://images.unsplash.com/photo-1562602833-0f4ab2fc46e5?w=800&auto=format&fit=crop',
};
```

**หลักการเลือกรูป:**
- ✅ ใช้รูป landscape ที่มี depth
- ✅ โทนสี warm (terracotta, golden, ivory)
- ✅ Subject: luxury hotel, infinity pool, beachfront villa, fine dining
- ❌ หลีกเลี่ยง stock photo ที่ดูถูก
- ❌ ไม่ใช้รูปที่มีคนมากเกินไป

---

### 37. Color Palette Expansion

```css
/* Luxury palette extension */
:root {
  /* Core */
  --ivory:      #FAF7F2;
  --espresso:   #2A2522;
  --terracotta: #C66A30;
  --sage:       #7A8471;

  /* Luxury additions */
  --champagne:  #F5E6C8;   /* warm gold background */
  --obsidian:   #1A1614;   /* darker than espresso */
  --linen:      #F0EBE1;   /* slightly darker than ivory */
  --teak:       #8B6914;   /* dark gold accent */
  --pearl:      #FAFAFA;   /* pure white with warmth */
  --smoke:      #9A8F88;   /* warm gray */

  /* Gradients */
  --gradient-luxury: linear-gradient(135deg, var(--espresso) 0%, #4a3828 100%);
  --gradient-gold:   linear-gradient(135deg, #C66A30 0%, #E8892A 50%, #C66A30 100%);
  --gradient-hero:   linear-gradient(180deg, transparent 40%, rgba(26,22,20,0.85) 100%);
}
```

---

### 38. Typography Scale

```css
/* Luxury type system */
.display-hero   { font: 700 clamp(3rem,10vw,8rem)/0.9 'Fraunces', serif; letter-spacing: -0.03em; }
.display-large  { font: 600 clamp(2rem,6vw,5rem)/1.0 'Fraunces', serif; letter-spacing: -0.02em; }
.display-medium { font: 500 clamp(1.5rem,4vw,3rem)/1.1 'Fraunces', serif; }
.heading        { font: 600 1.25rem/1.3 'Plus Jakarta Sans', sans-serif; }
.body-large     { font: 400 1.125rem/1.7 'Plus Jakarta Sans', sans-serif; }
.caption        { font: 400 0.75rem/1.5 'Plus Jakarta Sans', sans-serif; letter-spacing: 0.04em; }
.overline       { font: 600 0.625rem/1 'Plus Jakarta Sans', sans-serif; letter-spacing: 0.15em; text-transform: uppercase; }
```

---

### 39. Component Upgrades

**Buttons:**
```typescript
// Luxury primary button — shimmer on hover
<button className="relative overflow-hidden bg-espresso text-ivory px-8 py-4 rounded-full
  before:absolute before:inset-0 before:bg-gradient-gold before:translate-x-[-100%]
  hover:before:translate-x-0 before:transition-transform before:duration-500">
  จองเลย
</button>
```

**Cards:**
```typescript
// Hotel card — parallax image on hover
<div className="group overflow-hidden rounded-3xl">
  <img className="scale-100 group-hover:scale-110 transition-transform duration-700 ease-out" />
  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
    {/* Content slides up */}
  </div>
</div>
```

**Numbers:**
```typescript
// Animated counter
<AnimatedNumber value={142} suffix=" โรงแรม" duration={2000} />
```

---

### ลำดับ Implementation

```
Phase 1 (สัปดาห์ 1) — Foundation:
  ☐ เพิ่ม animation utilities ใน globals.css
  ☐ สร้าง useScrollReveal, useCounter hooks
  ☐ สร้าง AnimatedNumber component
  ☐ สร้าง src/lib/images.ts
  ☐ Luxury color palette

Phase 2 (สัปดาห์ 2) — Landing Page:
  ☐ Hero: full-viewport + parallax + real hotel image
  ☐ Social proof strip
  ☐ Features: animated counters
  ☐ Pricing section จริง (3 plans)
  ☐ Testimonials (3 quotes)
  ☐ Footer ครบ

Phase 3 (สัปดาห์ 3) — Guest Pages:
  ☐ Hotel public page: Airbnb-style gallery
  ☐ Sticky booking sidebar
  ☐ Amenities grid with icons
  ☐ Booking engine: date picker redesign
  ☐ Trust badges + security signals

Phase 4 (สัปดาห์ 4) — Search + Polish:
  ☐ Search: Map/List toggle
  ☐ Hotel card hover animations
  ☐ Filter chips UX
  ☐ Global page transitions
  ☐ Micro-interactions ทุก button
  ☐ Loading skeletons ทุกหน้า
```


## Prepared External Setup Layer — added

- Billing & Subscription: `/dashboard/billing`, `/api/billing/subscribe`, `/api/billing/portal`, `/api/webhooks/stripe`
- Maintenance: `/dashboard/maintenance`, `/api/maintenance`
- QR Check-in: `/dashboard/checkin`, `/portal/bookings/[code]/qr`, `/api/checkin/verify`
- F&B: `/dashboard/fb/menu`, `/dashboard/fb/orders`, `/dashboard/fb/outlets`, `/api/fb/menu`, `/api/fb/orders`
- Spa: `/dashboard/spa/services`, `/dashboard/spa/bookings`, `/dashboard/spa/therapists`, `/api/spa/bookings`
- PDPA export: `/api/guest/export`
- PWA shell and OpenGraph image routes

Remaining manual work: create external accounts, copy real API keys into Vercel env, redeploy, and replace placeholder provider calls with live provider SDK calls.
