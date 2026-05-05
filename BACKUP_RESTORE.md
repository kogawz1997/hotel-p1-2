# MAITRI Backup & Restore Runbook

Phase 2 เตรียมระบบสำรองข้อมูลแบบใช้งานจริง ไม่ใช่หวังว่า cloud จะเมตตาเราเอง เพราะมันไม่เมตตาใครทั้งนั้น

## Minimum production policy

- Enable Supabase daily backups / PITR if available on the selected plan.
- Export critical tables daily: organizations, hotels, user_profiles, rooms, room_types, reservations, guests, folios, folio_items, payments, invoices, conversations, messages, audit_logs.
- Store backup artifacts outside the primary project when possible.
- Run a restore drill at least weekly.
- Record every backup/restore drill in `backup_run_logs`.

## Restore drill checklist

1. Create a temporary Supabase project.
2. Restore the latest backup into the temporary project.
3. Run smoke tests:
   - login
   - onboarding status
   - reservation search
   - payment/folio data visible
   - guest portal export
4. Mark the backup row as `restore_tested` and set `restore_tested_at`.
5. Delete the temporary project when done.

## API prepared

`GET /api/backup/status` returns the latest backup logs and the next manual steps.

## Important

Do not rely only on migrations. Migrations recreate schema, not customer data. Customer data is the thing customers get dramatic about, usually for valid reasons.
