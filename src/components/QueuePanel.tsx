import { usePlayer } from "@/lib/player-context";
import { StorageImg } from "@/components/StorageImg";
import { X, Play, Trash2 } from "lucide-react";

export function QueuePanel() {
  const { queue, index, queueOpen, setQueueOpen, playAt, removeFromQueue } = usePlayer();
  if (!queueOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={() => setQueueOpen(false)} style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
      <aside
        className="fixed right-3 top-3 bottom-24 w-96 z-[95] rounded-3xl glass-strong ring-chrome overflow-hidden flex flex-col animate-liquid-in"
        style={{ boxShadow: "0 40px 100px -30px rgba(0,0,0,0.8)" }}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <div className="text-hairline">Warteschlange</div>
            <div className="text-lg font-medium">{queue.length} Tracks</div>
          </div>
          <button onClick={() => setQueueOpen(false)} className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/6" aria-label="Schließen">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto py-2">
          {queue.length === 0 && <div className="px-5 py-8 text-sm text-muted-foreground">Nichts in der Warteschlange.</div>}
          {queue.map((t, i) => (
            <div key={`${t.id}-${i}`} className={`group flex items-center gap-3 px-4 py-2 mx-1 rounded-xl ${i === index ? "bg-white/8" : "hover:bg-white/4"}`}>
              <button onClick={() => playAt(i)} className="relative shrink-0" aria-label="Abspielen">
                {t.cover_url ? <StorageImg src={t.cover_url} className="h-10 w-10 rounded-md object-cover" alt="" /> : <div className="h-10 w-10 rounded-md bg-white/8" />}
                <span className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-md">
                  <Play className="h-3.5 w-3.5" />
                </span>
              </button>
              <div className="flex-1 min-w-0">
                <div className={`truncate text-sm ${i === index ? "text-foreground" : ""}`}>{t.title}</div>
                <div className="truncate text-xs text-muted-foreground">{t.artist_name}</div>
              </div>
              <button onClick={() => removeFromQueue(i)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" aria-label="Entfernen">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
