import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { StorageImg } from "@/components/StorageImg";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createRelease, deleteRelease } from "@/lib/release-actions.functions";
import { updateRelease, updateTrack, deleteTrack } from "@/lib/profile-actions.functions";
import { toast } from "@/lib/toast";
import { useUI } from "@/lib/ui";
import { Plus, Trash2, Upload, Pencil, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { formatCount, formatTime } from "@/lib/format";
import { VerifiedBadge } from "@/components/Badges";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Artist-Dashboard — Sonora" }, { name: "description", content: "Verwalte deine Musik, Releases und sieh deine Stats." }] }),
  component: Dashboard,
});

type TrackDraft = { title: string; file: File | null; audio_path?: string; duration_seconds: number; is_explicit: boolean };
type Release = { id: string; title: string; type: string; cover_url: string | null };
type Track = { id: string; title: string; duration_seconds: number; play_count: number; track_number: number };

function Dashboard() {
  const { user, loading, isArtist } = useAuth();
  const router = useRouter();
  const createRel = useServerFn(createRelease);
  const delRel = useServerFn(deleteRelease);
  const updRel = useServerFn(updateRelease);
  const updTrk = useServerFn(updateTrack);
  const delTrk = useServerFn(deleteTrack);
  const { prompt, confirm } = useUI();


  const [stats, setStats] = useState({ plays: 0, likes: 0, followers: 0, tracks: 0 });
  const [releases, setReleases] = useState<Release[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [editing, setEditing] = useState<Release | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tracksByRel, setTracksByRel] = useState<Record<string, Track[]>>({});

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
    if (!loading && user && !isArtist) router.navigate({ to: "/become-artist" });
  }, [user, loading, isArtist, router]);

  const loadAll = async () => {
    if (!user) return;
    const [{ data: rels }, { count: fCount }, { data: tracksAgg }] = await Promise.all([
      supabase.from("releases").select("id, title, type, cover_url").eq("artist_id", user.id).order("released_at", { ascending: false }),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("artist_id", user.id),
      supabase.from("tracks").select("id, play_count").eq("artist_id", user.id),
    ]);
    setReleases(rels ?? []);
    const plays = (tracksAgg ?? []).reduce((s, t: { play_count: number }) => s + (t.play_count || 0), 0);
    const trackIds = (tracksAgg ?? []).map((t: { id: string }) => t.id);
    let likes = 0;
    if (trackIds.length) {
      const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).in("track_id", trackIds);
      likes = count ?? 0;
    }
    setStats({ plays, likes, followers: fCount ?? 0, tracks: (tracksAgg ?? []).length });
  };
  useEffect(() => { loadAll(); }, [user?.id]);

  const loadTracks = async (relId: string) => {
    const { data } = await supabase.from("tracks").select("id, title, duration_seconds, play_count, track_number").eq("release_id", relId).order("track_number");
    setTracksByRel((s) => ({ ...s, [relId]: data ?? [] }));
  };

  const toggleExpand = async (relId: string) => {
    if (expanded === relId) { setExpanded(null); return; }
    setExpanded(relId);
    if (!tracksByRel[relId]) await loadTracks(relId);
  };

  const onDelete = async (id: string) => {
    const ok = await confirm({ title: "Release löschen?", description: "Alle Tracks in diesem Release werden entfernt.", destructive: true, confirmLabel: "Löschen" });
    if (!ok) return;
    await delRel({ data: { id } });
    toast.success("Gelöscht"); loadAll();
  };

  const onRenameTrack = async (relId: string, trackId: string, current: string) => {
    const title = await prompt({ title: "Track umbenennen", placeholder: current, defaultValue: current, confirmLabel: "Speichern" });
    if (!title || title === current) return;
    try {
      await updTrk({ data: { id: trackId, title: title.trim() } });
      toast.success("Track umbenannt"); await loadTracks(relId);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Fehler"); }
  };

  const onDeleteTrack = async (relId: string, trackId: string) => {
    const ok = await confirm({ title: "Track löschen?", destructive: true, confirmLabel: "Löschen" });
    if (!ok) return;
    try {
      await delTrk({ data: { id: trackId } });
      toast.success("Track gelöscht"); await loadTracks(relId); loadAll();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Fehler"); }
  };

  if (!user || !isArtist) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">Artist-Dashboard <VerifiedBadge className="h-6 w-6" /></h1>
          <p className="text-muted-foreground">Verwalte deine Musik und sieh deine Stats.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/settings" className="flex items-center gap-2 px-4 py-2 rounded border border-border hover:bg-muted">
            <Settings className="h-4 w-4" /> Profil
          </Link>
          <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2 rounded gradient-brand text-primary-foreground font-medium">
            <Upload className="h-4 w-4" /> Release hochladen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Plays" value={formatCount(stats.plays)} />
        <Stat label="Likes" value={formatCount(stats.likes)} />
        <Stat label="Follower" value={formatCount(stats.followers)} />
        <Stat label="Tracks" value={String(stats.tracks)} />
      </div>

      <section>
        <h2 className="text-xl font-bold mb-3">Deine Releases</h2>
        <div className="space-y-2">
          {releases.map((r) => (
            <div key={r.id} className="rounded-lg bg-card overflow-hidden">
              <div className="flex items-center gap-4 p-3">
                {r.cover_url ? <StorageImg src={r.cover_url} className="h-12 w-12 rounded object-cover" alt="" /> : <div className="h-12 w-12 rounded gradient-brand" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground uppercase">{r.type}</div>
                </div>
                <button onClick={() => toggleExpand(r.id)} className="text-muted-foreground hover:text-foreground" aria-label="Tracks">
                  {expanded === r.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button onClick={() => setEditing(r)} className="text-muted-foreground hover:text-foreground" aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => onDelete(r.id)} className="text-muted-foreground hover:text-destructive" aria-label="Löschen"><Trash2 className="h-4 w-4" /></button>
              </div>
              {expanded === r.id && (
                <div className="border-t border-border/50 divide-y divide-border/50">
                  {(tracksByRel[r.id] ?? []).map((t) => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                      <span className="text-muted-foreground w-6">{t.track_number}.</span>
                      <div className="flex-1 truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">{formatCount(t.play_count)} Plays</div>
                      <div className="text-xs text-muted-foreground tabular-nums w-12 text-right">{formatTime(t.duration_seconds)}</div>
                      <button onClick={() => onRenameTrack(r.id, t.id, t.title)} className="text-muted-foreground hover:text-foreground" aria-label="Umbenennen"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => onDeleteTrack(r.id, t.id)} className="text-muted-foreground hover:text-destructive" aria-label="Track löschen"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  {(tracksByRel[r.id]?.length ?? 0) === 0 && <div className="px-4 py-3 text-xs text-muted-foreground">Keine Tracks.</div>}
                </div>
              )}
            </div>
          ))}
          {releases.length === 0 && <div className="text-sm text-muted-foreground">Noch keine Releases.</div>}
        </div>
      </section>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); loadAll(); }} createRel={createRel} userId={user.id} />}
      {editing && (
        <EditReleaseModal
          release={editing}
          userId={user.id}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); loadAll(); }}
          updRel={updRel}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

