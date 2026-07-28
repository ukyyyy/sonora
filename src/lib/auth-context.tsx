import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "user" | "artist" | "admin";

export type ProfileLite = { display_name: string; avatar_url: string | null; bio: string | null } | null;

type AuthCtx = {
  user: User | null;
  session: Session | null;
  roles: Role[];
  profile: ProfileLite;
  loading: boolean;
  isArtist: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [profile, setProfile] = useState<ProfileLite>(null);
  const [loading, setLoading] = useState(true);

  const loadForUser = useCallback(async (uid: string) => {
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("display_name, avatar_url, bio").eq("id", uid).maybeSingle(),
    ]);
    setRoles(((r ?? []) as { role: Role }[]).map((x) => x.role));
    setProfile(p ?? null);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) setTimeout(() => { loadForUser(s.user.id); }, 0);
      else { setRoles([]); setProfile(null); }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadForUser(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadForUser]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadForUser(session.user.id);
  }, [session, loadForUser]);

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    roles,
    profile,
    loading,
    isArtist: roles.includes("artist") || roles.includes("admin"),
    isAdmin: roles.includes("admin"),
    signOut: async () => { await supabase.auth.signOut(); },
    refreshProfile,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth requires AuthProvider");
  return c;
}
