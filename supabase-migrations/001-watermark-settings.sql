-- Create watermark_settings table for global watermark configuration
CREATE TABLE IF NOT EXISTS watermark_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  opacity INTEGER NOT NULL CHECK (opacity >= 10 AND opacity <= 85) DEFAULT 35,
  scale INTEGER NOT NULL CHECK (scale >= 60 AND scale <= 150) DEFAULT 100,
  show_watermark BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add comment explaining the table
COMMENT ON TABLE watermark_settings IS 'Global watermark configuration stored as single row (id=1)';

-- Enable RLS if needed
ALTER TABLE watermark_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access
CREATE POLICY "allow_read_watermark_settings" ON watermark_settings
  FOR SELECT
  USING (true);

-- Allow update access
CREATE POLICY "allow_update_watermark_settings" ON watermark_settings
  FOR UPDATE
  USING (true);

-- Allow insert access
CREATE POLICY "allow_insert_watermark_settings" ON watermark_settings
  FOR INSERT
  WITH CHECK (true);

-- Insert default row if not exists
INSERT INTO watermark_settings (id, opacity, scale, show_watermark)
VALUES (1, 35, 100, true)
ON CONFLICT (id) DO NOTHING;
