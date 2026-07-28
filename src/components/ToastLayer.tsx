import { useEffect, useState } from "react";
import { subscribe, type ToastItem } from "@/lib/toast";
import { Check, X, Info, TriangleAlert } from "lucide-react";

const ICONS = {
  success: <Check className="h-4 w-4" />,
  error: <TriangleAlert className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
  message: <Info className="h-4 w-4" />,
};

export function ToastLayer() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const unsub = subscribe((t) => {
      setItems((cur) => [...cur, t]);
      setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== t.id)), 4000);
    });
    return () => { unsub; };
  }, []);

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] flex flex-col-reverse items-center gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className="animate-liquid-in pointer-events-auto glass-strong ring-chrome rounded-full pl-3 pr-4 py-2 flex items-center gap-2.5 text-sm max-w-md"
          style={{ boxShadow: "0 20px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)" }}
        >
          <span
            className={`h-6 w-6 rounded-full grid place-items-center ${
              t.kind === "success" ? "bg-emerald-500/20 text-emerald-300" :
              t.kind === "error" ? "bg-rose-500/20 text-rose-300" :
              "bg-white/10 text-foreground"
            }`}
          >
            {ICONS[t.kind]}
          </span>
          <span className="pr-2">{t.text}</span>
          <button
            onClick={() => setItems((cur) => cur.filter((x) => x.id !== t.id))}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Schließen"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
