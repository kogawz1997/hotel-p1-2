# Maitri Prepared Launch Layer

This patch prepares external-service features so the app can deploy before real signup / verification is finished.

## Added ready pages

- `/dashboard/billing` — subscription/billing provider setup
- `/dashboard/maintenance` — maintenance request board setup
- `/dashboard/checkin` — QR/self check-in setup
- `/dashboard/fb/menu` — F&B menu setup
- `/dashboard/fb/orders` — F&B orders setup
- `/dashboard/fb/outlets` — F&B outlets setup
- `/dashboard/spa/services` — spa service catalog setup
- `/dashboard/spa/bookings` — spa booking setup
- `/dashboard/spa/therapists` — therapist roster setup
- `/portal/bookings/[code]/qr` — guest booking QR placeholder

## Added ready APIs

- `/api/billing/subscribe`
- `/api/billing/portal`
- `/api/webhooks/stripe`
- `/api/fb/menu`
- `/api/fb/orders`
- `/api/spa/bookings`
- `/api/maintenance`
- `/api/checkin/verify`
- `/api/storage/optimize`
- `/api/guest/export`

## Added production shells

- PWA manifest and SVG icons
- Dynamic OpenGraph image routes for hotel and booking pages
- Global error boundary prepared for Sentry DSN later
- `.env.example` placeholders for billing, Sentry, storage, Upstash Redis, and printer bridge

## Fixed obvious blockers

- Fixed broken JSX in `src/components/booking/booking-engine.tsx`
- Fixed duplicate/broken lucide import in `src/components/layout/sidebar.tsx`
- Added sidebar links for Billing, Maintenance, and QR Check-in
- Fixed `src/app/api/reservations/route.ts` references to block-scoped `ctx` / `hotel`, added email template imports, and added `roomTypeName` to schema

## Manual work still required

1. Create accounts / verify services: Stripe or Omise, SendGrid, LINE, Supabase Storage, Sentry, Upstash if used.
2. Add env values in Vercel for Production / Preview / Development.
3. Redeploy.
4. Replace placeholder API responses with live provider SDK calls feature-by-feature.
