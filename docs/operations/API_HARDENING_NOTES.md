# API Hardening Notes

## Guard pattern

Use this for private hotel APIs:

```ts
const ctx = await requireHotelAccess(hotelId);
if (ctx.error) return ctx.error;
```

Use this for reservation-specific APIs:

```ts
const ctx = await assertReservationAccess(reservationId);
if (ctx.error) return ctx.error;
```

Never trust these values directly from the browser:

- `userId`
- `organizationId`
- `hotelId` without ownership check
- `role`
- `paid_amount`
- webhook status

## Validation pattern

```ts
const parsed = await parseJson(request, schema);
if (parsed.error) return parsed.error;
const body = parsed.data;
```

## Webhook pattern

Every webhook route must do four things:

1. Read raw body as text.
2. Verify provider signature.
3. Parse JSON only after verification.
4. Use idempotency checks before changing money/reservation state.

## Tenant isolation rule

Every table that stores hotel data must have one of these:

- `hotel_id` scoped RLS policy.
- join-policy through parent table, e.g. `messages -> conversations -> hotels`.
- server-only service role access with explicit ownership validation in route.
