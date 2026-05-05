<div align="center">

<br/>

<h1>
  <img src="https://em-content.zobj.net/source/apple/354/lotus_1fab7.png" width="40" /><br/>
  Maitri PMS
</h1>

<p><strong>Hotel Operating System สำหรับโรงแรมไทย</strong><br/>
AI-first · Multi-tenant SaaS · Guest Portal · Channel Manager · e-Tax · ทร.30</p>

<br/>

[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth+DB+Realtime-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Claude AI](https://img.shields.io/badge/Claude-3.5_Sonnet-CC785C?style=flat-square)](https://anthropic.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![License MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)

<br/>

[**Live Demo**](https://maitri-demo.vercel.app) · [Quick Start](#-quick-start) · [Features](#-features) · [Architecture](#-architecture) · [Roadmap](#-roadmap)

<br/>

</div>

---

## ภาพรวม

Maitri คือ **Hotel PMS แบบ SaaS สำหรับตลาดไทย** รวมทุกสิ่งที่โรงแรมต้องการในที่เดียว — จัดการห้องพัก รับจอง ออกใบกำกับภาษีอิเล็กทรอนิกส์ ส่ง ทร.30 อัตโนมัติ ตอบแขกด้วย AI ใน LINE/WhatsApp และมีหน้า Booking Engine + Guest Portal สำหรับแขกจองตรง

สร้างด้วย **Next.js 15 App Router**, **Supabase**, **Claude 3.5 Sonnet** พร้อม deploy บน **Vercel** ในคลิกเดียว

---

## ✨ Features

### 🏨 Hotel Dashboard — ระบบหลังบ้านครบวงจร

<table>
<tr>
<td width="50%">

**📅 Reservation Management**
- Calendar view + List view
- Real-time availability check
- Walk-in + Phone + OTA booking
- Auto room assignment
- Check-in/out workflow

**🏠 Room Management**
- ประเภทห้อง + ราคา + รูปภาพ
- สถานะห้องแบบ real-time
- Housekeeping Kanban board
- Maintenance request tracking

**💰 Accounting & Tax**
- e-Tax invoice (UBL 2.0)
- FlowAccount + PEAK integration
- Omise payment + PromptPay
- Folio + payment management

</td>
<td width="50%">

**🤖 AI Multi-language Inbox**
- LINE, WhatsApp, Email รวมที่เดียว
- AI ตอบ 14 ภาษา อัตโนมัติ
- Knowledge base per hotel
- Sentiment analysis + routing

**📊 Reports & Analytics**
- ADR, RevPAR, Occupancy
- Revenue by channel + date range
- Export CSV (รายงาน + reservations)
- TM30 compliance dashboard

**👥 Team Management**
- Role-based access (6 roles)
- Email invitation flow
- Audit log ทุก action
- Multi-staff support

</td>
</tr>
</table>

### 🌐 Guest Portal — ระบบสำหรับผู้เข้าพัก

<table>
<tr>
<td width="50%">

**🔐 Auth แยกขาดจาก Staff**
- Login / Register / Forgot password
- บัญชีแขก ≠ บัญชี staff โดยสมบูรณ์
- Middleware protection ทุก route

**📋 My Bookings**
- ดูการจองทั้งหมด
- ยกเลิก + เลือกเหตุผล
- แก้ไข special requests
- รีวิว 5 หมวด (verified stay)

</td>
<td width="50%">

**🏪 Hotel Public Page `/h/[slug]`**
- Hero gallery grid (4-panel)
- ห้องพักทุกประเภท + ราคา
- รีวิวจริง + reply โรงแรม
- SEO metadata + OpenGraph

**🎨 Branding & Gallery**
- Upload logo + hero image
- Gallery management
- Hotel tagline + description

</td>
</tr>
</table>

### 📦 Booking Engine — จองตรง 5 ขั้นตอน

```
┌──────────────────────────────────────────────────────────────────────┐
│  [1] วันที่  →  [2] ห้อง  →  [3] ข้อมูล  →  [4] ตรวจสอบ  →  [5] ยืนยัน
│                                                                       │
│  Hero Gallery   Availability    Rate plan       VAT breakdown   Code  │
│  Date picker    จากDB จริง      Flexible/NR     Policy display  Email │
└──────────────────────────────────────────────────────────────────────┘
```

### 🔌 Integrations

| Category | Services |
|---|---|
| **OTA Channels** | Booking.com · Agoda · Airbnb · Expedia · Trip.com · Hostelworld |
| **Messaging** | LINE Messaging API · WhatsApp Business · SendGrid Email |
| **Payments** | Omise (PromptPay + Cards + Webhook) · Stripe-ready |
| **Accounting** | FlowAccount · PEAK · eTax INET · UBL 2.0 |
| **Compliance** | ทร.30 Immigration API · PDPA-ready |
| **AI** | Claude 3.5 Sonnet · Claude Haiku (sentiment) |
| **Infrastructure** | Supabase · Vercel sin1 · Upstash Redis |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Guests / Travelers                           │
│       LINE · WhatsApp · Email · Web Browser · OTA Apps          │
└────────────────┬────────────────────────────────────────────────┘
                 │ Webhooks + Direct requests
┌────────────────▼────────────────────────────────────────────────┐
│               Next.js 15  (Vercel — sin1 Singapore)             │
│                                                                  │
│  /portal/*          /dashboard/*          /booking/[hotel]       │
│  Guest Portal        Hotel Staff            Public Booking        │
│  (guest auth)        (staff auth)           (no auth needed)      │
│       │                   │                       │              │
│       └───────────────────┼───────────────────────┘              │
│                           ▼                                      │
│              API Route Handlers (33 routes)                      │
│    reservations · ai · guest · public · payments · webhooks      │
│         compliance · invoices · reports · team · cron            │
│                           │                                      │
│        ┌──────────────────┼──────────────────┐                  │
│        ▼                  ▼                  ▼                   │
│   Claude AI          Channel Adapters    Omise Payment           │
│   (14 languages)     LINE/WA/Email/OTA   PromptPay+Cards         │
└────────────────────────────────────────────────────────────────┘
                            │
           ┌────────────────▼─────────────────────────┐
           │            Supabase Platform               │
           │                                           │
           │  PostgreSQL 15     Auth (JWT)   Realtime  │
           │  49 tables         2 user types  WS       │
           │  Row Level Sec.    Guest+Staff   Presence  │
           │                                           │
           │  Storage (hotel-assets bucket)            │
           └───────────────────────────────────────────┘
```

### Database — 49 Tables, 5 Migrations

```
organizations ──┬── hotels ──┬── room_types ── rooms
                │            │── rate_calendar
                │            │── rate_plans
                │            │── hotel_gallery
                │            │── knowledge_base
                │            └── channel_connections
                │
                └── user_profiles (staff)
                    └── audit_logs

reservations ───┬── guests ──── loyalty_transactions
                │              └── guest_accounts (portal)
                │── folio_items    guest_wishlists
                │── payments       booking_reviews
                └── invoices

conversations ──── messages ──── ai_message_logs

housekeeping_tasks · maintenance_requests
marketing_campaigns · loyalty_tiers
tm30_reports · tax_filings
fb_orders · spa_bookings
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 22+**
- **Supabase account** — [supabase.com](https://supabase.com) (free)
- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com)

### 1 — Clone & Install

```bash
git clone https://github.com/yourusername/maitri.git
cd maitri
npm install
```

### 2 — Environment

```bash
# Demo mode (ใช้ได้เลยสำหรับ dev)
npm run demo    # cp .env.demo .env.local อัตโนมัติ

# Production
cp .env.demo .env.local
# แก้ค่าในไฟล์ .env.local
```

**Required environment variables:**

```env
# Supabase (Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# AI
ANTHROPIC_API_KEY=sk-ant-api03-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your-random-secret-here

# Messaging (optional for dev)
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
WHATSAPP_ACCESS_TOKEN=...
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Payment (optional for dev)
OMISE_SECRET_KEY=skey_test_...
OMISE_PUBLIC_KEY=pkey_test_...
```

### 3 — Database Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login + link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Push all 5 migrations (49 tables + RLS)
supabase db push
```

### 4 — Run

```bash
npm run dev
```

| URL | คำอธิบาย |
|-----|---------|
| `localhost:3000` | Landing page |
| `localhost:3000/auth/signup` | สมัครบัญชีโรงแรม |
| `localhost:3000/dashboard` | Hotel dashboard |
| `localhost:3000/portal/login` | Guest portal login |
| `localhost:3000/h/[slug]` | Hotel public page |
| `localhost:3000/booking/[slug]` | Booking engine |

### 5 — Deploy to Vercel

```bash
# One-command deploy
vercel --prod
```

หรือเชื่อม GitHub repo และตั้งค่า env vars ใน Vercel Dashboard
ดูคู่มือละเอียดใน [`.github/SETUP_VERCEL.md`](.github/SETUP_VERCEL.md)

---

## 📁 Project Structure

```
maitri/
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Landing page
│   │   ├── auth/                         # Hotel staff auth
│   │   ├── portal/                       # Guest portal (แยกจาก staff)
│   │   │   ├── login/                    # Login + Register + Forgot
│   │   │   ├── bookings/                 # My bookings + cancel + review
│   │   │   └── profile/                  # Profile + security + preferences
│   │   ├── dashboard/                    # Hotel staff (21 pages)
│   │   │   ├── reservations/             # Calendar + list
│   │   │   ├── rooms/                    # Room management
│   │   │   ├── inbox/                    # AI multi-channel inbox
│   │   │   ├── housekeeping/             # Kanban board
│   │   │   ├── accounting/               # Invoices + TM30
│   │   │   ├── reports/                  # Analytics + CSV export
│   │   │   ├── guests/                   # Guest DB + detail
│   │   │   ├── loyalty/                  # Loyalty program
│   │   │   ├── channels/                 # OTA channel manager
│   │   │   ├── marketing/                # Campaigns + reviews
│   │   │   ├── knowledge/                # AI knowledge base
│   │   │   ├── branding/                 # Logo + gallery
│   │   │   ├── settings/                 # Hotel + team
│   │   │   ├── audit/                    # Audit log
│   │   │   └── system/                   # System control center
│   │   ├── h/[slug]/                     # Hotel public landing page
│   │   ├── booking/[hotel]/              # Booking engine (5 steps)
│   │   └── api/                          # 33 Route handlers
│   │
│   ├── components/
│   │   ├── ui/                           # Design system
│   │   ├── layout/                       # Sidebar, topbar, mobile nav
│   │   ├── booking/                      # Booking engine components
│   │   ├── dashboard/                    # Feature clients
│   │   └── providers/                    # Theme + i18n
│   │
│   └── lib/
│       ├── ai/                           # Claude integration
│       ├── auth/                         # Guards + middleware helpers
│       ├── channels/                     # LINE, WA, Email adapters
│       ├── channel-manager/              # OTA sync
│       ├── payments/                     # Omise adapter
│       ├── compliance/                   # TM30, eTax
│       ├── security/                     # Rate limit, webhook verify
│       ├── i18n/                         # TH/EN/ZH/JA translations
│       └── supabase/                     # Client + server helpers
│
├── supabase/migrations/
│   ├── 00001_initial_schema.sql          # 44 tables, RLS, indexes
│   ├── 00002_production_saas_hardening.sql
│   ├── 00003_team_audit_improvements.sql
│   ├── 00004_hotel_gallery_and_branding.sql
│   └── 00005_guest_portal.sql            # guest_accounts, reviews
│
├── .github/
│   ├── workflows/ci.yml                  # Lint → Build → Deploy
│   └── SETUP_VERCEL.md
│
├── ROADMAP.md                            # Detailed roadmap + code hints
├── TODO.md                               # Sprint checklist
└── .env.demo                             # Demo keys (dev ready)
```

---

## 🛣 Roadmap

### ✅ v1.0 — เสร็จแล้ว

- [x] Hotel staff dashboard — 21 หน้า, 33 API routes
- [x] AI multi-language inbox (LINE + WhatsApp + Email, 14 ภาษา)
- [x] Reservation management + calendar grid
- [x] Housekeeping kanban board
- [x] Channel manager UI (6 OTA + aggregator guide)
- [x] Omise payment + PromptPay + webhook verification
- [x] e-Tax invoice + UBL 2.0 + eTax INET submission
- [x] ทร.30 auto-report + cron reminder
- [x] Guest database + loyalty tiers + points history
- [x] Marketing campaigns + OTA review management
- [x] Knowledge base + AI test panel
- [x] Branding & gallery management
- [x] Reports (ADR/RevPAR/Occupancy) + CSV export
- [x] Team management + RBAC (6 roles)
- [x] Audit log viewer
- [x] System control center (12 feature toggles)
- [x] Guest portal — auth แยกขาดจาก staff
- [x] Booking engine — 5-step, availability จริง, rate plans
- [x] Hotel public page `/h/[slug]`
- [x] My Bookings — ยกเลิก, คำขอพิเศษ, รีวิว 5 หมวด
- [x] Dark/Light mode + i18n (TH/EN/ZH/JA)
- [x] Multi-tenant SaaS + Row Level Security
- [x] CI/CD pipeline (GitHub Actions → Vercel)

---

### 🔴 v1.1 — Sprint 1: Critical (กำลังทำ)

| # | Feature | ไฟล์หลัก | สถานะ |
|---|---------|---------|-------|
| 1 | **Booking confirmation email** | `src/app/api/reservations/route.ts` | ☐ |
| 2 | **Guest reset password page** | `src/app/portal/reset-password/page.tsx` | ☐ |
| 3 | **Wishlist page + API** | `src/app/portal/wishlist/` | ☐ |
| 4 | **Terms of Service** | `src/app/terms/page.tsx` | ☐ |
| 5 | **Privacy Policy (PDPA)** | `src/app/privacy/page.tsx` | ☐ |
| 6 | **Email verification flow** | Supabase config + login UI | ☐ |

---

### 🟠 v1.2 — Sprint 2: Core Complete

| # | Feature | ไฟล์หลัก | สถานะ |
|---|---------|---------|-------|
| 7 | **Onboarding wizard** | `src/app/onboarding/` (3 steps) | ☐ |
| 8 | **Rate calendar UI** | `src/app/dashboard/rates/page.tsx` | ☐ |
| 9 | **Room type image upload** | `src/components/dashboard/rooms-client.tsx` | ☐ |
| 10 | **Subscription billing (Stripe)** | `src/app/dashboard/billing/` | ☐ |
| 11 | **Cancellation email** | `src/app/api/guest/bookings/[id]/route.ts` | ☐ |
| 12 | **Pay at hotel option** | `src/components/booking/booking-engine.tsx` | ☐ |

---

### 🟡 v1.3 — Sprint 3: OTA-Level UX

| # | Feature | ไฟล์หลัก | สถานะ |
|---|---------|---------|-------|
| 13 | **Search page** `/search` | `src/app/search/` + `src/app/api/public/search/` | ☐ |
| 14 | **Price graph 30 วัน** | `src/components/booking/price-graph.tsx` | ☐ |
| 15 | **Photo lightbox** | `src/components/ui/lightbox.tsx` | ☐ |
| 16 | **Urgency indicators** | booking-engine.tsx (ใช้ available_rooms ที่มีแล้ว) | ☐ |
| 17 | **Guest AI chatbot widget** | `src/components/booking/guest-chat-widget.tsx` | ☐ |
| 18 | **Multi-currency display** | `src/lib/currency.ts` + switcher | ☐ |
| 19 | **Loyalty points สำหรับแขก** | my-bookings-client.tsx + API | ☐ |

---

### 🟢 v2.0 — Sprint 4: Scale & Legal

| # | Feature | ไฟล์หลัก | สถานะ |
|---|---------|---------|-------|
| 20 | **Redis rate limiting** | `src/lib/security/rate-limit.ts` → Upstash | ☐ |
| 21 | **Cookie consent (PDPA)** | `src/components/ui/cookie-consent.tsx` | ☐ |
| 22 | **Data export (PDPA)** | `src/app/api/guest/export/route.ts` | ☐ |
| 23 | **Sentry error tracking** | `sentry.*.config.ts` + next.config.js | ☐ |
| 24 | **PWA manifest + icons** | `public/manifest.json` + SW | ☐ |
| 25 | **OpenGraph images** | `src/app/h/[slug]/opengraph-image.tsx` | ☐ |
| 26 | **Image optimization** | `src/app/api/storage/optimize/route.ts` (sharp) | ☐ |
| 27 | **DB performance indexes** | `supabase/migrations/00006_performance.sql` | ☐ |

---

### ⚡ v3.0 — Sprint 5: Full Platform

| # | Feature | สถานะ |
|---|---------|-------|
| 28 | **F&B POS** — menu, orders, KOT (schema มีแล้ว) | ☐ |
| 29 | **Spa booking UI** — services, therapists, calendar (schema มีแล้ว) | ☐ |
| 30 | **Maintenance requests** — schema มีแล้ว | ☐ |
| 31 | **QR check-in** — แขก scan ที่ counter | ☐ |
| 32 | **Multi-property support** — chain hotels | ☐ |
| 33 | **Mobile app** — React Native | ☐ |
| 34 | **SEA expansion** — Vietnam, Indonesia, Malaysia | ☐ |

> 📋 รายละเอียดแต่ละ item พร้อม code snippets, ไฟล์ที่ต้องแก้, และ ENV vars อยู่ใน [**ROADMAP.md**](ROADMAP.md)

---

## 💸 Economics

### Operating Cost

| Service | Free Tier | Production |
|---|---|---|
| Vercel | $0 | $20/mo |
| Supabase | $0 | $25/mo |
| Anthropic API | $5 credit | $50–300/mo |
| Upstash Redis | $0 | $0–10/mo |
| Domain + Email | — | $15/yr |
| **Total** | **$5** | **~$100–360/mo** |

### Unit Economics ที่ Scale

```
30 hotels × ฿3,500/เดือน = ฿105,000 MRR
Infrastructure              ฿3,600/เดือน
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gross Margin                96.6%
```

### Pricing Plans

| Plan | ราคา | ห้อง | Users | OTA |
|---|---|---|---|---|
| Starter | ฿1,500/เดือน | ≤15 | 1 | 1 ช่องทาง |
| Standard | ฿3,500/เดือน | ≤50 | 5 | ไม่จำกัด |
| Pro | ฿8,000/เดือน | ไม่จำกัด | ไม่จำกัด | ไม่จำกัด + Multi-property |

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) · React 18 · TypeScript 5 |
| **Styling** | Tailwind CSS 3 · Radix UI · Framer Motion · Recharts |
| **Database** | Supabase Postgres 15 · Row Level Security · Realtime |
| **Auth** | Supabase Auth (JWT) · Dual-system (staff + guest) |
| **AI** | Anthropic Claude 3.5 Sonnet · Claude Haiku |
| **Channels** | LINE Messaging API · WhatsApp Business · SendGrid |
| **Payments** | Omise (PromptPay + Cards) · Stripe-ready |
| **Compliance** | UBL 2.0 eTax · ทร.30 Immigration API · PDPA |
| **Infrastructure** | Vercel (sin1) · Upstash Redis · GitHub Actions |

---

## 🔒 Security

- **Row Level Security** บนทุก table — hotel data isolation
- **Rate limiting** ทุก API endpoint ที่ sensitive
- **Webhook signature verification** — Omise, LINE, WhatsApp
- **Dual auth system** — staff และ guest แยกขาดสมบูรณ์
- **Security headers** — HSTS, X-Frame-Options, nosniff, Permissions-Policy
- **CRON_SECRET** — ป้องกัน unauthorized cron execution
- **Service role key** — ใช้ฝั่ง server เท่านั้น ไม่ expose ใน client

ดูรายละเอียดใน [SECURITY.md](SECURITY.md)

---

## 🤝 Contributing

ดู [CONTRIBUTING.md](CONTRIBUTING.md) สำหรับ guidelines

```bash
# Fork → Clone → Branch
git checkout -b feature/your-feature

# Develop → Lint → PR
npm run lint
npm run build
git push origin feature/your-feature
```

---

## 📄 License

MIT © 2026 Maitri Hospitality Tech

---

<div align="center">

Built with ❤️ in Thailand 🇹🇭

Powered by [Claude](https://anthropic.com) · [Supabase](https://supabase.com) · [Vercel](https://vercel.com)

</div>
