import { useEffect } from "react";
import { usePlayer } from "@/lib/player-context";

/** Global media keyboard shortcuts. Ignored while typing in inputs. */
export function KeyboardShortcuts() {
  const { toggle, next, prev, seek, position, duration, volume, setVolume, current } = usePlayer();

  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(e.target)) return;
      if (!current && e.key !== "/") return;

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          toggle();
          break;
        case "ArrowRight":
          e.preventDefault();
          seek(Math.min((duration || position) - 0.1, position + 5));
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(Math.max(0, position - 5));
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(Math.min(1, +(volume + 0.05).toFixed(2)));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(Math.max(0, +(volume - 0.05).toFixed(2)));
          break;
        case "n":
        case "N":
          e.preventDefault();
          next();
          break;
        case "p":
        case "P":
          e.preventDefault();
          prev();
          break;
        case "m":
        case "M":
          e.preventDefault();
          setVolume(volume > 0 ? 0 : 0.8);
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, next, prev, seek, position, duration, volume, setVolume, current]);

  return null;
}
