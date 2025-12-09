-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for event images
CREATE POLICY "Public can view event images" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload event images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admins can delete event images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-images' 
    AND auth.role() = 'authenticated'
  );

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;