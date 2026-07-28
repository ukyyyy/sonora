
CREATE TYPE report_target AS ENUM ('track', 'artist', 'playlist', 'user');
CREATE TYPE report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');

CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type report_target NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status report_status NOT NULL DEFAULT 'open',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports insert own" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports read own or admin" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "reports admins update" ON public.reports FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.blocks (
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks manage own" ON public.blocks FOR ALL TO authenticated USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());

CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit read admin" ON public.audit_logs FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.tracks ADD COLUMN is_explicit BOOLEAN NOT NULL DEFAULT false;

-- Rate limit: max 5 verification requests per 24h per user
CREATE OR REPLACE FUNCTION private.limit_verification_rate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.verification_requests
    WHERE user_id = NEW.user_id AND created_at > now() - INTERVAL '24 hours';
  IF cnt >= 5 THEN
    RAISE EXCEPTION 'Rate limit: höchstens 5 Verifizierungs-Anträge pro 24h.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_limit_verification_rate BEFORE INSERT ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION private.limit_verification_rate();

-- Rate limit: max 20 reports per 24h per user
CREATE OR REPLACE FUNCTION private.limit_report_rate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.reports
    WHERE reporter_id = NEW.reporter_id AND created_at > now() - INTERVAL '24 hours';
  IF cnt >= 20 THEN
    RAISE EXCEPTION 'Rate limit: höchstens 20 Meldungen pro 24h.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_limit_report_rate BEFORE INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION private.limit_report_rate();
