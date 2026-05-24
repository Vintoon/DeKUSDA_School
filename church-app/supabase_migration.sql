-- ============================================================
-- Church App: Daily Verse + Announcements
-- Run this in your Supabase SQL Editor
-- Project: ddqdfilyncsgedphdzok (dekusda school)
-- ============================================================

-- 1. Daily Verse table
CREATE TABLE IF NOT EXISTS daily_verse (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  verse_date     date        NOT NULL UNIQUE,
  verse_text     text        NOT NULL,
  verse_reference text       NOT NULL,
  created_by     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     timestamptz DEFAULT now()
);

-- 2. Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text        NOT NULL,
  message     text        NOT NULL,
  is_active   boolean     DEFAULT true,
  expires_at  date,
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE daily_verse    ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements  ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can READ the verse and active announcements
CREATE POLICY "Public can read daily_verse"
  ON daily_verse FOR SELECT
  USING (true);

CREATE POLICY "Public can read active announcements"
  ON announcements FOR SELECT
  USING (is_active = true);

-- Only admins can INSERT / UPDATE / DELETE
CREATE POLICY "Admins can manage daily_verse"
  ON daily_verse FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- Optional: seed today's verse so the popup works immediately
-- ============================================================
-- INSERT INTO daily_verse (verse_date, verse_text, verse_reference)
-- VALUES (
--   CURRENT_DATE,
--   'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
--   'John 3:16'
-- )
-- ON CONFLICT (verse_date) DO NOTHING;
