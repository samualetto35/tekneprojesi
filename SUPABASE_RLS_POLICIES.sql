-- Supabase RLS Policies for Admin Dashboard
-- Run these SQL queries in Supabase SQL Editor

-- ============================================
-- LISTINGS TABLE POLICIES
-- ============================================

-- First, drop existing policies if they exist (optional - only if you want to recreate)
-- DROP POLICY IF EXISTS "Allow authenticated users to insert listings" ON public.listings;
-- DROP POLICY IF EXISTS "Allow authenticated users to update listings" ON public.listings;
-- DROP POLICY IF EXISTS "Allow authenticated users to delete listings" ON public.listings;
-- DROP POLICY IF EXISTS "Allow public to view listings" ON public.listings;

-- Enable RLS on listings table (if not already enabled)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- INSERT Policy: Allow authenticated users to insert new listings
CREATE POLICY "Allow authenticated users to insert listings"
ON public.listings
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- UPDATE Policy: Allow authenticated users to update listings
CREATE POLICY "Allow authenticated users to update listings"
ON public.listings
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- DELETE Policy: Allow authenticated users to delete listings
CREATE POLICY "Allow authenticated users to delete listings"
ON public.listings
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- SELECT Policy: Allow public to view listings (or only active ones)
CREATE POLICY "Allow public to view listings"
ON public.listings
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

-- ============================================
-- LEADS TABLE POLICIES (for admin to view and manage)
-- ============================================

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view leads" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated users to update leads" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated users to delete leads" ON public.leads;

-- Enable RLS on leads table (if not already enabled)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Allow authenticated users (admin) to view leads
CREATE POLICY "Allow authenticated users to view leads"
ON public.leads
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- UPDATE Policy: Allow authenticated users (admin) to update leads
CREATE POLICY "Allow authenticated users to update leads"
ON public.leads
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- DELETE Policy: Allow authenticated users (admin) to delete leads (optional)
CREATE POLICY "Allow authenticated users to delete leads"
ON public.leads
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Alternative SELECT policy (only show active listings to public):
-- CREATE POLICY "Allow public to view active listings"
-- ON public.listings
-- AS PERMISSIVE
-- FOR SELECT
-- TO public
-- USING (is_active = true);

-- ============================================
-- STORAGE POLICIES (for images bucket)
-- ============================================

-- Make sure the bucket exists and is public
-- CREATE BUCKET IF NOT EXISTS images WITH public = true;

-- INSERT Policy: Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  auth.role() = 'authenticated'
);

-- SELECT Policy: Allow public to view images
CREATE POLICY "Allow public to view images"
ON storage.objects
AS PERMISSIVE
FOR SELECT
TO public
USING (bucket_id = 'images');

-- UPDATE Policy: Allow authenticated users to update images (optional)
CREATE POLICY "Allow authenticated users to update images"
ON storage.objects
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'images' AND
  auth.role() = 'authenticated'
);

-- DELETE Policy: Allow authenticated users to delete images (optional)
CREATE POLICY "Allow authenticated users to delete images"
ON storage.objects
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  auth.role() = 'authenticated'
);

