import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { submitVerification } from "@/lib/verify-actions.functions";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/become-artist")({
  head: () => ({ meta: [{ title: "Artist werden — Sonora" }, { name: "description", content: "Reiche eine Verifizierung ein, um deine Musik auf Sonora zu veröffentlichen." }] }),
  component: BecomeArtist,
});

function BecomeArtist() {
  const { user, loading, isArtist } = useAuth();
  const router = useRouter();
  const submit = useServerFn(submitVerification);

  const [artistName, setArtistName] = useState("");
  const [method, setMethod] = useState<"demo" | "portfolio">("demo");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [rightsOk, setRightsOk] = useState(false);
  const [existing, setExisting] = useState<{ status: string; created_at: string; admin_notes: string | null } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
    if (isArtist) router.navigate({ to: "/dashboard" });
  }, [user, loading, isArtist, router]);

  useEffect(() => {
    if (!user) return;
    supabase.from("verification_requests").select("status, created_at, admin_notes").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1)
      .then(({ data }) => setExisting(data?.[0] ?? null));
  }, [user?.id]);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!artistName.trim()) return toast.error("Artistname fehlt");
    if (!rightsOk) return toast.error("Bitte Rechte-Bestätigung akzeptieren.");
    setBusy(true);
    try {
      let demo_path: string | null = null;
      if (method === "demo") {
        if (!file) throw new Error("Bitte lade eine Audio-Datei hoch.");
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("verification-demos").upload(path, file);
        if (upErr) throw upErr;
        demo_path = path;
      }
      const portfolio_links = method === "portfolio" ? links.map((l) => l.trim()).filter(Boolean) : null;
      if (method === "portfolio" && (!portfolio_links || portfolio_links.length === 0)) {
        throw new Error("Bitte gib mindestens einen Link an.");
      }
      await submit({ data: { artist_name: artistName.trim(), method, demo_path, portfolio_links, description: description.trim() || null } });
      toast.success("Antrag eingereicht!");
      const { data } = await supabase.from("verification_requests").select("status, created_at, admin_notes").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1);
      setExisting(data?.[0] ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Artist werden</h1>
        <p className="text-muted-foreground mt-1">Reiche einen Antrag ein, damit du deine Musik hochladen darfst.</p>
      </div>

      {existing && (
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="text-sm">Letzter Antrag: <span className="font-medium capitalize">{existing.status}</span></div>
          {existing.admin_notes && <div className="text-sm text-muted-foreground mt-1">Notiz: {existing.admin_notes}</div>}
          {existing.status === "pending" && <div className="text-xs text-muted-foreground mt-2">Bitte warte auf die Prüfung.</div>}
        </div>
      )}

      {(!existing || existing.status === "rejected") && (
        <form onSubmit={submitForm} className="space-y-4 p-6 rounded-lg bg-card border border-border">
          <div>
            <label className="text-sm font-medium">Artistname</label>
            <input required maxLength={80} value={artistName} onChange={(e) => setArtistName(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded bg-background border border-border" />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Verifizierungs-Methode</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setMethod("demo")}
                className={`p-3 rounded border text-sm ${method === "demo" ? "border-primary bg-primary/10" : "border-border"}`}>
                Demo-Track einreichen
              </button>
              <button type="button" onClick={() => setMethod("portfolio")}
                className={`p-3 rounded border text-sm ${method === "portfolio" ? "border-primary bg-primary/10" : "border-border"}`}>
                Portfolio-Links
              </button>
            </div>
          </div>

          {method === "demo" ? (
            <div>
              <label className="text-sm font-medium">Demo (MP3/WAV)</label>
              <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full mt-1 text-sm" />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Portfolio-Links (Spotify, SoundCloud, YouTube, Website...)</label>
              {links.map((l, i) => (
                <input key={i} type="url" value={l} onChange={(e) => setLinks((ls) => ls.map((x, j) => j === i ? e.target.value : x))}
                  placeholder="https://..." className="w-full px-3 py-2 rounded bg-background border border-border" />
              ))}
              <button type="button" onClick={() => setLinks((ls) => [...ls, ""])} className="text-xs text-primary">+ Link hinzufügen</button>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Über dich (optional)</label>
            <textarea maxLength={2000} rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded bg-background border border-border" />
          </div>

          <label className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded bg-background/40 border border-border">
            <input type="checkbox" checked={rightsOk} onChange={(e) => setRightsOk(e.target.checked)} className="mt-0.5" />
            <span>
              Ich versichere, dass ich alle erforderlichen Rechte (Urheber-, Leistungsschutz- und Rechte
              Dritter) an den eingereichten Inhalten besitze und der Veröffentlichung auf Sonora zustimme.
              Verstöße können zur Löschung und Account-Sperre führen (siehe <a href="/agb" className="underline">AGB</a>).
            </span>
          </label>

          <button disabled={busy} className="w-full py-2.5 rounded gradient-brand text-primary-foreground font-medium disabled:opacity-50">
            {busy ? "Wird eingereicht..." : "Antrag einreichen"}
          </button>
        </form>
      )}
    </div>
  );
}
