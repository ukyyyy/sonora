import { usePlayer } from "@/lib/player-context";
import { StorageImg } from "@/components/StorageImg";
import { ChevronDown, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { formatTime } from "@/lib/format";
import { useSignedUrl } from "@/lib/storage-url";
import { useAccentColor } from "@/components/useAccentColor";

export function NowPlaying() {
  const { current, fullscreen, setFullscreen, isPlaying, toggle, next, prev, position, duration, seek } = usePlayer();
  const signed = useSignedUrl(current?.cover_url ?? null);
  const { rgb } = useAccentColor(signed, fullscreen);

  if (!fullscreen || !current) return null;

  const [r, g, b] = rgb;

  return (
    <div className="fixed inset-0 z-[130] overflow-hidden animate-liquid-in" style={{ background: "#050506" }}>
      {/* Ambient blurred cover */}
      {signed && (
        <div className="absolute inset-0 opacity-70">
          <img
            src={signed}
            alt=""
            className="w-full h-full object-cover animate-liquid-drift"
            style={{ filter: "blur(80px) saturate(160%)", transform: "scale(1.4)" }}
          />
          <div className="absolute inset-0" style={{ background: `radial-gradient(1000px 700px at 50% 40%, rgba(${r},${g},${b},0.35), transparent 70%), linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.75))` }} />
        </div>
      )}

      <div className="relative h-full flex flex-col">
        <header className="flex items-center justify-between px-6 py-5">
          <button onClick={() => setFullscreen(false)} className="h-10 w-10 grid place-items-center rounded-full glass ring-chrome hover:bg-white/8" aria-label="Minimieren">
            <ChevronDown className="h-5 w-5" />
          </button>
          <div className="text-hairline">Jetzt läuft</div>
          <div className="w-10" />
        </header>

        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 px-8 pb-8">
          <div className="relative">
            <div className="absolute -inset-8 rounded-[2rem] blur-3xl opacity-70" style={{ background: `rgba(${r},${g},${b},0.6)` }} />
            {signed
              ? <img src={signed} alt="" className="relative w-[min(60vw,420px)] aspect-square rounded-3xl object-cover ring-chrome" style={{ boxShadow: `0 60px 120px -30px rgba(${r},${g},${b},0.6)` }} />
              : <div className="relative w-[min(60vw,420px)] aspect-square rounded-3xl gradient-brand ring-chrome" />}
          </div>

          <div className="max-w-md w-full flex flex-col gap-6">
            <div>
              <div className="text-hairline mb-2">Track</div>
              <h1 className="font-display text-5xl md:text-6xl leading-tight">{current.title}</h1>
              <div className="mt-2 text-lg text-muted-foreground">{current.artist_name}</div>
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="range" min={0} max={duration || 0} step={0.1} value={position}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full h-1 accent-white"
                style={{ accentColor: `rgb(${r},${g},${b})` }}
              />
              <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                <span>{formatTime(position)}</span><span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <button onClick={prev} className="text-muted-foreground hover:text-foreground" aria-label="Zurück"><SkipBack className="h-6 w-6" /></button>
              <button
                onClick={toggle}
                className="h-16 w-16 grid place-items-center rounded-full ring-chrome accent-glow transition hover:scale-105"
                style={{ background: `linear-gradient(180deg, rgb(${r},${g},${b}), rgba(${r},${g},${b},0.7))`, color: "#0a0a0a" }}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
              </button>
              <button onClick={next} className="text-muted-foreground hover:text-foreground" aria-label="Weiter"><SkipForward className="h-6 w-6" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
