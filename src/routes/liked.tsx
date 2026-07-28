import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { TrackList } from "@/components/TrackList";
import type { PlayerTrack } from "@/lib/player-context";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/liked")({
  head: () => ({ meta: [{ title: "Gelikte Tracks — Sonora" }, { name: "description", content: "Deine Sammlung gelikter Tracks als Playlist." }] }),
  component: LikedPage,
});

function LikedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tracks, setTracks] = useState<PlayerTrack[]>([]);

  useEffect(() => { if (!loading && !user) router.navigate({ to: "/auth" }); }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: likes } = await supabase.from("likes").select("track_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
      const ids = (likes ?? []).map((l) => l.track_id);
      if (!ids.length) { setTracks([]); return; }
      const { data: t } = await supabase.from("tracks").select("id, title, audio_path, duration_seconds, artist_id, release_id").in("id", ids);
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
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as typeof t;
      setTracks(ordered.map((x) => ({ ...x, artist_name: aMap.get(x.artist_id), cover_url: rMap.get(x.release_id) ?? null })));
    })();
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-end gap-6">
        <div className="h-52 w-52 rounded-lg bg-gradient-to-br from-primary to-fuchsia-700 grid place-items-center">
          <Heart className="h-20 w-20 text-white fill-white" />
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground">Playlist</div>
          <h1 className="text-5xl font-bold">Gelikte Tracks</h1>
          <div className="text-sm text-muted-foreground mt-2">{tracks.length} Tracks</div>
        </div>
      </div>
      <TrackList tracks={tracks} />
    </div>
  );
}
