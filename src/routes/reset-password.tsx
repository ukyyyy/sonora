import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Passwort zurücksetzen — Sonora" },
    { name: "description", content: "Setze ein neues Passwort für dein Sonora-Konto." },
    { name: "robots", content: "noindex" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Wait for Supabase to process recovery hash / session
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getUser().then(({ data }) => { if (data.user) setReady(true); });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Mindestens 8 Zeichen.");
    if (pw !== pw2) return toast.error("Passwörter stimmen nicht überein.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Passwort geändert.");
      router.navigate({ to: "/" });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Fehler"); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-8">
      <h1 className="text-3xl font-semibold">Neues Passwort</h1>
      {!ready ? (
        <p className="text-sm text-muted-foreground">Prüfe Recovery-Link…</p>
      ) : (
        <form onSubmit={save} className="space-y-3">
          <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)}
            placeholder="Neues Passwort (min. 8 Zeichen)" className="w-full px-3 py-2 rounded bg-background border border-border" />
          <input type="password" required value={pw2} onChange={(e) => setPw2(e.target.value)}
            placeholder="Passwort wiederholen" className="w-full px-3 py-2 rounded bg-background border border-border" />
          <button disabled={busy} className="w-full px-4 py-2 rounded gradient-brand text-primary-foreground disabled:opacity-50">
            {busy ? "Speichert…" : "Speichern"}
          </button>
        </form>
      )}
    </div>
  );
}
