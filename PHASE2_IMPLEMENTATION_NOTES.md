# Phase 2 Implementation Notes — Business Core

## Completed in this pass

### Subscription billing

- Added Stripe-ready checkout endpoint: `POST /api/billing/subscribe`.
- Added Stripe-ready customer portal endpoint: `POST /api/billing/portal`.
- Added Stripe webhook endpoint: `POST /api/webhooks/stripe`.
- Webhook handles:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.deleted`
- Added organization billing columns via migration `00007_phase2_business_compliance.sql`.
- Dashboard billing page now shows current plan/status and plan cards.

### Suspend tenant readiness

- Organizations now support `past_due`, `unpaid`, `suspended`, `incomplete`.
- Dashboard layout displays a billing warning banner when subscription status blocks normal operation.
- Data is not deleted when billing fails. Export remains possible. Good, because being lawful is inconvenient but useful.

### Hotel payments

- Added `POST /api/payments/record` for manual/cash/bank/PromptPay/OTA-paid payment recording.
- Updates `reservations.paid_amount`.
- Adds folio payment line when `folioId` is provided.
- Adds receipt metadata to `payments`.
- Added `GET /api/receipts/[paymentId]` JSON receipt endpoint.

### PDPA

- Rebuilt `GET /api/guest/export` to export guest account, bookings, wishlist, reviews, deletion requests, and consent logs.
- Added `POST /api/guest/delete-request`.
- Added guest profile UI buttons for data download and delete request.
- Added `consent_logs` and `data_deletion_requests` tables.

### Audit log

- Added `src/lib/audit.ts` helper.
- Extended audit logs with `organization_id`, `before`, and `after` JSONB columns.
- Billing checkout and payment recording now write audit entries.

### Backup / Restore

- Added `backup_run_logs` table.
- Added `GET /api/backup/status`.
- Added `BACKUP_RESTORE.md` runbook.

## Required manual setup

### Stripe

Create products/prices in Stripe and add these env vars:

```txt
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_STANDARD=
STRIPE_PRICE_PRO=
STRIPE_PRICE_ENTERPRISE=
NEXT_PUBLIC_APP_URL=
```

Webhook URL:

```txt
https://YOUR_DOMAIN/api/webhooks/stripe
```

### Supabase

Apply migration:

```txt
supabase/migrations/00007_phase2_business_compliance.sql
```

## Manual test flow

1. Login as hotel owner.
2. Open `/dashboard/billing`.
3. Click Subscribe while Stripe env is missing.
   - Expected: prepared message, no crash.
4. Add Stripe env vars and redeploy.
5. Click Subscribe again.
   - Expected: Stripe Checkout URL returned and browser redirects.
6. Complete checkout in Stripe test mode.
7. Confirm webhook updates `organizations.subscription_status = active`.
8. Send `invoice.payment_failed` test event.
   - Expected: organization becomes `past_due` and dashboard banner appears.
9. Open guest portal profile.
10. Download PDPA export.
11. Submit delete request.
12. Record a manual payment via `/api/payments/record`.
13. Open `/api/receipts/[paymentId]`.

## Not completed yet

- Real PDF receipt renderer.
- Real automatic Supabase backup job.
- Real Stripe SDK dependency. Current integration uses Stripe REST API directly to avoid adding dependency and breaking builds.
- Full tenant feature blocking by plan. Banner is ready; strict feature gating should be Phase 2.1.
