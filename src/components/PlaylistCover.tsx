import { useEffect, useState } from "react";
import { StorageImg } from "./StorageImg";
import { supabase } from "@/integrations/supabase/client";
import { Music } from "lucide-react";

export function PlaylistCover({
  playlistId,
  coverUrl,
  className = "",
}: {
  playlistId: string;
  coverUrl?: string | null;
  className?: string;
}) {
  const [covers, setCovers] = useState<string[] | null>(null);

  useEffect(() => {
    if (coverUrl) return;
    let alive = true;
    (async () => {
      const { data: pts } = await supabase
        .from("playlist_tracks")
        .select("track_id, position")
        .eq("playlist_id", playlistId)
        .order("position")
        .limit(30);
      const tids = (pts ?? []).map((x: { track_id: string }) => x.track_id);
      if (!tids.length) { if (alive) setCovers([]); return; }
      const { data: tr } = await supabase.from("tracks").select("id, release_id").in("id", tids);
      const relMap = new Map((tr ?? []).map((t) => [t.id, t.release_id]));
      const rIds = [...new Set(tids.map((id) => relMap.get(id)).filter(Boolean))] as string[];
      if (!rIds.length) { if (alive) setCovers([]); return; }
      const { data: rels } = await supabase.from("releases").select("id, cover_url").in("id", rIds);
      const cMap = new Map((rels ?? []).map((r) => [r.id, r.cover_url]));
      const ordered: string[] = [];
      const seen = new Set<string>();
      for (const tid of tids) {
        const rid = relMap.get(tid);
        const c = rid ? cMap.get(rid) : null;
        if (c && !seen.has(c)) { seen.add(c); ordered.push(c); }
        if (ordered.length === 4) break;
      }
      if (alive) setCovers(ordered);
    })();
    return () => { alive = false; };
  }, [playlistId, coverUrl]);

  if (coverUrl) {
    return <StorageImg src={coverUrl} className={`object-cover ${className}`} alt="" />;
  }
  if (covers === null) {
    return <div className={`bg-muted/40 ${className}`} />;
  }
  if (covers.length === 0) {
    return (
      <div className={`gradient-brand grid place-items-center ${className}`}>
        <Music className="h-1/3 w-1/3 text-white/70" />
      </div>
    );
  }
  if (covers.length < 4) {
    return <StorageImg src={covers[0]} className={`object-cover ${className}`} alt="" />;
  }
  return (
    <div className={`grid grid-cols-2 grid-rows-2 overflow-hidden ${className}`}>
      {covers.map((c, i) => (
        <StorageImg key={i} src={c} className="w-full h-full object-cover" alt="" />
      ))}
    </div>
  );
}
