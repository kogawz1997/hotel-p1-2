# MAITRI Phase 1 Production Core Patch

This patch intentionally does **not** add POS, Spa, AI, analytics, or other expansion features. It focuses on the production survival layer.

## Implemented

### Auth + Session
- Added `/auth/callback` to exchange Supabase email verification codes for a real session.
- Signup now sends `emailRedirectTo` to `/auth/callback?next=/onboarding`.
- Signup no longer assumes a usable session exists before email verification.
- Login shows clear verify-email and callback-error states.
- Middleware sends authenticated users with no staff profile to `/onboarding` instead of trapping them at `/auth/login?error=inactive`.

### Onboarding Guard
- Added `src/lib/onboarding/status.ts`.
- Dashboard layout now blocks access until organization, hotel, room type, and room exist.
- Onboarding can bootstrap organization, hotel, profile, and a default rate plan from Supabase auth metadata after email verification.
- Added `/api/onboarding/finish` to ensure a default room type and room exist before dashboard access.

### Roles + Permission Helpers
- Added `src/lib/auth/roles.ts`.
- Added production roles:
  - `platform_owner`
  - `hotel_owner`
  - `admin`
  - `manager`
  - `front_desk`
  - `housekeeping`
  - `staff`
- Kept old `owner` role compatible and normalized to `hotel_owner`.
- Existing API guard now uses role normalization.
- Sidebar hides sensitive items by minimum role.

### RLS + DB Indexes
- Added `supabase/migrations/00006_phase1_auth_roles_rls_indexes.sql`.
- Adds helper functions:
  - `auth.user_organization_id()`
  - `auth.user_hotel_id()`
  - `auth.user_role()`
  - `auth.is_platform_owner()`
  - `auth.can_manage_hotel()`
- Recreates strict policies for core tenant tables.
- Adds performance indexes for reservations, messages, conversations, payments, guests, rooms, room types, profiles, and audit logs.

## Manual Test Flow

1. Apply all Supabase migrations through `00006_phase1_auth_roles_rls_indexes.sql`.
2. In Supabase Auth settings, enable Email Confirmations.
3. Set the Site URL and Redirect URLs:
   - `https://YOUR_DOMAIN/auth/callback`
   - `http://localhost:3000/auth/callback`
4. Deploy with env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
5. Sign up as a new hotel owner.
6. Confirm email.
7. Confirm callback redirects to `/onboarding`.
8. Finish onboarding.
9. Confirm `/dashboard` opens only after room type and room exist.
10. Confirm direct dashboard URL redirects back to onboarding if setup is incomplete.

## Known Not Done In This Patch

- Stripe billing real checkout/webhook logic.
- Sentry setup.
- Upstash Redis rate limit.
- Full role permission matrix on every button/action.
- Deep audit triggers for every table change.

Those belong to Phase 2/3, unless production testing exposes a Phase 1 blocker.
