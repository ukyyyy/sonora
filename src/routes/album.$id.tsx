import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrackList } from "@/components/TrackList";
import type { PlayerTrack } from "@/lib/player-context";
import { VerifiedBadge } from "@/components/Badges";
import { StorageImg } from "@/components/StorageImg";

export const Route = createFileRoute("/album/$id")({
  component: AlbumPage,
});

function AlbumPage() {
  const { id } = Route.useParams();
  const [release, setRelease] = useState<{ id: string; title: string; type: string; cover_url: string | null; artist_id: string; released_at: string } | null>(null);
  const [artistName, setArtistName] = useState("");
  const [tracks, setTracks] = useState<PlayerTrack[]>([]);

  useEffect(() => {
    (async () => {
      const { data: r } = await supabase.from("releases").select("*").eq("id", id).maybeSingle();
      setRelease(r);
      if (r) {
        const { data: a } = await supabase.from("artist_profiles").select("artist_name").eq("user_id", r.artist_id).maybeSingle();
        setArtistName(a?.artist_name ?? "");
        const { data: t } = await supabase.from("tracks").select("id, title, audio_path, duration_seconds, artist_id").eq("release_id", id).order("track_number");
        setTracks((t ?? []).map((x) => ({ ...x, artist_name: a?.artist_name, cover_url: r.cover_url })));
      }
    })();
  }, [id]);

  if (!release) return <div className="text-muted-foreground">Lade...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-end gap-6">
        {release.cover_url
          ? <StorageImg src={release.cover_url} className="h-52 w-52 rounded-lg object-cover" alt="" />
          : <div className="h-52 w-52 rounded-lg gradient-brand" />}
        <div>
          <div className="text-xs uppercase text-muted-foreground">{release.type}</div>
          <h1 className="text-5xl font-bold">{release.title}</h1>
          <Link to="/artist/$id" params={{ id: release.artist_id }} className="mt-3 inline-flex items-center gap-1 font-medium">
            {artistName} <VerifiedBadge />
          </Link>
          <div className="text-xs text-muted-foreground mt-1">{new Date(release.released_at).getFullYear()}</div>
        </div>
      </div>
      <TrackList tracks={tracks} showArtist={false} />
    </div>
  );
}
