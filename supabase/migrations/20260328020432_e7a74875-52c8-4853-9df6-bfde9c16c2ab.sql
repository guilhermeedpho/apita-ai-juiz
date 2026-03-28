
-- Add duration column to matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS duration integer NOT NULL DEFAULT 60;

-- Add review criteria columns
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS referee_level text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS was_punctual boolean;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS was_uniformed boolean;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admin can view all profiles (for user listing)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
