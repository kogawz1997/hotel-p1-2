# Production SaaS Checklist

This build includes SaaS hardening, but deployment still must pass these gates before accepting real hotel customers.

## Required before launch

- Run `npm ci`, `npm run type-check`, and `npm run build` in CI.
- Apply Supabase migrations `00001_initial_schema.sql` and `00002_production_saas_hardening.sql`.
- Configure production environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OMISE_SECRET_KEY`
  - `OMISE_WEBHOOK_SECRET`
  - channel/webhook secrets for every enabled integration.
- Disable or hide staged OTA integrations until a real certified parser is connected.
- Test payment idempotency with duplicate Omise webhook delivery.
- Test cross-tenant access with two organizations and two hotel accounts.
- Set database backups, log retention, and incident runbooks.

## Do not enable for real customers yet

- Agoda and Booking.com webhooks are intentionally staged unless the provider parser is connected.
- AI reply must stay human-review-first for low confidence and escalation cases.
- Public booking should be protected by a WAF/reverse proxy in addition to app-level rate limits.
