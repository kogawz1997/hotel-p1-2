-- Hotel gallery for branding
CREATE TABLE hotel_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add branding fields to hotels table if not exist
ALTER TABLE hotels 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS featured_gallery_id UUID;

-- Enable RLS
ALTER TABLE hotel_gallery ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "hotel_staff_view_gallery" ON hotel_gallery FOR SELECT
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE organization_id = (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "hotel_staff_manage_gallery" ON hotel_gallery FOR ALL
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE organization_id = (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE organization_id = (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Index
CREATE INDEX hotel_gallery_hotel_idx ON hotel_gallery(hotel_id);
CREATE INDEX hotel_gallery_order_idx ON hotel_gallery(hotel_id, display_order);
