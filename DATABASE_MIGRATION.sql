-- Database Migration: Add new columns to listings table
-- Run this SQL in Supabase SQL Editor

-- Add new columns to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS model_year INTEGER,
ADD COLUMN IF NOT EXISTS renovation_year INTEGER,
ADD COLUMN IF NOT EXISTS cruising_capacity INTEGER,
ADD COLUMN IF NOT EXISTS wc_count INTEGER,
ADD COLUMN IF NOT EXISTS length_metres NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS width_metres NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS boat_type TEXT,
ADD COLUMN IF NOT EXISTS guest_bathroom_count INTEGER,
ADD COLUMN IF NOT EXISTS guest_shower_count INTEGER,
ADD COLUMN IF NOT EXISTS check_in_time TIME,
ADD COLUMN IF NOT EXISTS check_out_time TIME,
ADD COLUMN IF NOT EXISTS rental_model TEXT,
ADD COLUMN IF NOT EXISTS fuel_price_included BOOLEAN DEFAULT false;

-- Create amenities table for boat amenities/features
CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for listing amenities (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.listing_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id, amenity_id)
);

-- Insert default amenities
INSERT INTO public.amenities (name, icon) VALUES
  ('Güneşlenme Minderi', 'sun'),
  ('Barbekü Alanı', 'grill'),
  ('Güneşlenme Terası', 'terrace'),
  ('Yüzme Merdiveni', 'ladder'),
  ('Rüzgar Yön Göstergesi', 'wind'),
  ('Radar', 'radar'),
  ('GPS', 'gps'),
  ('Ses Sistemi', 'music'),
  ('WiFi', 'wifi'),
  ('Klima', 'ac'),
  ('TV', 'tv'),
  ('Buzdolabı', 'fridge'),
  ('Mutfak', 'kitchen'),
  ('Jakuzi', 'jacuzzi'),
  ('Su Sporları Ekipmanları', 'watersports'),
  ('Balık Tutma Ekipmanları', 'fishing'),
  ('Can Yeleği', 'lifejacket'),
  ('Dinghy', 'dinghy'),
  ('Su Kayağı', 'waterski'),
  ('Tüplü Dalış', 'diving'),
  ('Jet Ski', 'jetski'),
  ('Kano', 'canoe')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_amenities ENABLE ROW LEVEL SECURITY;

-- Policies for amenities table
CREATE POLICY "Allow public to view amenities"
ON public.amenities
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to manage amenities"
ON public.amenities
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policies for listing_amenities table
CREATE POLICY "Allow public to view listing amenities"
ON public.listing_amenities
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to manage listing amenities"
ON public.listing_amenities
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

