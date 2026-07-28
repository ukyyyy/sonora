import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { Search, Music2, Disc3, User } from "lucide-react";
import { usePlayer, type PlayerTrack } from "@/lib/player-context";

type Item =
  | { kind: "track"; id: string; title: string; sub: string; track: PlayerTrack }
  | { kind: "release"; id: string; title: string; sub: string }
  | { kind: "artist"; id: string; title: string; sub: string };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { play } = usePlayer();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20);
    else { setQ(""); setItems([]); setActive(0); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (!term) { setItems([]); return; }
    const like = `%${term}%`;
    let cancelled = false;
    (async () => {
      const [tr, rl, ar] = await Promise.all([
        supabase.from("tracks").select("id, title, audio_path, duration_seconds, artist_id, release_id").ilike("title", like).limit(6),
        supabase.from("releases").select("id, title, type, cover_url").ilike("title", like).limit(4),
        supabase.from("artist_profiles").select("user_id, artist_name").ilike("artist_name", like).limit(4),
      ]);
      if (cancelled) return;
      const relIds = [...new Set((tr.data ?? []).map((t) => t.release_id))];
      const [rels, names] = await Promise.all([
        relIds.length ? supabase.from("releases").select("id, cover_url").in("id", relIds) : Promise.resolve({ data: [] }),
        (tr.data ?? []).length
          ? supabase.from("artist_profiles").select("user_id, artist_name").in("user_id", [...new Set((tr.data ?? []).map((t) => t.artist_id))])
          : Promise.resolve({ data: [] }),
      ]);
      const rMap = new Map(((rels.data ?? []) as Array<{ id: string; cover_url: string | null }>).map((r) => [r.id, r.cover_url]));
      const nMap = new Map(((names.data ?? []) as Array<{ user_id: string; artist_name: string }>).map((n) => [n.user_id, n.artist_name]));
      const out: Item[] = [
        ...(tr.data ?? []).map((t) => ({
          kind: "track" as const,
          id: t.id,
          title: t.title,
          sub: nMap.get(t.artist_id) ?? "Track",
          track: { ...t, artist_name: nMap.get(t.artist_id), cover_url: rMap.get(t.release_id) ?? null } as PlayerTrack,
        })),
        ...(ar.data ?? []).map((a) => ({ kind: "artist" as const, id: a.user_id, title: a.artist_name, sub: "Artist" })),
        ...(rl.data ?? []).map((r) => ({ kind: "release" as const, id: r.id, title: r.title, sub: r.type })),
      ];
      setItems(out); setActive(0);
    })();
    return () => { cancelled = true; };
  }, [q, open]);

  const activate = (it: Item) => {
    setOpen(false);
    if (it.kind === "track") play([it.track], 0);
    else if (it.kind === "artist") navigate({ to: "/artist/$id", params: { id: it.id } });
    else navigate({ to: "/album/$id", params: { id: it.id } });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] p-4 pt-24 flex justify-center animate-liquid-in" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(20px)" }} onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-xl glass-strong ring-chrome rounded-3xl overflow-hidden h-fit"
        style={{ boxShadow: "0 60px 120px -30px rgba(0,0,0,0.9)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === "Enter" && items[active]) { e.preventDefault(); activate(items[active]); }
            }}
            placeholder="Suche Tracks, Alben, Artists…"
            className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
          />
          <span className="text-[10px] text-muted-foreground tracking-widest">ESC</span>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              {q ? "Nichts gefunden." : "Suche nach allem. Auch mit ⌘K erreichbar."}
            </div>
          ) : items.map((it, i) => {
            const Icon = it.kind === "track" ? Music2 : it.kind === "artist" ? User : Disc3;
            return (
              <button
                key={`${it.kind}-${it.id}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => activate(it)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition ${active === i ? "bg-white/8" : "hover:bg-white/4"}`}
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm">{it.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{it.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
