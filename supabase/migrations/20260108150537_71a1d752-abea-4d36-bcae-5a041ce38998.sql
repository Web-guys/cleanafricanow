-- Create storage bucket for report photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-photos', 'report-photos', true);

-- Create policies for the storage bucket
-- Anyone can view photos (bucket is public)
CREATE POLICY "Anyone can view report photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-photos');

-- Authenticated users can upload their own photos
CREATE POLICY "Users can upload their own report photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'report-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own photos
CREATE POLICY "Users can update their own report photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'report-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own photos
CREATE POLICY "Users can delete their own report photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'report-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime for reports table
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;