import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSignedAudioUrl } from "@/lib/release-actions.functions";
import { toSignedUrl } from "@/lib/storage-url";

export type PlayerTrack = {
  id: string;
  title: string;
  audio_path: string;
  duration_seconds: number;
  artist_id: string;
  artist_name?: string;
  cover_url?: string | null;
};

type Ctx = {
  current: PlayerTrack | null;
  queue: PlayerTrack[];
  index: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  fullscreen: boolean;
  queueOpen: boolean;
  play: (tracks: PlayerTrack[], startIndex?: number) => void;
  playAt: (i: number) => void;
  addToQueue: (t: PlayerTrack) => void;
  removeFromQueue: (i: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  setFullscreen: (v: boolean) => void;
  setQueueOpen: (v: boolean) => void;
};

const PlayerCtx = createContext<Ctx | null>(null);

const LS_VOLUME = "sonora.player.volume";
const LS_QUEUE = "sonora.player.queue.v1";

function readInitialVolume(): number {
  if (typeof window === "undefined") return 0.8;
  try {
    const v = parseFloat(localStorage.getItem(LS_VOLUME) ?? "");
    return isFinite(v) && v >= 0 && v <= 1 ? v : 0.8;
  } catch { return 0.8; }
}

function readInitialQueue(): { queue: PlayerTrack[]; index: number } {
  if (typeof window === "undefined") return { queue: [], index: 0 };
  try {
    const raw = localStorage.getItem(LS_QUEUE);
    if (!raw) return { queue: [], index: 0 };
    const parsed = JSON.parse(raw) as { queue: PlayerTrack[]; index: number };
    if (!Array.isArray(parsed.queue)) return { queue: [], index: 0 };
    return { queue: parsed.queue, index: Math.max(0, Math.min(parsed.index ?? 0, parsed.queue.length - 1)) };
  } catch { return { queue: [], index: 0 }; }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initial = readInitialQueue();
  const [queue, setQueue] = useState<PlayerTrack[]>(initial.queue);
  const [index, setIndex] = useState(initial.index);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(readInitialVolume);
  const [fullscreen, setFullscreen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const current = queue[index] ?? null;
  const queueRef = useRef<PlayerTrack[]>([]);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  // Spotify-style play counting: count once per track load after the user has
  // actually listened for min(30s, 50% of duration). Skips before threshold
  // don't count. Reset per track. RLS requires an authenticated user.
  const playCountedRef = useRef(false);
  const listenedMsRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const currentTrackIdRef = useRef<string | null>(null);

  const maybeCountPlay = useCallback(async (force = false) => {
    if (playCountedRef.current) return;
    const track = queueRef.current[currentTrackIdRef.current
      ? queueRef.current.findIndex((t) => t.id === currentTrackIdRef.current)
      : -1];
    if (!track) return;
    const a = audioRef.current;
    const dur = (a?.duration && isFinite(a.duration) ? a.duration : track.duration_seconds) || 0;
    const thresholdSec = Math.min(30, Math.max(5, dur * 0.5));
    const listenedSec = listenedMsRef.current / 1000;
    if (!force && listenedSec < thresholdSec) return;
    playCountedRef.current = true;
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return; // RLS: anonymous plays are not tracked
      await supabase.from("plays").insert({ track_id: track.id, user_id: sess.session.user.id });
    } catch (e) {
      console.error("play tracking failed", e);
      playCountedRef.current = false;
    }
  }, []);

  useEffect(() => {
    const a = new Audio();
    a.volume = volume;
    audioRef.current = a;
    const onTime = () => {
      setPosition(a.currentTime);
      if (!a.paused && !a.seeking && lastTickRef.current != null) {
        const now = performance.now();
        const delta = now - lastTickRef.current;
        if (delta > 0 && delta < 1500) listenedMsRef.current += delta;
        lastTickRef.current = now;
      }
      void maybeCountPlay();
    };
    const onDur = () => setDuration(a.duration || 0);
    const onEnd = () => {
      void maybeCountPlay(true);
      setIndex((i) => Math.min(i + 1, queueRef.current.length - 1));
    };
    const onPlay = () => { setIsPlaying(true); lastTickRef.current = performance.now(); };
    const onPause = () => { setIsPlaying(false); lastTickRef.current = null; };
    const onSeeking = () => { lastTickRef.current = null; };
    const onSeeked = () => { if (!a.paused) lastTickRef.current = performance.now(); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("durationchange", onDur);
    a.addEventListener("loadedmetadata", onDur);
    a.addEventListener("ended", onEnd);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("seeking", onSeeking);
    a.addEventListener("seeked", onSeeked);

    // Media Session action handlers for lock screen / Dynamic Island / Bluetooth remotes
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      const ms = navigator.mediaSession;
      try {
        ms.setActionHandler("play", () => { void a.play(); });
        ms.setActionHandler("pause", () => a.pause());
        ms.setActionHandler("previoustrack", () => setIndex((i) => Math.max(i - 1, 0)));
        ms.setActionHandler("nexttrack", () => setIndex((i) => Math.min(i + 1, queueRef.current.length - 1)));
        ms.setActionHandler("seekbackward", (d) => { a.currentTime = Math.max(0, a.currentTime - (d.seekOffset ?? 10)); });
        ms.setActionHandler("seekforward", (d) => { a.currentTime = Math.min(a.duration || 0, a.currentTime + (d.seekOffset ?? 10)); });
        ms.setActionHandler("seekto", (d) => { if (typeof d.seekTime === "number") a.currentTime = d.seekTime; });
        ms.setActionHandler("stop", () => { a.pause(); a.currentTime = 0; });
      } catch { /* older browsers: some actions unsupported */ }
    }

    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("durationchange", onDur);
      a.removeEventListener("loadedmetadata", onDur);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("seeking", onSeeking);
      a.removeEventListener("seeked", onSeeked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep playbackState + position in sync with the OS media UI (Dynamic Island, lock screen)
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = current ? (isPlaying ? "playing" : "paused") : "none";
  }, [isPlaying, current]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!current || !duration || !isFinite(duration)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: audioRef.current?.playbackRate ?? 1,
        position: Math.min(position, duration),
      });
    } catch { /* ignore */ }
  }, [position, duration, current?.id]);

  // Push metadata (title, artist, artwork) whenever the track changes.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!current) { navigator.mediaSession.metadata = null; return; }
    let cancelled = false;
    (async () => {
      const artUrl = current.cover_url ? await toSignedUrl(current.cover_url) : null;
      if (cancelled) return;
      const artwork = artUrl
        ? [96, 192, 256, 384, 512].map((s) => ({ src: artUrl, sizes: `${s}x${s}`, type: "image/jpeg" }))
        : [];
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: current.title,
          artist: current.artist_name ?? "",
          album: "Sonora",
          artwork,
        });
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [current?.id, current?.cover_url, current?.title, current?.artist_name]);

  useEffect(() => {
    if (!current || !audioRef.current) return;
    let cancelled = false;
    setPosition(0);
    setDuration(0);
    playCountedRef.current = false;
    listenedMsRef.current = 0;
    lastTickRef.current = null;
    currentTrackIdRef.current = current.id;
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        let url: string;
        if (sess.session) {
          const res = await getSignedAudioUrl({ data: { path: current.audio_path } });
          url = res.url;
        } else {
          const { data } = supabase.storage.from("audio").getPublicUrl(current.audio_path);
          url = data.publicUrl;
        }
        if (cancelled || !audioRef.current) return;
        audioRef.current.src = url;
        audioRef.current.play().catch(() => setIsPlaying(false));
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { cancelled = true; };
  }, [current?.id]);

  const play = useCallback((tracks: PlayerTrack[], startIndex = 0) => {
    setQueue(tracks);
    setIndex(startIndex);
  }, []);
  const playAt = useCallback((i: number) => setIndex(i), []);
  const addToQueue = useCallback((t: PlayerTrack) => setQueue((q) => [...q, t]), []);
  const removeFromQueue = useCallback((i: number) => {
    setQueue((q) => q.filter((_, idx) => idx !== i));
    setIndex((cur) => (i < cur ? cur - 1 : cur));
  }, []);
  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play(); else a.pause();
  }, []);
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, queueRef.current.length - 1)), []);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const seek = useCallback((t: number) => { if (audioRef.current) audioRef.current.currentTime = t; }, []);
  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
    try { localStorage.setItem(LS_VOLUME, String(v)); } catch { /* ignore */ }
  }, []);

  // Persist queue + index so playback survives page reloads.
  useEffect(() => {
    try {
      if (queue.length === 0) localStorage.removeItem(LS_QUEUE);
      else localStorage.setItem(LS_QUEUE, JSON.stringify({ queue, index }));
    } catch { /* ignore */ }
  }, [queue, index]);

  const value = useMemo(() => ({
    current, queue, index, isPlaying, position, duration, volume, fullscreen, queueOpen,
    play, playAt, addToQueue, removeFromQueue, toggle, next, prev, seek, setVolume, setFullscreen, setQueueOpen,
  }), [current, queue, index, isPlaying, position, duration, volume, fullscreen, queueOpen,
      play, playAt, addToQueue, removeFromQueue, toggle, next, prev, seek, setVolume]);

  return <PlayerCtx.Provider value={value}>{children}</PlayerCtx.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error("usePlayer must be inside PlayerProvider");
  return ctx;
}
