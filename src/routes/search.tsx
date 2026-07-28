import { createFileRoute, Link } from "@tanstack/react-router";
import { StorageImg } from "@/components/StorageImg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VerifiedBadge } from "@/components/Badges";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Suche — Sonora" }, { name: "description", content: "Suche nach Tracks, Artists und Alben auf Sonora." }] }),
  component: Search,
});

function Search() {
  const [q, setQ] = useState("");
  const [artists, setArtists] = useState<Array<{ user_id: string; artist_name: string }>>([]);
  const [releases, setReleases] = useState<Array<{ id: string; title: string; type: string; cover_url: string | null }>>([]);
  const [tracks, setTracks] = useState<Array<{ id: string; title: string; artist_id: string }>>([]);

  useEffect(() => {
    if (!q.trim()) { setArtists([]); setReleases([]); setTracks([]); return; }
    const h = setTimeout(async () => {
      const like = `%${q}%`;
      const [a, r, t] = await Promise.all([
        supabase.from("artist_profiles").select("user_id, artist_name").ilike("artist_name", like).limit(10),
        supabase.from("releases").select("id, title, type, cover_url").ilike("title", like).limit(10),
        supabase.from("tracks").select("id, title, artist_id").ilike("title", like).limit(10),
      ]);
      setArtists(a.data ?? []);
      setReleases(r.data ?? []);
      setTracks(t.data ?? []);
    }, 200);
    return () => clearTimeout(h);
  }, [q]);

  return (
    <div className="space-y-8">
      <input
        autoFocus placeholder="Suche nach Tracks, Artists, Alben..."
        value={q} onChange={(e) => setQ(e.target.value)}
        className="w-full px-4 py-3 rounded-lg bg-card border border-border text-base"
      />

      {artists.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Artists</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {artists.map((a) => (
              <Link key={a.user_id} to="/artist/$id" params={{ id: a.user_id }} className="p-4 rounded-lg bg-card hover:bg-muted flex items-center gap-2">
                <span className="font-medium">{a.artist_name}</span> <VerifiedBadge />
              </Link>
            ))}
          </div>
        </section>
      )}

      {releases.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Releases</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {releases.map((r) => (
              <Link key={r.id} to="/album/$id" params={{ id: r.id }} className="block">
                {r.cover_url ? <StorageImg src={r.cover_url} className="w-full aspect-square rounded object-cover" alt="" /> : <div className="w-full aspect-square rounded gradient-brand" />}
                <div className="mt-2 text-sm truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground uppercase">{r.type}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {tracks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Tracks</h2>
          <ul className="space-y-1">
            {tracks.map((t) => (
              <li key={t.id} className="p-3 rounded bg-card">{t.title}</li>
            ))}
          </ul>
        </section>
      )}

      {q && !artists.length && !releases.length && !tracks.length && (
        <div className="text-sm text-muted-foreground">Keine Treffer.</div>
      )}
    </div>
  );
}
