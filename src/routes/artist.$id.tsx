import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VerifiedBadge } from "@/components/Badges";
import { TrackList } from "@/components/TrackList";
import { useAuth } from "@/lib/auth-context";
import type { PlayerTrack } from "@/lib/player-context";
import { formatCount } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { StorageImg } from "@/components/StorageImg";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/artist/$id")({
  component: ArtistPage,
});

function ArtistPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [artist, setArtist] = useState<{ user_id: string; artist_name: string; banner_url: string | null } | null>(null);
  const [profile, setProfile] = useState<{ avatar_url: string | null; bio: string | null } | null>(null);
  const [followers, setFollowers] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [releases, setReleases] = useState<Array<{ id: string; title: string; type: string; cover_url: string | null }>>([]);
  const [topTracks, setTopTracks] = useState<PlayerTrack[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: p }, { count }] = await Promise.all([
        supabase.from("artist_profiles").select("user_id, artist_name, banner_url").eq("user_id", id).maybeSingle(),
        supabase.from("profiles").select("avatar_url, bio").eq("id", id).maybeSingle(),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("artist_id", id),
      ]);
      setArtist(a); setProfile(p); setFollowers(count ?? 0);
      if (user) {
        const { data: f } = await supabase.from("follows").select("*").eq("follower_id", user.id).eq("artist_id", id).maybeSingle();
        setIsFollowing(!!f);
      }
      const { data: r } = await supabase.from("releases").select("id, title, type, cover_url").eq("artist_id", id).order("released_at", { ascending: false });
      setReleases(r ?? []);
      const { data: t } = await supabase.from("tracks").select("id, title, audio_path, duration_seconds, artist_id, release_id").eq("artist_id", id).order("play_count", { ascending: false }).limit(10);
      if (t) {
        const relIds = [...new Set(t.map((x) => x.release_id))];
        const { data: rels } = await supabase.from("releases").select("id, cover_url").in("id", relIds);
        const rMap = new Map((rels ?? []).map((r: { id: string; cover_url: string | null }) => [r.id, r.cover_url]));
        setTopTracks(t.map((x) => ({ ...x, artist_name: a?.artist_name, cover_url: rMap.get(x.release_id) ?? null })));
      }
    })();
  }, [id, user?.id]);

  const toggleFollow = async () => {
    if (!user) { toast.error("Bitte anmelden."); return; }
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("artist_id", id);
      setIsFollowing(false); setFollowers((n) => n - 1);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, artist_id: id });
      setIsFollowing(true); setFollowers((n) => n + 1);
    }
  };

  if (!artist) return <div className="text-muted-foreground">Lade...</div>;

  return (
    <div className="space-y-10">
      <div className="relative -mx-6 -mt-8">
        <div className="h-64 w-full overflow-hidden">
          {artist.banner_url
            ? <StorageImg src={artist.banner_url} className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full bg-gradient-to-br from-primary/40 via-fuchsia-600/30 to-background" />}
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
        <div className="px-6 -mt-24 relative flex items-end gap-6">
          <Avatar url={profile?.avatar_url} name={artist.artist_name} size={160} className="border-4 border-background shadow-2xl" />
          <div className="pb-4">
            <div className="text-xs uppercase text-muted-foreground">Verifizierter Artist</div>
            <h1 className="text-5xl font-bold flex items-center gap-2">{artist.artist_name} <VerifiedBadge className="h-8 w-8" /></h1>
            <div className="text-sm text-muted-foreground mt-2">{formatCount(followers)} Follower</div>
            <button onClick={toggleFollow} className={`mt-4 px-6 py-2 rounded-full text-sm font-medium ${isFollowing ? "bg-muted" : "gradient-brand text-primary-foreground"}`}>
              {isFollowing ? "Folgst du" : "Folgen"}
            </button>
          </div>
        </div>
      </div>

      {profile?.bio && (
        <section className="max-w-3xl">
          <h2 className="text-lg font-semibold mb-2">Über</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{profile.bio}</p>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold mb-4">Beliebt</h2>
        <TrackList tracks={topTracks} showArtist={false} />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Diskografie</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {releases.map((r) => (
            <Link key={r.id} to="/album/$id" params={{ id: r.id }} className="block">
              {r.cover_url ? <StorageImg src={r.cover_url} className="w-full aspect-square rounded object-cover" alt="" /> : <div className="w-full aspect-square rounded gradient-brand" />}
              <div className="mt-2 text-sm truncate">{r.title}</div>
              <div className="text-xs text-muted-foreground uppercase">{r.type}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
