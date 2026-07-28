
-- 1) Create private schema and move has_role there
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2) Drop all policies that reference public.has_role, then recreate using private.has_role

-- user_roles
DROP POLICY IF EXISTS "roles readable by self or admin" ON public.user_roles;
DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
CREATE POLICY "roles readable by self or admin" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- artist_profiles
DROP POLICY IF EXISTS "admins manage artists" ON public.artist_profiles;
CREATE POLICY "admins manage artists" ON public.artist_profiles
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- verification_requests
DROP POLICY IF EXISTS "vr read own or admin" ON public.verification_requests;
DROP POLICY IF EXISTS "vr admins update" ON public.verification_requests;
CREATE POLICY "vr read own or admin" ON public.verification_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "vr admins update" ON public.verification_requests
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- releases
DROP POLICY IF EXISTS "releases artist manage own" ON public.releases;
DROP POLICY IF EXISTS "releases admins manage" ON public.releases;
CREATE POLICY "releases artist manage own" ON public.releases
  FOR ALL TO authenticated
  USING (artist_id = auth.uid() AND private.has_role(auth.uid(), 'artist'))
  WITH CHECK (artist_id = auth.uid() AND private.has_role(auth.uid(), 'artist'));
CREATE POLICY "releases admins manage" ON public.releases
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- tracks
DROP POLICY IF EXISTS "tracks artist manage own" ON public.tracks;
DROP POLICY IF EXISTS "tracks admins manage" ON public.tracks;
CREATE POLICY "tracks artist manage own" ON public.tracks
  FOR ALL TO authenticated
  USING (artist_id = auth.uid() AND private.has_role(auth.uid(), 'artist'))
  WITH CHECK (artist_id = auth.uid() AND private.has_role(auth.uid(), 'artist'));
CREATE POLICY "tracks admins manage" ON public.tracks
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- plays (read policy uses has_role)
DROP POLICY IF EXISTS "plays read artist own or admin" ON public.plays;
CREATE POLICY "plays read artist own or admin" ON public.plays
  FOR SELECT TO authenticated
  USING (
    private.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.tracks t WHERE t.id = plays.track_id AND t.artist_id = auth.uid())
  );

-- 3) Drop storage policies that reference public.has_role
DROP POLICY IF EXISTS "audio artist upload own folder" ON storage.objects;
DROP POLICY IF EXISTS "vd read own or admin" ON storage.objects;
DROP POLICY IF EXISTS "audio artist upload" ON storage.objects;
DROP POLICY IF EXISTS "verification demo owner or admin read" ON storage.objects;

-- Recreate storage policies (from prior migration) using private.has_role
CREATE POLICY "audio artist upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text AND private.has_role(auth.uid(), 'artist'));

CREATE POLICY "verification demo owner or admin read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-demos' AND ((storage.foldername(name))[1] = auth.uid()::text OR private.has_role(auth.uid(), 'admin')));

-- 4) Drop public.has_role now that nothing depends on it
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

-- 5) Lock down trigger functions (execute not required for triggers)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_play_count() FROM PUBLIC;

-- 6) Restrict follows/likes public read
DROP POLICY IF EXISTS "follows public read" ON public.follows;
CREATE POLICY "follows read authenticated" ON public.follows
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.follows FROM anon;

DROP POLICY IF EXISTS "likes public read" ON public.likes;
CREATE POLICY "likes read authenticated" ON public.likes
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.likes FROM anon;

-- 7) Restrict plays insert
DROP POLICY IF EXISTS "plays insert anyone" ON public.plays;
CREATE POLICY "plays insert authenticated" ON public.plays
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
REVOKE INSERT ON public.plays FROM anon;
