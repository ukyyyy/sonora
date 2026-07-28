import { createFileRoute, Link } from "@tanstack/react-router";
import { StorageImg } from "@/components/StorageImg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrackList } from "@/components/TrackList";
import type { PlayerTrack } from "@/lib/player-context";
import { usePlayer } from "@/lib/player-context";
import { useAuth } from "@/lib/auth-context";
import { VerifiedBadge } from "@/components/Badges";
import { formatCount } from "@/lib/format";
import { Play, Sparkles, Clock3, Flame } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Sonora — Musik von unabhängigen Artists" },
    { name: "description", content: "Streame Musik von verifizierten Independent-Artists auf Sonora." },
  ]}),
  component: Home,
});

type ArtistRow = { user_id: string; artist_name: string };
type Release = { id: string; title: string; cover_url: string | null; type: string; artist_id: string; artist_name: string };

function Home() {
  const { user } = useAuth();
  const { play } = usePlayer();
  const [trending, setTrending] = useState<PlayerTrack[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [featured, setFeatured] = useState<Release | null>(null);
  const [artists, setArtists] = useState<Array<{ user_id: string; artist_name: string; avatar_url: string | null; followers: number }>>([]);
  const [recent, setRecent] = useState<PlayerTrack[]>([]);
  const [forYou, setForYou] = useState<PlayerTrack[]>([]);

  useEffect(() => {
    (async () => {
      // trending tracks
      const { data: tracks } = await supabase
        .from("tracks")
        .select("id, title, audio_path, duration_seconds, artist_id, release_id")
        .order("play_count", { ascending: false })
        .limit(12);
      let coverMap = new Map<string, string | null>();
      let nameMap = new Map<string, string>();
      if (tracks && tracks.length) {
        const artistIds = [...new Set(tracks.map((t) => t.artist_id))];
        const releaseIds = [...new Set(tracks.map((t) => t.release_id))];
        const [{ data: aps }, { data: rels }] = await Promise.all([
          supabase.from("artist_profiles").select("user_id, artist_name").in("user_id", artistIds),
          supabase.from("releases").select("id, cover_url").in("id", releaseIds),
        ]);
        nameMap = new Map((aps ?? []).map((a: ArtistRow) => [a.user_id, a.artist_name]));
        coverMap = new Map((rels ?? []).map((r: { id: string; cover_url: string | null }) => [r.id, r.cover_url]));
        setTrending(tracks.map((t) => ({
          id: t.id, title: t.title, audio_path: t.audio_path, duration_seconds: t.duration_seconds,
          artist_id: t.artist_id, artist_name: nameMap.get(t.artist_id) ?? "Unbekannt",
          cover_url: coverMap.get(t.release_id) ?? null,
        })));
      }

      // new releases (featured = first)
      const { data: newRels } = await supabase
        .from("releases")
        .select("id, title, cover_url, type, artist_id")
        .order("released_at", { ascending: false })
        .limit(18);
      if (newRels && newRels.length) {
        const ids = [...new Set(newRels.map((r) => r.artist_id))];
        const { data: aps } = await supabase.from("artist_profiles").select("user_id, artist_name").in("user_id", ids);
        const aMap = new Map((aps ?? []).map((a: ArtistRow) => [a.user_id, a.artist_name]));
        const list: Release[] = newRels.map((r) => ({ ...r, artist_name: aMap.get(r.artist_id) ?? "Unbekannt" }));
        setFeatured(list[0]);
        setReleases(list.slice(1));
      }

      // artists with avatars + follower counts
      const { data: ap } = await supabase.from("artist_profiles").select("user_id, artist_name").limit(10);
      if (ap && ap.length) {
        const ids = ap.map((a) => a.user_id);
        const { data: profs } = await supabase.from("profiles").select("id, avatar_url").in("id", ids);
        const pMap = new Map((profs ?? []).map((p: { id: string; avatar_url: string | null }) => [p.id, p.avatar_url]));
        const withCounts = await Promise.all(ap.map(async (a) => {
          const { count } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("artist_id", a.user_id);
          return { user_id: a.user_id, artist_name: a.artist_name, avatar_url: pMap.get(a.user_id) ?? null, followers: count ?? 0 };
        }));
        setArtists(withCounts.sort((a, b) => b.followers - a.followers));
      }

      // recent plays (only if logged in)
      if (user) {
        const { data: plays } = await supabase
          .from("plays")
          .select("track_id, played_at")
          .eq("user_id", user.id)
          .order("played_at", { ascending: false })
          .limit(20);
        const uniqIds = [...new Set((plays ?? []).map((p: { track_id: string }) => p.track_id))].slice(0, 8);
        if (uniqIds.length) {
          const { data: rt } = await supabase
            .from("tracks")
            .select("id, title, audio_path, duration_seconds, artist_id, release_id")
            .in("id", uniqIds);
          if (rt && rt.length) {
            const artistIds = [...new Set(rt.map((t) => t.artist_id))];
            const releaseIds = [...new Set(rt.map((t) => t.release_id))];
            const [{ data: aps }, { data: rels }] = await Promise.all([
              supabase.from("artist_profiles").select("user_id, artist_name").in("user_id", artistIds),
              supabase.from("releases").select("id, cover_url").in("id", releaseIds),
            ]);
            const aMap = new Map((aps ?? []).map((a: ArtistRow) => [a.user_id, a.artist_name]));
            const cMap = new Map((rels ?? []).map((r: { id: string; cover_url: string | null }) => [r.id, r.cover_url]));
            const byId = new Map(rt.map((t) => [t.id, t]));
            setRecent(uniqIds.map((id) => byId.get(id)).filter(Boolean).map((t) => ({
              id: t!.id, title: t!.title, audio_path: t!.audio_path, duration_seconds: t!.duration_seconds,
              artist_id: t!.artist_id, artist_name: aMap.get(t!.artist_id) ?? "Unbekannt",
              cover_url: cMap.get(t!.release_id) ?? null,
            })));
          }
        }
      }
    })();
  }, [user?.id]);

  // "Für dich" — shuffled slice of trending as a lightweight recommendation
  useEffect(() => {
    if (trending.length) {
      const copy = [...trending].sort(() => Math.random() - 0.5).slice(0, 6);
      setForYou(copy);
    }
  }, [trending]);

  return (
    <div className="space-y-10 md:space-y-14 animate-liquid-in">
      {/* HERO — dark glass with subtle chrome bloom, featured cover on the right */}
      <section className="relative overflow-hidden rounded-3xl glass-strong ring-chrome">
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full opacity-30 blur-3xl animate-liquid-drift"
          style={{ background: "radial-gradient(closest-side, rgba(255,255,255,0.35), transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(120,140,180,0.5), transparent 70%)" }} />

        <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] items-center p-6 md:p-10">
          <div className="min-w-0">
            <div className="text-hairline mb-3 flex items-center gap-2"><Sparkles className="h-3 w-3" /> Independent · Verifiziert</div>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95] text-chrome mb-4">Sonora</h1>
            <p className="text-base md:text-lg text-foreground/80 max-w-lg">
              Musik direkt von unabhängigen Artists. Entdecke neue Releases, folge deinen Favoriten und bau deine eigenen Playlists.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => trending.length && play(trending, 0)}
                disabled={!trending.length}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium ring-chrome disabled:opacity-40"
                style={{ background: "var(--grad-chrome)", color: "#0a0a0a" }}
              >
                <Play className="h-4 w-4" /> Jetzt starten
              </button>
              <Link to="/search" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm glass ring-chrome hover:bg-white/5 transition">
                Entdecken
              </Link>
            </div>
          </div>

          {featured && (
            <Link to="/album/$id" params={{ id: featured.id }} className="hidden md:block group relative">
              <div className="absolute -inset-6 rounded-3xl bg-white/5 blur-2xl opacity-60 group-hover:opacity-80 transition" />
              {featured.cover_url ? (
                <StorageImg src={featured.cover_url} alt="" className="relative w-56 h-56 lg:w-72 lg:h-72 rounded-2xl object-cover ring-chrome transition group-hover:scale-[1.02]" />
              ) : (
                <div className="relative w-56 h-56 lg:w-72 lg:h-72 rounded-2xl gradient-brand ring-chrome" />
              )}
              <div className="relative mt-3">
                <div className="text-hairline">Neu · {featured.type}</div>
                <div className="text-sm font-medium truncate max-w-[18rem]">{featured.title}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[18rem]">{featured.artist_name}</div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Zuletzt gehört — nur eingeloggt, quick cover grid */}
      {recent.length > 0 && (
        <Section eyebrow="Fortsetzen" title="Zuletzt gehört" icon={<Clock3 className="h-3.5 w-3.5" />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {recent.slice(0, 8).map((t, i) => (
              <button key={t.id} onClick={() => play(recent, i)} className="group flex items-center gap-3 p-2 pr-4 rounded-2xl glass ring-chrome hover:bg-white/5 transition text-left">
                {t.cover_url ? (
                  <StorageImg src={t.cover_url} alt="" className="h-14 w-14 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded-xl gradient-brand shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{t.artist_name}</div>
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition h-8 w-8 grid place-items-center rounded-full ring-chrome shrink-0" style={{ background: "var(--grad-chrome)", color: "#0a0a0a" }}>
                  <Play className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Für dich */}
      {forYou.length > 0 && (
        <Section eyebrow="Empfehlungen" title="Für dich" icon={<Sparkles className="h-3.5 w-3.5" />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {forYou.map((t, i) => (
              <button key={t.id} onClick={() => play(forYou, i)} className="group text-left">
                <div className="relative">
                  {t.cover_url ? (
                    <StorageImg src={t.cover_url} alt="" className="w-full aspect-square rounded-2xl object-cover ring-chrome" />
                  ) : (
                    <div className="w-full aspect-square rounded-2xl gradient-brand ring-chrome" />
                  )}
                  <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 transition grid place-items-center">
                    <span className="opacity-0 group-hover:opacity-100 transition h-10 w-10 grid place-items-center rounded-full ring-chrome" style={{ background: "var(--grad-chrome)", color: "#0a0a0a" }}>
                      <Play className="h-4 w-4" />
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium truncate">{t.title}</div>
                <div className="text-xs text-muted-foreground truncate">{t.artist_name}</div>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Trending */}
      <Section eyebrow="Chart" title="Trending" icon={<Flame className="h-3.5 w-3.5" />}>
        <div className="rounded-2xl glass ring-chrome p-2">
          <TrackList tracks={trending.slice(0, 8)} />
        </div>
      </Section>

      {/* Neue Releases */}
      <Section eyebrow="Frisch" title="Neue Releases">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {releases.map((r) => (
            <Link key={r.id} to="/album/$id" params={{ id: r.id }} className="group">
              <div className="relative">
                {r.cover_url ? (
                  <StorageImg src={r.cover_url} alt="" className="w-full aspect-square rounded-2xl object-cover ring-chrome" />
                ) : (
                  <div className="w-full aspect-square rounded-2xl gradient-brand ring-chrome" />
                )}
                <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/25 transition" />
              </div>
              <div className="mt-2 text-sm font-medium truncate">{r.title}</div>
              <div className="text-[11px] text-muted-foreground truncate tracking-wider uppercase">{r.type} · {r.artist_name}</div>
            </Link>
          ))}
          {releases.length === 0 && <div className="col-span-full text-sm text-muted-foreground">Noch keine Releases.</div>}
        </div>
      </Section>

      {/* Top Artists */}
      <Section eyebrow="Community" title="Top Artists">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {artists.map((a) => (
            <Link key={a.user_id} to="/artist/$id" params={{ id: a.user_id }} className="group p-4 rounded-2xl glass ring-chrome hover:bg-white/5 transition text-center">
              {a.avatar_url ? (
                <StorageImg src={a.avatar_url} alt="" className="mx-auto h-24 w-24 rounded-full object-cover ring-chrome" />
              ) : (
                <div className="mx-auto h-24 w-24 rounded-full gradient-brand ring-chrome" />
              )}
              <div className="mt-3 font-semibold flex items-center justify-center gap-1 truncate">{a.artist_name} <VerifiedBadge /></div>
              <div className="text-xs text-muted-foreground">{formatCount(a.followers)} Follower</div>
            </Link>
          ))}
          {artists.length === 0 && <div className="col-span-full text-sm text-muted-foreground">Noch keine Artists.</div>}
        </div>
      </Section>
    </div>
  );
}

function Section({ eyebrow, title, icon, children }: { eyebrow?: string; title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline gap-3">
        <div>
          {eyebrow && (
            <div className="text-hairline mb-1 flex items-center gap-1.5">{icon}{eyebrow}</div>
          )}
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}
