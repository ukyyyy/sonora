import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Anmelden — Sonora" }, { name: "description", content: "Melde dich bei Sonora an oder erstelle ein Konto." }] }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) router.navigate({ to: "/" }); }, [user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Willkommen zurück!");
        router.navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: displayName || email.split("@")[0] } },
        });
        if (error) throw error;
        toast.success("Konto erstellt!");
        router.navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally { setLoading(false); }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error("Google Login fehlgeschlagen");
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="rounded-2xl bg-card p-8 border border-border">
        <h1 className="text-2xl font-bold mb-1">{mode === "signin" ? "Anmelden" : "Konto erstellen"}</h1>
        <p className="text-sm text-muted-foreground mb-6">Willkommen bei Sonora.</p>

        <button
          onClick={google}
          className="w-full mb-4 py-2.5 rounded-md border border-border bg-background hover:bg-muted text-sm font-medium"
        >
          Weiter mit Google
        </button>

        <div className="flex items-center gap-3 my-4 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" /> oder <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              className="w-full px-3 py-2.5 rounded-md bg-background border border-border text-sm"
              placeholder="Anzeigename" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
            />
          )}
          <input
            type="email" required
            className="w-full px-3 py-2.5 rounded-md bg-background border border-border text-sm"
            placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password" required minLength={6}
            className="w-full px-3 py-2.5 rounded-md bg-background border border-border text-sm"
            placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)}
          />
          <button
            disabled={loading}
            className="w-full py-2.5 rounded-md gradient-brand text-primary-foreground font-medium disabled:opacity-50"
          >
            {loading ? "..." : mode === "signin" ? "Anmelden" : "Konto erstellen"}
          </button>
        </form>

        <div className="flex justify-between items-center mt-4 text-sm">
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "Registrieren" : "Anmelden"}
          </button>
          {mode === "signin" && <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">Passwort vergessen?</Link>}
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground text-center">
          Mit Klick akzeptierst du unsere <Link to="/agb" className="underline">AGB</Link> und{" "}
          <Link to="/datenschutz" className="underline">Datenschutzerklärung</Link>.
        </p>
      </div>
    </div>
  );
}
