-- ============================================
-- Phase 2: Billing, PDPA, audit detail, backup readiness
-- Idempotent migration. Apply after Phase 1.
-- ============================================

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_subscription_status_check
  CHECK (subscription_status IN ('trial', 'trialing', 'active', 'past_due', 'unpaid', 'cancelled', 'canceled', 'suspended', 'incomplete'));

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS billing_metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS organizations_stripe_customer_idx ON organizations(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS organizations_stripe_subscription_idx ON organizations(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS organizations_subscription_status_idx ON organizations(subscription_status);

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS subscription_events_org_idx ON subscription_events(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_account_id UUID,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  source TEXT DEFAULT 'portal',
  policy_version TEXT DEFAULT 'v1',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS consent_logs_guest_account_idx ON consent_logs(guest_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS consent_logs_hotel_idx ON consent_logs(hotel_id, created_at DESC);

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_account_id UUID,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'verifying', 'approved', 'rejected', 'completed', 'cancelled')),
  reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS data_deletion_requests_email_idx ON data_deletion_requests(email, requested_at DESC);
CREATE INDEX IF NOT EXISTS data_deletion_requests_status_idx ON data_deletion_requests(status, requested_at DESC);

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS before JSONB,
  ADD COLUMN IF NOT EXISTS after JSONB;
CREATE INDEX IF NOT EXISTS audit_logs_org_created_idx ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity_type, entity_id);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS receipt_number TEXT,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS payments_receipt_number_unique ON payments(receipt_number) WHERE receipt_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS backup_run_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT DEFAULT 'supabase',
  backup_type TEXT DEFAULT 'daily',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'restore_tested')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  restore_tested_at TIMESTAMPTZ,
  artifact_url TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS backup_run_logs_status_idx ON backup_run_logs(status, started_at DESC);

ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_run_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consent_logs_guest_self" ON consent_logs;
CREATE POLICY "consent_logs_guest_self" ON consent_logs FOR SELECT
  USING (guest_account_id = auth.uid());

DROP POLICY IF EXISTS "consent_logs_hotel_staff" ON consent_logs;
CREATE POLICY "consent_logs_hotel_staff" ON consent_logs FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "deletion_requests_guest_self" ON data_deletion_requests;
CREATE POLICY "deletion_requests_guest_self" ON data_deletion_requests FOR SELECT
  USING (guest_account_id = auth.uid());

DROP POLICY IF EXISTS "subscription_events_platform_owner" ON subscription_events;
CREATE POLICY "subscription_events_platform_owner" ON subscription_events FOR SELECT
  USING (auth.is_platform_owner());

DROP POLICY IF EXISTS "backup_logs_platform_owner" ON backup_run_logs;
CREATE POLICY "backup_logs_platform_owner" ON backup_run_logs FOR SELECT
  USING (auth.is_platform_owner());
