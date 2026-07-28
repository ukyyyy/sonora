import { useState } from "react";
import { Flag } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { submitReport } from "@/lib/moderation.functions";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";

type Props = {
  targetType: "track" | "artist" | "playlist" | "user";
  targetId: string;
  className?: string;
  compact?: boolean;
};

const REASONS = [
  "Urheberrechtsverletzung",
  "Hassrede / Belästigung",
  "Gewalt / illegale Inhalte",
  "Spam / Betrug",
  "Sexueller / nicht kennzeichneter Inhalt",
  "Sonstiges",
];

export function ReportButton({ targetType, targetId, className, compact }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = useServerFn(submitReport);

  const send = async () => {
    if (!user) return toast.error("Bitte einloggen.");
    setBusy(true);
    try {
      await submit({ data: { target_type: targetType, target_id: targetId, reason, details: details || null } });
      toast.success("Meldung eingegangen. Danke.");
      setOpen(false); setDetails("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Fehler"); }
    finally { setBusy(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} title="Melden" aria-label="Inhalt melden"
        className={className ?? `text-muted-foreground hover:text-destructive ${compact ? "p-1" : "p-1.5"} rounded`}>
        <Flag className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={() => setOpen(false)}>
          <div className="glass-strong ring-chrome rounded-2xl p-5 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Inhalt melden</h3>
            <p className="text-xs text-muted-foreground">Meldungen werden vom Team geprüft. Missbrauch führt zu Konto-Sperrung.</p>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 rounded bg-background border border-border">
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={2000}
              placeholder="Details (optional)" className="w-full px-3 py-2 rounded bg-background border border-border" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded hover:bg-muted text-sm">Abbrechen</button>
              <button onClick={send} disabled={busy} className="px-3 py-1.5 rounded gradient-brand text-primary-foreground text-sm disabled:opacity-50">
                {busy ? "Sendet…" : "Melden"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
