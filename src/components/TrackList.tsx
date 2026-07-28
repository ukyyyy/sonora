import { usePlayer, type PlayerTrack } from "@/lib/player-context";
import { Heart, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatTime } from "@/lib/format";
import { AddToPlaylistButton } from "@/components/AddToPlaylistMenu";
import { toast } from "@/lib/toast";

export function TrackList({
  tracks,
  showArtist = true,
  onRemove,
}: {
  tracks: PlayerTrack[];
  showArtist?: boolean;
  onRemove?: (trackId: string) => void | Promise<void>;
}) {
  const { play, current } = usePlayer();
  const { user } = useAuth();
  const [likes, setLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || tracks.length === 0) return;
    supabase.from("likes").select("track_id").eq("user_id", user.id)
      .in("track_id", tracks.map((t) => t.id)).then(({ data }) => {
        setLikes(new Set((data ?? []).map((l: { track_id: string }) => l.track_id)));
      });
  }, [user, tracks]);

  const toggleLike = async (trackId: string) => {
    if (!user) { toast.error("Bitte anmelden."); return; }
    if (likes.has(trackId)) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("track_id", trackId);
      setLikes((s) => { const n = new Set(s); n.delete(trackId); return n; });
    } else {
      await supabase.from("likes").insert({ user_id: user.id, track_id: trackId });
      setLikes((s) => new Set(s).add(trackId));
    }
  };

  if (tracks.length === 0) return <div className="text-sm text-muted-foreground py-6">Noch keine Tracks.</div>;

  return (
    <div className="divide-y divide-border/50">
      {tracks.map((t, i) => (
        <div key={t.id} className={`group flex items-center gap-4 py-3 px-3 rounded-md hover:bg-muted/50 transition ${current?.id === t.id ? "bg-muted/30" : ""}`}>
          <button
            onClick={() => play(tracks, i)}
            className="w-8 h-8 grid place-items-center text-muted-foreground group-hover:text-foreground"
            aria-label="Abspielen"
          >
            <span className="group-hover:hidden">{i + 1}</span>
            <Play className="h-4 w-4 hidden group-hover:block" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-medium">{t.title}</div>
            {showArtist && <div className="truncate text-xs text-muted-foreground">{t.artist_name}</div>}
          </div>
          {user && (
            <>
              <AddToPlaylistButton trackId={t.id} />
              <button onClick={() => toggleLike(t.id)} className="text-muted-foreground hover:text-foreground" aria-label="Like">
                <Heart className={`h-4 w-4 ${likes.has(t.id) ? "fill-primary text-primary" : ""}`} />
              </button>
            </>
          )}
          <div className="text-xs text-muted-foreground tabular-nums w-12 text-right">{formatTime(t.duration_seconds)}</div>
          {onRemove && (
            <button onClick={() => onRemove(t.id)} className="text-muted-foreground hover:text-destructive" aria-label="Entfernen">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
