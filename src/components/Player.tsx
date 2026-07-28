import { usePlayer } from "@/lib/player-context";
import { StorageImg } from "@/components/StorageImg";
import { ListMusic, Maximize2, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { formatTime } from "@/lib/format";
import { useSignedUrl } from "@/lib/storage-url";
import { useAccentColor } from "@/components/useAccentColor";

export function Player() {
  const p = usePlayer();
  const { current, isPlaying, toggle, next, prev, position, duration, seek, volume, setVolume, setFullscreen, queueOpen, setQueueOpen, fullscreen } = p;
  const signed = useSignedUrl(current?.cover_url ?? null);
  const { rgb } = useAccentColor(signed, !!current && !fullscreen);
  const [r, g, b] = rgb;

  if (!current) {
    return (
      <div className="mx-3 mb-3 h-16 md:h-20 rounded-2xl md:rounded-3xl glass ring-chrome px-5 flex items-center text-sm text-muted-foreground">
        Wähle einen Track zum Abspielen.
      </div>
    );
  }

  const pct = duration ? (position / duration) * 100 : 0;

  return (
    <div
      className="mx-3 mb-3 rounded-2xl md:rounded-3xl glass-strong ring-chrome relative overflow-hidden"
      style={{
        boxShadow: `0 30px 60px -20px rgba(${r},${g},${b},0.4), 0 0 0 1px rgba(255,255,255,0.06)`,
      }}
    >
      {/* dynamic cover glow */}
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: `radial-gradient(500px 120px at 8% 50%, rgba(${r},${g},${b},0.45), transparent 65%)` }} />

      {/* MOBILE row */}
      <div className="md:hidden flex items-center gap-3 px-3 py-2.5 relative">
        <button className="flex items-center gap-3 min-w-0 flex-1 text-left" onClick={() => setFullscreen(true)}>
          {current.cover_url ? (
            <StorageImg src={current.cover_url} alt="" className="h-11 w-11 rounded-lg object-cover ring-chrome shrink-0" />
          ) : (
            <div className="h-11 w-11 rounded-lg gradient-brand ring-chrome shrink-0" />
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{current.title}</div>
            <div className="truncate text-xs text-muted-foreground">{current.artist_name}</div>
          </div>
        </button>
        <button onClick={prev} className="text-muted-foreground hover:text-foreground p-2" aria-label="Zurück"><SkipBack className="h-4 w-4" /></button>
        <button
          onClick={toggle}
          className="h-10 w-10 grid place-items-center rounded-full ring-chrome shrink-0"
          style={{ background: `linear-gradient(180deg, rgb(${r},${g},${b}), rgba(${r},${g},${b},0.75))`, color: "#0a0a0a" }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>
        <button onClick={next} className="text-muted-foreground hover:text-foreground p-2" aria-label="Weiter"><SkipForward className="h-4 w-4" /></button>
      </div>
      {/* mobile progress bar */}
      <div className="md:hidden h-1 bg-white/10">
        <div className="h-full transition-[width] duration-200" style={{ width: `${pct}%`, background: `linear-gradient(90deg, rgba(${r},${g},${b},0.7), rgb(${r},${g},${b}))` }} />
      </div>

      {/* DESKTOP row */}
      <div className="hidden md:flex items-center gap-4 px-4 h-20 relative">
        <button className="flex items-center gap-3 min-w-0 w-64 text-left group" onClick={() => setFullscreen(true)}>
          {current.cover_url ? (
            <StorageImg src={current.cover_url} alt="" className="h-12 w-12 rounded-xl object-cover ring-chrome" />
          ) : (
            <div className="h-12 w-12 rounded-xl gradient-brand ring-chrome" />
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium group-hover:underline underline-offset-4">{current.title}</div>
            <div className="truncate text-xs text-muted-foreground">{current.artist_name}</div>
          </div>
        </button>

        <div className="flex-1 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-5">
            <button onClick={prev} className="text-foreground/70 hover:text-foreground transition" aria-label="Zurück"><SkipBack className="h-4 w-4" /></button>
            <button
              onClick={toggle}
              className="h-10 w-10 grid place-items-center rounded-full ring-chrome transition hover:scale-105"
              style={{ background: `linear-gradient(180deg, rgb(${r},${g},${b}), rgba(${r},${g},${b},0.72))`, color: "#0a0a0a" }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <button onClick={next} className="text-foreground/70 hover:text-foreground transition" aria-label="Weiter"><SkipForward className="h-4 w-4" /></button>
          </div>
          <div className="w-full max-w-2xl flex items-center gap-3 text-[11px]">
            <span className="w-10 text-right tabular-nums text-foreground/90 font-medium">{formatTime(position)}</span>
            <div className="relative flex-1 group">
              <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full transition-[width] duration-200" style={{ width: `${pct}%`, background: `linear-gradient(90deg, rgba(${r},${g},${b},0.85), rgb(${r},${g},${b}))` }} />
              </div>
              <input
                type="range" min={0} max={duration || 0} step={0.1} value={position}
                onChange={(e) => seek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Position"
              />
            </div>
            <span className="w-10 tabular-nums text-foreground/70">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-52 justify-end">
          <button
            onClick={() => setQueueOpen(!queueOpen)}
            className={`h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 transition ${queueOpen ? "bg-white/10" : ""}`}
            aria-label="Warteschlange"
          >
            <ListMusic className="h-4 w-4" />
          </button>
          <button onClick={() => setFullscreen(true)} className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10 transition" aria-label="Vollbild">
            <Maximize2 className="h-4 w-4" />
          </button>
          <Volume2 className="h-4 w-4 text-muted-foreground ml-2" />
          <div className="relative w-24 group">
            <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full" style={{ width: `${volume * 100}%`, background: `linear-gradient(90deg, rgba(${r},${g},${b},0.85), rgb(${r},${g},${b}))` }} />
            </div>
            <input
              type="range" min={0} max={1} step={0.01} value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Lautstärke"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
