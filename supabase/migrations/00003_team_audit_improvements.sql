-- ============================================
-- Sprint 2: Team management & audit improvements
-- ============================================

-- Index for faster audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_hotel_created ON audit_logs(hotel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Index for team queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_org ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Reservation indexes for faster calendar queries
CREATE INDEX IF NOT EXISTS idx_reservations_checkin_checkout ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_hotel_dates ON reservations(hotel_id, check_in, check_out);

-- Invoice index
CREATE INDEX IF NOT EXISTS idx_invoices_hotel ON invoices(hotel_id, issue_date DESC);

-- Conversations index
CREATE INDEX IF NOT EXISTS idx_conversations_hotel_unread ON conversations(hotel_id, unread_count, status);
