-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Message attachments are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload message attachments" ON storage.objects;

-- Re-create policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'user-avatars');
CREATE POLICY "Anyone can upload an avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-avatars');
CREATE POLICY "Message attachments are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'message-attachments');
CREATE POLICY "Anyone can upload message attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'message-attachments');