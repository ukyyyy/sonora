import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function ShareButton({ url, title, className }: { url?: string; title?: string; className?: string }) {
  const [ok, setOk] = useState(false);

  const doShare = async () => {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
    const shareTitle = title ?? (typeof document !== "undefined" ? document.title : "Sonora");
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({ url: shareUrl, title: shareTitle });
        return;
      }
    } catch { /* user cancelled — fall through to copy */ }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setOk(true);
      toast.success("Link kopiert");
      setTimeout(() => setOk(false), 1500);
    } catch {
      toast.error("Konnte Link nicht kopieren");
    }
  };

  return (
    <button
      onClick={doShare}
      className={className ?? "h-9 w-9 grid place-items-center rounded-xl ring-chrome hover:bg-white/5"}
      aria-label="Teilen"
      title="Teilen"
    >
      {ok ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
    </button>
  );
}