function EditReleaseModal({ release, userId, onClose, onDone, updRel }: {
  release: Release; userId: string; onClose: () => void; onDone: () => void;
  updRel: ReturnType<typeof useServerFn<typeof updateRelease>>;
}) {
  const [title, setTitle] = useState(release.title);
  const [coverUrl, setCoverUrl] = useState<string | null>(release.cover_url);
  const [busy, setBusy] = useState(false);

  const onCover = async (f: File | null) => {
    if (!f) return;
    const path = `${userId}/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
    const { error, data } = await supabase.storage.from("covers").upload(path, f, { upsert: true });
    if (error) return toast.error(error.message);
    const { data: pub } = supabase.storage.from("covers").getPublicUrl(data.path);
    setCoverUrl(pub.publicUrl);
  };

  const save = async () => {
    if (!title.trim()) return toast.error("Titel fehlt");
    setBusy(true);
    try {
      await updRel({ data: { id: release.id, title: title.trim(), cover_url: coverUrl } });
      toast.success("Gespeichert"); onDone();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Fehler"); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 grid place-items-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-xl border border-border p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Release bearbeiten</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {coverUrl ? <img src={coverUrl} className="h-20 w-20 rounded object-cover" alt="" /> : <div className="h-20 w-20 rounded gradient-brand" />}
            <label className="text-sm px-3 py-1.5 rounded border border-border cursor-pointer hover:bg-muted">
              Cover ändern
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onCover(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel" className="w-full px-3 py-2 rounded bg-background border border-border" />
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2 rounded border border-border">Abbrechen</button>
            <button onClick={save} disabled={busy} className="flex-1 py-2 rounded gradient-brand text-primary-foreground font-medium disabled:opacity-50">
              {busy ? "Speichert..." : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadModal({ onClose, onDone, createRel, userId }: { onClose: () => void; onDone: () => void; createRel: ReturnType<typeof useServerFn<typeof createRelease>>; userId: string }) {
  const [type, setType] = useState<"single" | "ep" | "album">("single");
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [tracks, setTracks] = useState<TrackDraft[]>([{ title: "", file: null, duration_seconds: 0, is_explicit: false }]);
  const [busy, setBusy] = useState(false);
  const [rightsOk, setRightsOk] = useState(false);
  const [progress, setProgress] = useState<{ label: string; pct: number } | null>(null);

  const addTrack = () => setTracks((ts) => [...ts, { title: "", file: null, duration_seconds: 0, is_explicit: false }]);
  const updateTrack = (i: number, patch: Partial<TrackDraft>) => setTracks((ts) => ts.map((t, j) => j === i ? { ...t, ...patch } : t));
  const removeTrack = (i: number) => setTracks((ts) => ts.filter((_, j) => j !== i));

  const onFile = (i: number, f: File | null) => {
    updateTrack(i, { file: f });
    if (f) {
      const a = new Audio(URL.createObjectURL(f));
      a.onloadedmetadata = () => updateTrack(i, { duration_seconds: Math.floor(a.duration || 0) });
    }
  };

  const submit = async () => {
    if (!title.trim()) return toast.error("Titel fehlt");
    if (tracks.some((t) => !t.title.trim() || !t.file)) return toast.error("Alle Tracks brauchen Titel + Datei");
    if (!rightsOk) return toast.error("Bitte Rechte-Bestätigung akzeptieren.");
    for (const t of tracks) {
      if (t.file && t.file.size > 60 * 1024 * 1024) return toast.error(`"${t.title}" ist größer als 60 MB.`);
      if (t.duration_seconds > 20 * 60) return toast.error(`"${t.title}" ist länger als 20 Minuten.`);
    }
    const totalSteps = (cover ? 1 : 0) + tracks.length + 1;
    let step = 0;
    const tick = (label: string) => { step++; setProgress({ label, pct: Math.round((step / totalSteps) * 100) }); };
    setBusy(true);
    try {
      let cover_url: string | null = null;
      if (cover) {
        tick("Cover…");
        const path = `${userId}/${Date.now()}-${cover.name.replace(/[^\w.-]/g, "_")}`;
        const { error, data } = await supabase.storage.from("covers").upload(path, cover);
        if (error) throw error;
        const { data: pub } = supabase.storage.from("covers").getPublicUrl(data.path);
        cover_url = pub.publicUrl;
      }
      const uploaded: Array<{ title: string; audio_path: string; duration_seconds: number; is_explicit: boolean }> = [];
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        tick(`Track ${i + 1}/${tracks.length}…`);
        const path = `${userId}/${Date.now()}-${t.file!.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage.from("audio").upload(path, t.file!);
        if (error) throw error;
        uploaded.push({ title: t.title.trim(), audio_path: path, duration_seconds: t.duration_seconds, is_explicit: t.is_explicit });
      }
      tick("Release speichern…");
      await createRel({ data: { type, title: title.trim(), cover_url, tracks: uploaded } });
      toast.success("Release veröffentlicht!"); onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally { setBusy(false); setProgress(null); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 grid place-items-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-card rounded-xl border border-border p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Neuer Release</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(["single", "ep", "album"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)} className={`p-2 rounded border text-sm uppercase ${type === t ? "border-primary bg-primary/10" : "border-border"}`}>{t}</button>
            ))}
          </div>
          <input placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded bg-background border border-border" />
          <div>
            <label className="text-sm text-muted-foreground">Cover-Bild</label>
            <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} className="w-full mt-1 text-sm" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Tracks</label>
              <button onClick={addTrack} className="text-xs text-primary flex items-center gap-1"><Plus className="h-3 w-3" /> Track</button>
            </div>
            {tracks.map((t, i) => (
              <div key={i} className="p-3 rounded bg-background border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                  <input placeholder="Track-Titel" value={t.title} onChange={(e) => updateTrack(i, { title: e.target.value })}
                    className="flex-1 px-2 py-1 rounded bg-card border border-border text-sm" />
                  {tracks.length > 1 && <button onClick={() => removeTrack(i)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
                </div>
                <input type="file" accept="audio/*" onChange={(e) => onFile(i, e.target.files?.[0] ?? null)} className="w-full text-xs" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {t.duration_seconds > 0 ? <span>Länge: {t.duration_seconds}s</span> : <span />}
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={t.is_explicit} onChange={(e) => updateTrack(i, { is_explicit: e.target.checked })} />
                    <span className="uppercase tracking-wider text-[10px]">Explicit (E)</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
          {progress && (
            <div className="p-3 rounded bg-background border border-border">
              <div className="flex justify-between text-xs mb-1"><span>{progress.label}</span><span>{progress.pct}%</span></div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full gradient-brand transition-all" style={{ width: `${progress.pct}%` }} /></div>
            </div>
          )}
          <label className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded bg-background/40 border border-border">
            <input type="checkbox" checked={rightsOk} onChange={(e) => setRightsOk(e.target.checked)} className="mt-0.5" />
            <span>
              Ich versichere, dass ich alle Rechte an den hochgeladenen Tracks und Covern besitze
              (Urheber-, Leistungsschutz- und Rechte Dritter). <a href="/agb" className="underline" target="_blank" rel="noreferrer">AGB</a>.
            </span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2 rounded border border-border">Abbrechen</button>
            <button onClick={submit} disabled={busy} className="flex-1 py-2 rounded gradient-brand text-primary-foreground font-medium disabled:opacity-50">
              {busy ? "Lädt hoch..." : "Veröffentlichen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
