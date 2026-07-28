import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Plus, ListPlus } from "lucide-react";
import { toast } from "@/lib/toast";
import { useUI } from "@/lib/ui";

export function AddToPlaylistButton({ trackId }: { trackId: string }) {
  const { user } = useAuth();
  const { prompt } = useUI();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Array<{ id: string; title: string }>>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("playlists").select("id, title").eq("owner_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setPlaylists(data ?? []));
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!user) return null;

  const add = async (playlistId: string) => {
    const { data: existing } = await supabase.from("playlist_tracks").select("track_id")
      .eq("playlist_id", playlistId).eq("track_id", trackId).maybeSingle();
    if (existing) { toast.info("Track ist schon in dieser Playlist."); setOpen(false); return; }
    const { data: last } = await supabase.from("playlist_tracks").select("position")
      .eq("playlist_id", playlistId).order("position", { ascending: false }).limit(1).maybeSingle();
    const position = (last?.position ?? -1) + 1;
    const { error } = await supabase.from("playlist_tracks").insert({ playlist_id: playlistId, track_id: trackId, position });
    if (error) return toast.error(error.message);
    toast.success("Zur Playlist hinzugefügt");
    setOpen(false);
  };

  const createAndAdd = async () => {
    setOpen(false);
    const title = await prompt({ title: "Neue Playlist", description: "Gib ihr einen Namen.", placeholder: "Meine Playlist", confirmLabel: "Erstellen & hinzufügen" });
    if (!title) return;
    const { data, error } = await supabase.from("playlists").insert({ owner_id: user.id, title }).select().single();
    if (error) return toast.error(error.message);
    await add(data.id);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Zu Playlist hinzufügen"
      >
        <ListPlus className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-40 w-56 bg-popover border border-border rounded-md shadow-lg py-1 max-h-72 overflow-y-auto">
          <button
            onClick={createAndAdd}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Neue Playlist
          </button>
          {playlists.length > 0 && <div className="my-1 border-t border-border" />}
          {playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => add(p.id)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted truncate"
            >
              {p.title}
            </button>
          ))}
          {playlists.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Keine Playlists — erstelle eine neue.</div>
          )}
        </div>
      )}
    </div>
  );
}
