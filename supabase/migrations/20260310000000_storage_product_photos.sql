-- Migration: product-photos storage bucket + RLS policies
-- Creates the bucket if it doesn't exist, then applies per-user upload/read policies.

-- Create the bucket (idempotent via DO block)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('product-photos', 'product-photos', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Policy: authenticated users can upload to their own folder (uid/*)
CREATE POLICY "Users can upload their own product photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: authenticated users can update their own photos
CREATE POLICY "Users can update their own product photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: authenticated users can delete their own photos
CREATE POLICY "Users can delete their own product photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: public read (bucket is public, but explicit policy for clarity)
CREATE POLICY "Product photos are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-photos');
