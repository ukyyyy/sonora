import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PlaylistCover } from "@/components/PlaylistCover";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/Avatar";
import { Plus, Heart, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { useUI } from "@/lib/ui";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "Deine Bibliothek — Sonora" }, { name: "description", content: "Deine Playlists, gelikten Tracks und gefolgten Artists." }] }),
  component: Library,
});

function Library() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { prompt, confirm } = useUI();
  const [likedCount, setLikedCount] = useState(0);
  const [playlists, setPlaylists] = useState<Array<{ id: string; title: string; cover_url: string | null }>>([]);
  const [artists, setArtists] = useState<Array<{ user_id: string; artist_name: string; avatar_url: string | null }>>([]);

  useEffect(() => { if (!loading && !user) router.navigate({ to: "/auth" }); }, [user, loading, router]);

  const load = async () => {
    if (!user) return;
    const [{ count }, { data: pls }, { data: fs }] = await Promise.all([
      supabase.from("likes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("playlists").select("id, title, cover_url").eq("owner_id", user.id).order("created_at", { ascending: false }),
      supabase.from("follows").select("artist_id").eq("follower_id", user.id),
    ]);
    setLikedCount(count ?? 0);
    setPlaylists(pls ?? []);
    const aids = (fs ?? []).map((f: { artist_id: string }) => f.artist_id);
    if (aids.length) {
      const [{ data: aps }, { data: profs }] = await Promise.all([
        supabase.from("artist_profiles").select("user_id, artist_name").in("user_id", aids),
        supabase.from("profiles").select("id, avatar_url").in("id", aids),
      ]);
      const pMap = new Map((profs ?? []).map((p) => [p.id, p.avatar_url]));
      setArtists((aps ?? []).map((a) => ({ ...a, avatar_url: pMap.get(a.user_id) ?? null })));
    } else setArtists([]);
  };
  useEffect(() => { load(); }, [user?.id]);

  const createPlaylist = async () => {
    if (!user) return;
    const title = await prompt({ title: "Neue Playlist", description: "Gib ihr einen Namen.", placeholder: "Meine Playlist", confirmLabel: "Erstellen" });
    if (!title) return;
    const { data, error } = await supabase.from("playlists").insert({ owner_id: user.id, title }).select().single();
    if (error) return toast.error(error.message);
    setPlaylists((p) => [{ id: data.id, title: data.title, cover_url: null }, ...p]);
    toast.success("Playlist erstellt");
  };

  const deletePlaylist = async (id: string) => {
    const ok = await confirm({ title: "Playlist löschen?", description: "Diese Aktion kann nicht rückgängig gemacht werden.", destructive: true, confirmLabel: "Löschen" });
    if (!ok) return;
    const { error } = await supabase.from("playlists").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPlaylists((p) => p.filter((x) => x.id !== id));
  };

  if (!user) return null;

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Deine Playlists</h2>
          <button onClick={createPlaylist} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded gradient-brand text-primary-foreground">
            <Plus className="h-4 w-4" /> Neu
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/liked" className="p-4 rounded-lg bg-card hover:bg-muted transition">
            <div className="w-full aspect-square rounded bg-gradient-to-br from-primary to-fuchsia-700 grid place-items-center mb-3">
              <Heart className="h-12 w-12 text-white fill-white" />
            </div>
            <div className="font-medium truncate">Gelikte Tracks</div>
            <div className="text-xs text-muted-foreground">{likedCount} Songs</div>
          </Link>
          {playlists.map((p) => (
            <div key={p.id} className="group relative">
              <Link to="/playlist/$id" params={{ id: p.id }} className="block p-4 rounded-lg bg-card hover:bg-muted transition">
                <PlaylistCover
                  playlistId={p.id}
                  coverUrl={p.cover_url}
                  className="w-full aspect-square rounded mb-3"
                />

                <div className="font-medium truncate">{p.title}</div>
              </Link>
              <button onClick={() => deletePlaylist(p.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded bg-background/80 text-muted-foreground hover:text-destructive" aria-label="Löschen">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Folgst du</h2>
        {artists.length === 0 ? <div className="text-sm text-muted-foreground">Du folgst noch keinen Artists.</div> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {artists.map((a) => (
              <Link key={a.user_id} to="/artist/$id" params={{ id: a.user_id }} className="p-4 rounded-lg bg-card hover:bg-muted flex flex-col items-center text-center">
                <Avatar url={a.avatar_url} name={a.artist_name} size={80} className="mb-3" />
                <div className="text-sm truncate w-full">{a.artist_name}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
