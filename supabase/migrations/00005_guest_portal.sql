-- ─────────────────────────────────────────────────────────────────
-- Guest Portal: customer-facing auth & booking management
-- ─────────────────────────────────────────────────────────────────

-- Guest accounts (separate from hotel staff)
CREATE TABLE guest_accounts (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT,
  phone         TEXT,
  nationality   TEXT,
  date_of_birth DATE,
  passport_number TEXT,
  preferred_language TEXT DEFAULT 'th',
  avatar_url    TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Booking reviews
CREATE TABLE booking_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  guest_account_id UUID REFERENCES guest_accounts(id) ON DELETE SET NULL,
  reviewer_name  TEXT,
  rating         INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  rating_clean   INT CHECK (rating_clean >= 1 AND rating_clean <= 5),
  rating_service INT CHECK (rating_service >= 1 AND rating_service <= 5),
  rating_location INT CHECK (rating_location >= 1 AND rating_location <= 5),
  rating_value   INT CHECK (rating_value >= 1 AND rating_value <= 5),
  title          TEXT,
  comment        TEXT,
  reply_text     TEXT,
  replied_at     TIMESTAMPTZ,
  platform       TEXT DEFAULT 'direct',
  verified_stay  BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist / saved hotels
CREATE TABLE guest_wishlists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_account_id UUID NOT NULL REFERENCES guest_accounts(id) ON DELETE CASCADE,
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id  UUID REFERENCES room_types(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guest_account_id, hotel_id, room_type_id)
);

-- Special requests on bookings
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS guest_account_id UUID REFERENCES guest_accounts(id),
  ADD COLUMN IF NOT EXISTS special_requests TEXT,
  ADD COLUMN IF NOT EXISTS estimated_arrival TIME,
  ADD COLUMN IF NOT EXISTS room_preference TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','partial','paid','refunded')),
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- RLS
ALTER TABLE guest_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reviews   ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_wishlists   ENABLE ROW LEVEL SECURITY;

-- guest_accounts: own row only
CREATE POLICY "guest_own_account" ON guest_accounts FOR ALL
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Hotel staff can see guest accounts linked to their reservations
CREATE POLICY "hotel_staff_see_guest_accounts" ON guest_accounts FOR SELECT
  USING (
    id IN (
      SELECT guest_account_id FROM reservations r
      JOIN hotels h ON h.id = r.hotel_id
      JOIN user_profiles up ON up.organization_id = h.organization_id
      WHERE up.id = auth.uid()
    )
  );

-- booking_reviews: public read, guest write own
CREATE POLICY "public_read_reviews" ON booking_reviews FOR SELECT USING (true);
CREATE POLICY "guest_write_review" ON booking_reviews FOR INSERT
  WITH CHECK (guest_account_id = auth.uid());
CREATE POLICY "hotel_reply_review" ON booking_reviews FOR UPDATE
  USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN user_profiles up ON up.organization_id = h.organization_id
      WHERE up.id = auth.uid()
    )
  );

-- wishlists: own only
CREATE POLICY "guest_own_wishlist" ON guest_wishlists FOR ALL
  USING (guest_account_id = auth.uid()) WITH CHECK (guest_account_id = auth.uid());

-- Indexes
CREATE INDEX idx_guest_accounts_email ON guest_accounts(email);
CREATE INDEX idx_booking_reviews_hotel ON booking_reviews(hotel_id);
CREATE INDEX idx_booking_reviews_guest ON booking_reviews(guest_account_id);
CREATE INDEX idx_reservations_guest_account ON reservations(guest_account_id);
CREATE INDEX idx_guest_wishlists_guest ON guest_wishlists(guest_account_id);

-- Room type images
CREATE TABLE IF NOT EXISTS room_type_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  alt_text TEXT
);
ALTER TABLE room_type_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_room_images" ON room_type_images FOR SELECT USING (true);
CREATE POLICY "hotel_staff_manage_room_images" ON room_type_images FOR ALL
  USING (
    room_type_id IN (
      SELECT rt.id FROM room_types rt
      JOIN hotels h ON h.id = rt.hotel_id
      JOIN user_profiles up ON up.organization_id = h.organization_id
      WHERE up.id = auth.uid()
    )
  );
CREATE INDEX IF NOT EXISTS idx_room_type_images_rt ON room_type_images(room_type_id);

-- ─────────────────────────────────────────────────────────────────
-- Search & Performance indexes (Sprint 3)
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS latitude   DECIMAL,
  ADD COLUMN IF NOT EXISTS longitude  DECIMAL,
  ADD COLUMN IF NOT EXISTS star_rating INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS total_rooms INT DEFAULT 0;

-- Search indexes
CREATE INDEX IF NOT EXISTS hotels_city_idx        ON hotels(city);
CREATE INDEX IF NOT EXISTS hotels_type_idx        ON hotels(type);
CREATE INDEX IF NOT EXISTS hotels_slug_idx        ON hotels(slug);
CREATE INDEX IF NOT EXISTS hotels_country_idx     ON hotels(country);

-- Hot-path: availability
CREATE INDEX IF NOT EXISTS idx_res_checkin_checkout
  ON reservations(hotel_id, check_in, check_out, status);

-- Guest portal
CREATE INDEX IF NOT EXISTS idx_res_guest_account
  ON reservations(guest_account_id);
CREATE INDEX IF NOT EXISTS idx_reviews_hotel_rating
  ON booking_reviews(hotel_id, rating);
