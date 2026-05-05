# Maitri PMS Production Readiness

This file separates what is now hardened in the codebase from what still requires real provider credentials or business decisions. Because pretending a webhook integration is complete when no provider key exists is how software becomes folklore.

## Completed in this hardening pass

- Added `/dashboard` overview page so post-login routing no longer lands on a missing route.
- Added `public/.gitkeep` so Docker standalone builds can copy `public` safely.
- Updated Docker and CI install steps to work with or without `package-lock.json`.
- Changed signup organization setup to derive the user from the Supabase session instead of trusting `userId` from the client.
- Added server helpers:
  - `requireUser()`
  - `requireHotelAccess()`
  - `assertReservationAccess()`
- Added JSON validation helper with `zod`.
- Hardened reservation create/list/detail/update APIs with tenant checks, role checks, and input validation.
- Fixed booking quote date breakdown and overlap logic.
- Added room type ownership validation in booking quote.
- Hardened AI suggest/send message routes with authenticated organization checks.
- Hardened payment charge route with reservation ownership checks, amount validation, balance validation, and audit logs.
- Removed production mock payment behavior. Development mock remains only when `NODE_ENV !== production`.
- Added Omise card token path and stricter Omise request error handling.
- Added Omise webhook signature gate. Production now requires `OMISE_WEBHOOK_SECRET`.
- Fixed duplicate `posted_by` column in the initial migration.
- Added broader RLS enablement and policies for core hotel-scoped tables.

## Required environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OMISE_SECRET_KEY=
OMISE_WEBHOOK_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_APP_SECRET=
WHATSAPP_VERIFY_TOKEN=
```

## Provider-dependent integrations still staged

These areas have application structure and UI/API placeholders, but cannot be made truly production-complete without provider accounts, contracts, credentials, and official certification flow.

| Area | Current status | What must be done on-site |
|---|---|---|
| Booking.com | Webhook route exists | Configure official Connectivity/partner access, map property IDs, verify reservation payloads, add idempotency keys |
| Agoda | Webhook route exists | Get supplier/API access, confirm webhook schema, add mapping and retry queue |
| Airbnb/OTA sync | Data model exists | Add adapter, inventory push/pull scheduler, conflict reconciliation |
| LINE | Adapter exists | Add channel secret/token, verify signature in production, connect hotel-specific channel config |
| WhatsApp | Adapter exists | Add Meta app credentials, verify webhook challenge, configure phone number ID per hotel |
| WeChat | Placeholder | Needs official account/API approval before implementation |
| TM30 | Data model/API exists | Connect to accepted reporting process/provider, export fallback CSV/PDF if no official API is available |
| e-Tax | Data model/API exists | Choose certified e-Tax provider, implement signing/submission, store signed XML/PDF |
| PEAK/FlowAccount | Adapter skeleton exists | Add provider OAuth/API keys, map invoice/payment payloads, test with accountant |
| Payment | Omise PromptPay/card path prepared | Create Omise account, add public card tokenization frontend, set webhook secret, test charge/refund lifecycle |

## Minimum go-live checklist

1. Run a clean database migration on a fresh Supabase project.
2. Confirm every authenticated route returns only the signed-in organization data.
3. Create one owner, one manager, one front desk user, and one housekeeping user.
4. Enter real room types, rooms, rates, check-in/out rules, tax ID, and VAT rate.
5. Test direct reservation create, check-in, check-out, cancel, and folio creation.
6. Test payment with Omise test keys, including webhook replay and duplicate webhook protection.
7. Turn on real webhook secrets for LINE/WhatsApp/Omise before exposing public URLs.
8. Review all placeholder integrations and hide unavailable modules from paying customers until credentials are connected.
9. Add backups, uptime monitoring, error logging, and audit log review.
10. Do a pilot with one property before selling as multi-property SaaS.

## Suggested package gating

- Starter: reservations, rooms, guests, basic reports.
- Standard: housekeeping, inbox, payment links.
- Pro: AI replies, channel connections, loyalty, marketing.
- Enterprise: multi-property, e-Tax, TM30, accounting sync, custom OTA adapters.

## Known limitation

The code is now safer and more complete, but provider integrations cannot be certified from source code alone. Real credentials and sandbox/production provider reviews are mandatory. Humanity has somehow chosen paperwork as the final boss.
