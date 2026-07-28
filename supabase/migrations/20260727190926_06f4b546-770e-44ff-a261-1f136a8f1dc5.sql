
-- helper for folder-based ownership (first path segment = user_id)
CREATE POLICY "audio read authed" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'audio');
CREATE POLICY "audio artist upload own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text AND public.has_role(auth.uid(), 'artist'));
CREATE POLICY "audio artist update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "audio artist delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "covers public read" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "covers auth upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "covers update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "covers delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars auth upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "vd upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-demos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "vd read own or admin" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-demos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
