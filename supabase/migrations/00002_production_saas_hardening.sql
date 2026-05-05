-- ============================================
-- Production SaaS Hardening Patch
-- Adds strict write checks, idempotency, and operational indexes.
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS payments_gateway_transaction_unique
  ON payments(gateway, gateway_transaction_id)
  WHERE gateway_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS reservations_availability_lookup_idx
  ON reservations(hotel_id, room_type_id, check_in, check_out, status);
CREATE INDEX IF NOT EXISTS rooms_availability_lookup_idx
  ON rooms(hotel_id, room_type_id, status);
CREATE INDEX IF NOT EXISTS channel_connections_lookup_idx
  ON channel_connections(channel, external_property_id, status);

ALTER POLICY "hotel_data_isolation" ON reservations
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));
ALTER POLICY "hotel_data_isolation" ON guests
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));
ALTER POLICY "hotel_data_isolation" ON conversations
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));
ALTER POLICY "messages_via_conversation" ON messages
  USING (conversation_id IN (SELECT id FROM conversations WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())))
  WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())));
ALTER POLICY "org_isolation_update" ON hotels
  USING (organization_id = auth.user_organization_id())
  WITH CHECK (organization_id = auth.user_organization_id());
ALTER POLICY "organizations_owner_update" ON organizations
  USING (id = auth.user_organization_id() AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('owner','admin')))
  WITH CHECK (id = auth.user_organization_id() AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('owner','admin')));

ALTER POLICY "folio_items_via_folio" ON folio_items
  USING (folio_id IN (SELECT id FROM folios WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())))
  WITH CHECK (folio_id IN (SELECT id FROM folios WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())));
ALTER POLICY "invoice_items_via_invoice" ON invoice_items
  USING (invoice_id IN (SELECT id FROM invoices WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())))
  WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())));
ALTER POLICY "channel_mapping_via_connection" ON channel_room_mappings
  USING (channel_connection_id IN (SELECT id FROM channel_connections WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())))
  WITH CHECK (channel_connection_id IN (SELECT id FROM channel_connections WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())));
ALTER POLICY "channel_log_via_connection" ON channel_sync_log
  USING (channel_connection_id IN (SELECT id FROM channel_connections WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())))
  WITH CHECK (channel_connection_id IN (SELECT id FROM channel_connections WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())));
ALTER POLICY "fb_categories_via_outlet" ON fb_menu_categories
  USING (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())))
  WITH CHECK (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())));
ALTER POLICY "fb_order_items_via_order" ON fb_order_items
  USING (order_id IN (SELECT id FROM fb_orders WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())))
  WITH CHECK (order_id IN (SELECT id FROM fb_orders WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())));

DROP POLICY IF EXISTS "audit_logs_server_insert" ON audit_logs;
CREATE POLICY "audit_logs_server_insert" ON audit_logs FOR INSERT
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));
