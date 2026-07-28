import { createFileRoute } from "@tanstack/react-router";
import { PlaylistCover } from "@/components/PlaylistCover";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrackList } from "@/components/TrackList";
import type { PlayerTrack } from "@/lib/player-context";
import { useAuth } from "@/lib/auth-context";
import { Pencil, ImagePlus, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { useUI } from "@/lib/ui";

export const Route = createFileRoute("/playlist/$id")({
  component: PlaylistPage,
});

function PlaylistPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [pl, setPl] = useState<{ id: string; title: string; description: string | null; owner_id: string; cover_url: string | null } | null>(null);
  const [tracks, setTracks] = useState<PlayerTrack[]>([]);

  const load = async () => {
    const { data: p } = await supabase.from("playlists").select("id, title, description, owner_id, cover_url").eq("id", id).maybeSingle();
    setPl(p);
    const { data: pts } = await supabase.from("playlist_tracks").select("track_id, position").eq("playlist_id", id).order("position");
    const tids = (pts ?? []).map((x: { track_id: string }) => x.track_id);
    if (!tids.length) { setTracks([]); return; }
    const { data: t } = await supabase.from("tracks").select("id, title, audio_path, duration_seconds, artist_id, release_id").in("id", tids);
    if (!t) return;
    const aIds = [...new Set(t.map((x) => x.artist_id))];
    const rIds = [...new Set(t.map((x) => x.release_id))];
    const [{ data: aps }, { data: rels }] = await Promise.all([
      supabase.from("artist_profiles").select("user_id, artist_name").in("user_id", aIds),
      supabase.from("releases").select("id, cover_url").in("id", rIds),
    ]);
    const aMap = new Map((aps ?? []).map((a) => [a.user_id, a.artist_name]));
    const rMap = new Map((rels ?? []).map((r) => [r.id, r.cover_url]));
    const byId = new Map(t.map((x) => [x.id, x]));
    const ordered = tids.map((tid) => byId.get(tid)).filter(Boolean) as typeof t;
    setTracks(ordered.map((x) => ({ ...x, artist_name: aMap.get(x.artist_id), cover_url: rMap.get(x.release_id) ?? null })));
  };
  useEffect(() => { load(); }, [id]);

  const isOwner = !!user && !!pl && pl.owner_id === user.id;

  const { prompt: askPrompt } = useUI();
  const rename = async () => {
    if (!pl) return;
    const title = await askPrompt({ title: "Playlist umbenennen", defaultValue: pl.title, confirmLabel: "Speichern" });
    if (!title) return;
    const { error } = await supabase.from("playlists").update({ title }).eq("id", pl.id);
    if (error) return toast.error(error.message);
    setPl({ ...pl, title });
  };

  const remove = async (trackId: string) => {
    const { error } = await supabase.from("playlist_tracks").delete().eq("playlist_id", id).eq("track_id", trackId);
    if (error) { toast.error(error.message); return; }
    setTracks((ts) => ts.filter((t) => t.id !== trackId));
  };

  const fileRef = useRef<HTMLInputElement>(null);
  const uploadCover = async (file: File) => {
    if (!user || !pl) return;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/playlist-${pl.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("covers").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) return toast.error(upErr.message);
    const publicUrl = supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from("playlists").update({ cover_url: publicUrl }).eq("id", pl.id);
    if (error) return toast.error(error.message);
    setPl({ ...pl, cover_url: publicUrl });
    toast.success("Cover aktualisiert");
  };
  const removeCover = async () => {
    if (!pl) return;
    const { error } = await supabase.from("playlists").update({ cover_url: null }).eq("id", pl.id);
    if (error) return toast.error(error.message);
    setPl({ ...pl, cover_url: null });
  };

  if (!pl) return <div className="text-muted-foreground">Lade...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-end gap-6">
        <div className="relative h-52 w-52 rounded-lg overflow-hidden group">
          <PlaylistCover playlistId={pl.id} coverUrl={pl.cover_url} className="h-52 w-52" />
          {isOwner && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 group-hover:opacity-100 transition text-white text-sm gap-2 flex-col"
                aria-label="Cover ändern"
              >
                <ImagePlus className="h-6 w-6" />
                Cover ändern
              </button>
              {pl.cover_url && (
                <button
                  onClick={removeCover}
                  className="absolute top-2 right-2 p-1.5 rounded bg-background/80 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                  aria-label="Cover entfernen"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground">Playlist</div>
          <div className="flex items-center gap-2">
            <h1 className="text-5xl font-bold">{pl.title}</h1>
            {isOwner && <button onClick={rename} className="text-muted-foreground hover:text-foreground p-2" aria-label="Umbenennen"><Pencil className="h-5 w-5" /></button>}
          </div>
          {pl.description && <p className="text-muted-foreground mt-2">{pl.description}</p>}
          <div className="text-sm text-muted-foreground mt-2">{tracks.length} Tracks</div>
        </div>
      </div>
      <TrackList tracks={tracks} onRemove={isOwner ? remove : undefined} />
    </div>
  );
}
