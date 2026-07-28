import { useEffect, useState } from "react";
import { dominantColor } from "@/lib/color-from-image";

export function useAccentColor(url: string | null, enabled: boolean) {
  const [rgb, setRgb] = useState<[number, number, number]>([168, 168, 176]);
  useEffect(() => {
    if (!enabled || !url) return;
    let alive = true;
    dominantColor(url).then((c) => { if (alive) setRgb(c); });
    return () => { alive = false; };
  }, [url, enabled]);
  useEffect(() => {
    if (!enabled) return;
    document.documentElement.style.setProperty("--accent-r", String(rgb[0]));
    document.documentElement.style.setProperty("--accent-g", String(rgb[1]));
    document.documentElement.style.setProperty("--accent-b", String(rgb[2]));
    return () => {
      document.documentElement.style.setProperty("--accent-r", "168");
      document.documentElement.style.setProperty("--accent-g", "168");
      document.documentElement.style.setProperty("--accent-b", "176");
    };
  }, [rgb, enabled]);
  return { rgb };
}
