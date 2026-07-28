import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [
    { title: "Passwort vergessen — Sonora" },
    { name: "description", content: "Setze dein Passwort für dein Sonora-Konto zurück." },
    { name: "robots", content: "noindex" },
  ] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("E-Mail versendet.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-8">
      <div>
        <h1 className="text-3xl font-semibold">Passwort vergessen</h1>
        <p className="text-muted-foreground text-sm mt-1">Wir senden dir einen Link zum Zurücksetzen.</p>
      </div>
      {sent ? (
        <div className="glass ring-chrome rounded-xl p-5 space-y-2">
          <p className="text-sm">Prüfe dein Postfach ({email}). Der Link ist 1 Stunde gültig.</p>
          <Link to="/auth" className="text-primary text-sm underline">Zurück zum Login</Link>
        </div>
      ) : (
        <form onSubmit={send} className="space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.de" className="w-full px-3 py-2 rounded bg-background border border-border" />
          <button disabled={busy} className="w-full px-4 py-2 rounded gradient-brand text-primary-foreground disabled:opacity-50">
            {busy ? "Sendet…" : "Link senden"}
          </button>
          <Link to="/auth" className="block text-center text-sm text-muted-foreground hover:text-foreground">Zurück</Link>
        </form>
      )}
    </div>
  );
}
