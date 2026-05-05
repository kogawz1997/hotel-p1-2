# Changelog

All notable changes to Maitri are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-02

### Added — Initial Public Release

#### Core Platform
- Next.js 15 + TypeScript + Supabase architecture
- Multi-tenant data model with Postgres Row Level Security
- 40+ database tables covering Phase 1, 2, and 3 features
- Auth with email/password (Supabase Auth)
- Custom design system with Fraunces + Inter typography

#### AI-First Inbox
- Multi-channel inbox: LINE, WhatsApp, WeChat, Email, Web
- AI translation across 14 languages with cultural tone adaptation
- AI suggested replies (Claude 3.5 Sonnet)
- Real-time message updates via Supabase Realtime
- Read/delivered/sent message status tracking

#### Reservation Management
- Calendar grid view (14-day rolling) + list view
- Create reservation with guest CRM auto-link
- Status workflow: pending → confirmed → checked_in → checked_out
- Folio + auto-invoice generation

#### Hotel Operations
- Room types and rooms management
- Room status tracking (available/occupied/cleaning/maintenance/blocked)
- Housekeeping kanban board (pending/in_progress/completed)
- Guest CRM with VIP and loyalty tier support

#### Distribution
- Channel adapters: LINE (full), WhatsApp (full), Email, WeChat (stub)
- Channel Manager interface with HotelRunner + Booking.com adapter stubs
- OTA management page with connection status
- Public booking engine (4-step wizard)

#### Finance & Compliance
- Omise payment integration with PromptPay QR support
- Invoice management with e-Tax (UBL 2.0 XML) pipeline
- ทร.30 (immigration report) automation for foreign guests
- Accounting integration stubs (PEAK, FlowAccount, Express, Xero)

#### Reports & Analytics
- Dashboard KPIs: Occupancy, ADR, RevPAR, today's check-ins/outs
- 30-day revenue trends with area chart
- Channel mix pie chart
- Time-aware Thai greetings (อรุณสวัสดิ์/สวัสดี/สวัสดีตอนเย็น)

#### Developer Experience
- TypeScript strict mode
- Tailwind CSS with custom design tokens (warm hospitality palette)
- Radix UI primitives (Dialog, Select, etc.)
- Framer Motion-ready animations
- Sonner toast notifications

#### Documentation
- README with architecture diagrams
- 30-minute Quick Start guide
- 6 detailed integration guides (LINE, WhatsApp, Omise, e-Tax, ทร.30, Channel Manager, Accounting)
- Architecture overview
- Deployment guide for Vercel + self-hosting
- Database schema documentation

### Phase 2 (Schema Ready, UI Coming)
- F&B POS placeholder pages
- Spa booking placeholder pages
- Loyalty Program with tiers (Bronze/Silver/Gold)
- Marketing campaigns scaffold
- Reviews aggregation

### Known Limitations
- Direct OTA integrations (Booking.com, Agoda) require partner approval (4-16 weeks)
- e-Tax requires service provider subscription (INET, Frank.co.th)
- WhatsApp Business requires Meta verification (3-5 days)
- Some pages are placeholders pending Phase 2 development

---

## Future Releases

### [0.2.0] - Planned Q3 2026
- F&B POS frontend
- Spa booking system
- Dynamic pricing AI
- Booking.com Direct API (after approval)
- Mobile UI polish

### [0.3.0] - Planned Q4 2026
- Multi-property/chain support
- Native mobile apps (React Native)
- Loyalty referral program
- Marketing automation flows
- WeChat Mini Program

### [1.0.0] - Planned Q1 2027
- Public API for third-party integrations
- White-label support
- SEA expansion-ready (Vietnam, Indonesia, Philippines)
- Production hardening (monitoring, observability, scale testing)
