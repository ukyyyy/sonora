import { createFileRoute, useRouter } from "@tanstack/react-router";
import { StorageImg } from "@/components/StorageImg";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { updateProfile, updateArtistProfile, exportUserData, deleteAccount, updatePassword } from "@/lib/profile-actions.functions";
import { toast } from "@/lib/toast";
import { Avatar } from "@/components/Avatar";
import { Download, Trash2, Shield, KeyRound } from "lucide-react";
import { useSubscription } from "@/lib/subscription";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Einstellungen — Sonora" }, { name: "description", content: "Profil, Datenschutz (DSGVO) und Kontoeinstellungen." }] }),
  component: Settings,
});

function Settings() {
  const { user, loading, isArtist, refreshProfile } = useAuth();
  const router = useRouter();
  const upd = useServerFn(updateProfile);
  const updArt = useServerFn(updateArtistProfile);
  const exp = useServerFn(exportUserData);
  const del = useServerFn(deleteAccount);
  const chgPw = useServerFn(updatePassword);
  const { subscription, isPremium } = useSubscription();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [artistName, setArtistName] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => { if (!loading && !user) router.navigate({ to: "/auth" }); }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("display_name, bio, avatar_url").eq("id", user.id).maybeSingle();
      if (p) { setDisplayName(p.display_name ?? ""); setBio(p.bio ?? ""); setAvatarUrl(p.avatar_url ?? null); }
      if (isArtist) {
        const { data: a } = await supabase.from("artist_profiles").select("artist_name, banner_url").eq("user_id", user.id).maybeSingle();
        if (a) { setArtistName(a.artist_name ?? ""); setBannerUrl(a.banner_url ?? null); }
      }
    })();
  }, [user?.id, isArtist]);

  const uploadImage = async (bucket: "avatars" | "covers", file: File): Promise<string> => {
    const path = `${user!.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error, data } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return pub.publicUrl;
  };

  const onAvatar = async (f: File | null) => {
    if (!f) return;
    try { const url = await uploadImage("avatars", f); setAvatarUrl(url); toast.success("Avatar hochgeladen — speichern nicht vergessen."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Upload fehlgeschlagen"); }
  };
  const onBanner = async (f: File | null) => {
    if (!f) return;
    try { const url = await uploadImage("covers", f); setBannerUrl(url); toast.success("Banner hochgeladen — speichern nicht vergessen."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Upload fehlgeschlagen"); }
  };

  const save = async () => {
    if (!displayName.trim()) return toast.error("Anzeigename fehlt");
    setBusy(true);
    try {
      await upd({ data: { display_name: displayName.trim(), bio: bio.trim() || null, avatar_url: avatarUrl } });
      if (isArtist && artistName.trim()) {
        await updArt({ data: { artist_name: artistName.trim(), banner_url: bannerUrl } });
      }
      await refreshProfile();
      toast.success("Gespeichert");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Fehler"); }
    finally { setBusy(false); }
  };

  const onExport = async () => {
    try {
      const data = await exp();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `sonora-daten-${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); URL.revokeObjectURL(url);
      toast.success("Daten exportiert");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Export fehlgeschlagen"); }
  };

  const onDelete = async () => {
    if (confirmText !== "LÖSCHEN") return toast.error('Bitte "LÖSCHEN" eingeben.');
    try {
      await del({ data: { confirm: "LÖSCHEN" } });
      await supabase.auth.signOut();
      toast.success("Konto gelöscht");
      router.navigate({ to: "/" });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Löschen fehlgeschlagen"); }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground">Verwalte dein Profil und deine Daten.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Profil</h2>
        <div className="flex items-center gap-4">
          <Avatar url={avatarUrl} name={displayName} size={72} />
          <label className="text-sm px-3 py-1.5 rounded border border-border cursor-pointer hover:bg-muted">
            Bild wählen
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onAvatar(e.target.files?.[0] ?? null)} />
          </label>
          {avatarUrl && <button onClick={() => setAvatarUrl(null)} className="text-xs text-muted-foreground hover:text-destructive">Entfernen</button>}
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Anzeigename</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} className="mt-1 w-full px-3 py-2 rounded bg-background border border-border" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={3} className="mt-1 w-full px-3 py-2 rounded bg-background border border-border" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">E-Mail</label>
          <input value={user.email ?? ""} disabled className="mt-1 w-full px-3 py-2 rounded bg-muted border border-border text-muted-foreground" />
        </div>
      </section>

      {isArtist && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Artist-Profil</h2>
          <div>
            <label className="text-sm text-muted-foreground">Artist-Name</label>
            <input value={artistName} onChange={(e) => setArtistName(e.target.value)} maxLength={80} className="mt-1 w-full px-3 py-2 rounded bg-background border border-border" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Banner</label>
            {bannerUrl && <StorageImg src={bannerUrl} alt="" className="mt-1 w-full h-40 object-cover rounded" />}
            <label className="mt-2 inline-block text-sm px-3 py-1.5 rounded border border-border cursor-pointer hover:bg-muted">
              Banner wählen
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onBanner(e.target.files?.[0] ?? null)} />
            </label>
            {bannerUrl && <button onClick={() => setBannerUrl(null)} className="ml-2 text-xs text-muted-foreground hover:text-destructive">Entfernen</button>}
          </div>
        </section>
      )}

      <div className="flex gap-2">
        <button onClick={save} disabled={busy} className="px-6 py-2 rounded gradient-brand text-primary-foreground font-medium disabled:opacity-50">
          {busy ? "Speichert..." : "Speichern"}
        </button>
      </div>

      <section className="space-y-4 pt-6 border-t border-border">
        <h2 className="text-xl font-semibold flex items-center gap-2"><KeyRound className="h-5 w-5" /> Passwort ändern</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Neues Passwort" className="px-3 py-2 rounded bg-background border border-border" />
          <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Wiederholen" className="px-3 py-2 rounded bg-background border border-border" />
        </div>
        <button
          onClick={async () => {
            if (pw.length < 8) return toast.error("Mindestens 8 Zeichen.");
            if (pw !== pw2) return toast.error("Passwörter stimmen nicht überein.");
            setPwBusy(true);
            try { await chgPw({ data: { new_password: pw } }); setPw(""); setPw2(""); toast.success("Passwort geändert."); }
            catch (e) { toast.error(e instanceof Error ? e.message : "Fehler"); }
            finally { setPwBusy(false); }
          }}
          disabled={pwBusy || !pw || !pw2}
          className="px-4 py-2 rounded border border-border hover:bg-muted disabled:opacity-50"
        >{pwBusy ? "Speichert…" : "Passwort ändern"}</button>
      </section>

      {isPremium && subscription && (
        <section className="space-y-3 pt-6 border-t border-border">
          <h2 className="text-xl font-semibold">Premium-Abo</h2>
          <p className="text-sm text-muted-foreground">
            Status: <span className="text-foreground">{subscription.status}</span>
            {subscription.current_period_end && <> · läuft bis {new Date(subscription.current_period_end).toLocaleDateString("de-DE")}</>}
          </p>
          <Link to="/premium" className="inline-block px-4 py-2 rounded border border-border hover:bg-muted text-sm">Abo verwalten</Link>
        </section>
      )}

      <section className="space-y-4 pt-6 border-t border-border">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Shield className="h-5 w-5" /> Datenschutz (DSGVO)</h2>
        <p className="text-sm text-muted-foreground">
          Nach Art. 15 &amp; 20 DSGVO hast du das Recht auf Auskunft und Datenübertragbarkeit. Nach Art. 17 DSGVO hast du das Recht auf Löschung.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={onExport} className="flex items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted text-left">
            <Download className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">Meine Daten exportieren</div>
              <div className="text-xs text-muted-foreground">Als maschinenlesbare JSON-Datei</div>
            </div>
          </button>
          <a href="mailto:datenschutz@sonora.app" className="flex items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted text-left">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">Datenschutzanfrage</div>
              <div className="text-xs text-muted-foreground">datenschutz@sonora.app</div>
            </div>
          </a>
        </div>
      </section>

      <section className="space-y-3 pt-6 border-t border-destructive/30">
        <h2 className="text-xl font-semibold text-destructive flex items-center gap-2"><Trash2 className="h-5 w-5" /> Konto löschen</h2>
        <p className="text-sm text-muted-foreground">
          Diese Aktion löscht dein Konto und alle zugehörigen Daten (Profil, Playlists, Likes, Follows, Releases, Tracks) unwiderruflich.
          Tippe <span className="font-mono font-bold">LÖSCHEN</span> zum Bestätigen.
        </p>
        <div className="flex gap-2">
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="LÖSCHEN" className="flex-1 px-3 py-2 rounded bg-background border border-destructive/50" />
          <button onClick={onDelete} disabled={confirmText !== "LÖSCHEN"} className="px-4 py-2 rounded bg-destructive text-destructive-foreground disabled:opacity-40">
            Konto endgültig löschen
          </button>
        </div>
      </section>
    </div>
  );
}
