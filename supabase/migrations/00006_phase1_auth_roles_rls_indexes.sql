-- ============================================
-- Phase 1 Production Readiness
-- Auth roles, onboarding state, strict RLS helpers, and performance indexes.
-- ============================================

ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check CHECK (role IN (
    'platform_owner', 'hotel_owner', 'owner', 'admin', 'manager', 'front_desk', 'housekeeping', 'staff'
  ));

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_subscription_status_check CHECK (subscription_status IN (
    'trial', 'trialing', 'active', 'past_due', 'unpaid', 'cancelled', 'canceled', 'suspended'
  ));

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_user_id UUID REFERENCES user_profiles(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS before JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS after JSONB;

UPDATE audit_logs a
SET organization_id = h.organization_id
FROM hotels h
WHERE a.hotel_id = h.id AND a.organization_id IS NULL;

UPDATE audit_logs
SET actor_user_id = user_id
WHERE actor_user_id IS NULL AND user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.user_profiles WHERE id = auth.uid() AND active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, auth;

CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid() AND active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, auth;

CREATE OR REPLACE FUNCTION auth.user_hotel_id()
RETURNS UUID AS $$
  SELECT h.id
  FROM public.hotels h
  WHERE h.organization_id = auth.user_organization_id()
  ORDER BY h.created_at ASC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, auth;

CREATE OR REPLACE FUNCTION auth.is_platform_owner()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(auth.user_role() = 'platform_owner', false);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, auth;

CREATE OR REPLACE FUNCTION auth.can_manage_hotel()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(auth.user_role() IN ('platform_owner', 'hotel_owner', 'owner', 'admin', 'manager'), false);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, auth;

DROP POLICY IF EXISTS "organizations_member_select" ON organizations;
CREATE POLICY "organizations_member_select" ON organizations FOR SELECT
  USING (auth.is_platform_owner() OR id = auth.user_organization_id());

DROP POLICY IF EXISTS "organizations_owner_update" ON organizations;
CREATE POLICY "organizations_owner_update" ON organizations FOR UPDATE
  USING (auth.is_platform_owner() OR (id = auth.user_organization_id() AND auth.user_role() IN ('hotel_owner','owner','admin')))
  WITH CHECK (auth.is_platform_owner() OR (id = auth.user_organization_id() AND auth.user_role() IN ('hotel_owner','owner','admin')));

DROP POLICY IF EXISTS "profiles_same_org_select" ON user_profiles;
CREATE POLICY "profiles_same_org_select" ON user_profiles FOR SELECT
  USING (auth.is_platform_owner() OR id = auth.uid() OR organization_id = auth.user_organization_id());

DROP POLICY IF EXISTS "profiles_self_update" ON user_profiles;
CREATE POLICY "profiles_self_update" ON user_profiles FOR UPDATE
  USING (id = auth.uid() OR auth.user_role() IN ('platform_owner','hotel_owner','owner','admin'))
  WITH CHECK (id = auth.uid() OR auth.user_role() IN ('platform_owner','hotel_owner','owner','admin'));

DROP POLICY IF EXISTS "profiles_owner_insert" ON user_profiles;
CREATE POLICY "profiles_owner_insert" ON user_profiles FOR INSERT
  WITH CHECK (auth.is_platform_owner() OR organization_id = auth.user_organization_id());

DROP POLICY IF EXISTS "org_isolation_select" ON hotels;
CREATE POLICY "org_isolation_select" ON hotels FOR SELECT
  USING (auth.is_platform_owner() OR organization_id = auth.user_organization_id());

DROP POLICY IF EXISTS "org_isolation_insert" ON hotels;
CREATE POLICY "org_isolation_insert" ON hotels FOR INSERT
  WITH CHECK (auth.is_platform_owner() OR organization_id = auth.user_organization_id());

DROP POLICY IF EXISTS "org_isolation_update" ON hotels;
CREATE POLICY "org_isolation_update" ON hotels FOR UPDATE
  USING (auth.is_platform_owner() OR organization_id = auth.user_organization_id())
  WITH CHECK (auth.is_platform_owner() OR organization_id = auth.user_organization_id());

DROP POLICY IF EXISTS "hotel_data_isolation" ON room_types;
CREATE POLICY "hotel_data_isolation" ON room_types FOR ALL
  USING (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON rooms;
CREATE POLICY "hotel_data_isolation" ON rooms FOR ALL
  USING (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON reservations;
CREATE POLICY "hotel_data_isolation" ON reservations FOR ALL
  USING (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON guests;
CREATE POLICY "hotel_data_isolation" ON guests FOR ALL
  USING (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON payments;
CREATE POLICY "hotel_data_isolation" ON payments FOR ALL
  USING (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON folios;
CREATE POLICY "hotel_data_isolation" ON folios FOR ALL
  USING (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "folio_items_via_folio" ON folio_items;
CREATE POLICY "folio_items_via_folio" ON folio_items FOR ALL
  USING (auth.is_platform_owner() OR folio_id IN (SELECT id FROM folios WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())))
  WITH CHECK (auth.is_platform_owner() OR folio_id IN (SELECT id FROM folios WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())));

DROP POLICY IF EXISTS "hotel_data_isolation" ON conversations;
CREATE POLICY "hotel_data_isolation" ON conversations FOR ALL
  USING (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "messages_via_conversation" ON messages;
CREATE POLICY "messages_via_conversation" ON messages FOR ALL
  USING (auth.is_platform_owner() OR conversation_id IN (SELECT id FROM conversations WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())))
  WITH CHECK (auth.is_platform_owner() OR conversation_id IN (SELECT id FROM conversations WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())));

DROP POLICY IF EXISTS "hotel_data_isolation" ON audit_logs;
CREATE POLICY "hotel_data_isolation" ON audit_logs FOR SELECT
  USING (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()) OR organization_id = auth.user_organization_id());

DROP POLICY IF EXISTS "audit_logs_server_insert" ON audit_logs;
CREATE POLICY "audit_logs_server_insert" ON audit_logs FOR INSERT
  WITH CHECK (auth.is_platform_owner() OR hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()) OR organization_id = auth.user_organization_id());

CREATE INDEX IF NOT EXISTS reservations_hotel_checkin_checkout_idx ON reservations(hotel_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS reservations_hotel_status_dates_idx ON reservations(hotel_id, status, check_in, check_out);
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS conversations_hotel_created_idx ON conversations(hotel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS conversations_hotel_status_created_idx ON conversations(hotel_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_hotel_created_idx ON payments(hotel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS guests_hotel_email_idx ON guests(hotel_id, lower(email));
CREATE INDEX IF NOT EXISTS rooms_hotel_status_idx ON rooms(hotel_id, status);
CREATE INDEX IF NOT EXISTS room_types_hotel_idx ON room_types(hotel_id);
CREATE INDEX IF NOT EXISTS user_profiles_org_role_idx ON user_profiles(organization_id, role, active);
CREATE INDEX IF NOT EXISTS audit_logs_org_created_idx ON audit_logs(organization_id, created_at DESC);
