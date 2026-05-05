# Database Schema

40+ tables organized by domain. Multi-tenant via `organization_id` with Row Level Security.

## Schema Map

```
┌────────────── Identity ──────────────┐
│  organizations                       │
│    └── user_profiles                 │
│    └── hotels                        │
│         └── (everything else)        │
└──────────────────────────────────────┘

┌────────────── Inventory ─────────────┐
│  hotels                              │
│   ├── room_types                     │
│   │    └── rooms                     │
│   ├── rate_plans                     │
│   └── rate_calendar                  │
└──────────────────────────────────────┘

┌────────────── Operations ────────────┐
│  guests                              │
│  reservations                        │
│   ├── folios                         │
│   │    └── folio_items               │
│   └── housekeeping_tasks             │
└──────────────────────────────────────┘

┌────────────── Communication ─────────┐
│  channel_connections                 │
│  conversations                       │
│   └── messages                       │
└──────────────────────────────────────┘

┌────────────── Distribution ──────────┐
│  channel_connections                 │
│  channel_inventory                   │
│  channel_sync_log                    │
│  marketing_campaigns                 │
│  reviews                             │
└──────────────────────────────────────┘

┌────────────── Finance ───────────────┐
│  payments                            │
│  invoices                            │
│  tm30_reports                        │
└──────────────────────────────────────┘

┌────────────── Phase 2 (Schema Ready)─┐
│  outlets / menu_items / orders       │
│  spa_services / spa_bookings         │
│  loyalty_tiers / loyalty_transactions│
│  notifications                       │
└──────────────────────────────────────┘
```

## Key Tables

### `organizations` & `hotels`
Multi-tenancy root. `organization_id` is the tenant boundary, RLS uses `auth.user_organization_id()` helper.

```sql
SELECT * FROM hotels WHERE organization_id = auth.user_organization_id();
```

### `reservations`
Core booking entity:
- `status`: pending → confirmed → checked_in → checked_out (or cancelled/no_show)
- `nights`: generated column from check_in/check_out
- `paid_amount`: tracked vs `total_amount`
- `tm30_reported`: flag for foreign guest reporting

### `conversations` & `messages`
Unified inbox:
- One conversation per `(channel, channel_user_id, hotel_id)`
- Messages have `direction` (inbound/outbound) and translation fields
- `ai_generated` flag distinguishes manual vs AI replies
- Real-time subscriptions: `supabase.channel('messages-{conversationId}')`

### `channel_connections`
Multi-channel auth tokens:
- One row per (hotel, channel) — e.g., LINE token, WhatsApp credentials
- `credentials JSONB` — encrypted in production
- `webhook_secret` for signature verification

### `folios` & `folio_items`
Hotel accounting:
- One folio per reservation
- `folio_items` = line items (room charge, F&B, spa, mini-bar, etc.)
- `balance` = total - paid

### `invoices`
Tax invoices:
- `is_etax = true` → submit to e-Tax provider
- `etax_status`: draft → submitted → approved
- `signed_xml` stored for compliance audit

### `tm30_reports`
Immigration reports for foreign guests:
- Auto-created when reservation has non-Thai nationality
- `status`: pending → submitted → confirmed
- Manual fallback: export CSV

## Row Level Security

Every tenant table has RLS enabled with policy:

```sql
CREATE POLICY "tenant_isolation"
  ON {table}
  FOR ALL
  USING (organization_id = auth.user_organization_id());
```

Helper function:
```sql
CREATE FUNCTION auth.user_organization_id() RETURNS uuid AS $$
  SELECT organization_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE;
```

This means:
- Users can only see their own org's data
- Even with leaked anon key, can't access other orgs
- Service role key bypasses RLS (for admin/webhook use)

## Generated Columns

Smart fields auto-computed:

```sql
-- reservations
nights INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED

-- folios
balance DECIMAL GENERATED ALWAYS AS (total_charges - total_payments) STORED
```

## Indexes

Critical indexes (defined in migration):

```sql
-- Hot paths
CREATE INDEX ON reservations (hotel_id, status, check_in);
CREATE INDEX ON messages (conversation_id, created_at DESC);
CREATE INDEX ON conversations (hotel_id, last_message_at DESC) WHERE status = 'open';
CREATE INDEX ON guests (hotel_id, email);
CREATE INDEX ON rate_calendar (hotel_id, room_type_id, date);
```

## Data Lifecycle

| Table | Retention | Reason |
|---|---|---|
| `messages` | Forever | Customer support history |
| `reservations` | 7 years | Tax compliance |
| `tm30_reports` | 5 years | Immigration regulation |
| `invoices` | 10 years | Revenue Department |
| `payments` | 10 years | Audit trail |
| `housekeeping_tasks` | 1 year | Operational only |
| `audit_logs` (future) | 2 years | Security |

## Migrations

Single source of truth: `supabase/migrations/00001_initial_schema.sql`

For schema changes:
```bash
# Create new migration
npx supabase migration new add_loyalty_referrals

# Edit the .sql file in supabase/migrations/

# Push to dev
npx supabase db push

# Test, then push to production
```

## Backups

- **Auto**: Supabase Pro daily + PITR
- **Manual**: `npx supabase db dump --file=backup.sql` weekly
- **Storage**: Cloudflare R2 / S3 / Google Drive

## Performance Tips

### Query Optimization
- Always filter by `hotel_id` first (uses indexes)
- Use `select('id, name')` instead of `select('*')`
- For large lists, paginate with `range(0, 49)`

### Realtime Subscriptions
- Subscribe per-conversation, not per-hotel (reduces traffic)
- Unsubscribe in `useEffect` cleanup
- Avoid subscribing to high-volume tables

### Connection Pooling
Supabase Pro includes Supavisor (pgbouncer) — uses pooled connection by default in serverless functions.

## Schema Evolution

The schema is designed to be **forward-compatible**:
- New JSON fields go in `metadata JSONB`
- New columns added with sensible defaults
- Renames handled via views to avoid breaking changes
