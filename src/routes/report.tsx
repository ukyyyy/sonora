import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "@/lib/toast";
import { Flag, ShieldAlert, Copy } from "lucide-react";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Inhalt melden — Sonora" },
      { name: "description", content: "Melde Urheberrechtsverletzungen, illegale oder anstößige Inhalte auf Sonora." },
      { property: "og:title", content: "Inhalt melden — Sonora" },
      { property: "og:description", content: "Notice-and-Takedown nach DSA / § 10 TMG." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/report" }],
  }),
  component: Report,
});

function Report() {
  const [kind, setKind] = useState<"copyright" | "illegal" | "harassment" | "other">("copyright");
  const [url, setUrl] = useState("");
  const [reason, setReason] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [ownRights, setOwnRights] = useState(false);
  const [truthful, setTruthful] = useState(false);

  const template = () => {
    const body = [
      `Meldung: ${labelFor(kind)}`,
      `Betroffene URL / Track: ${url || "-"}`,
      "",
      "Begründung:",
      reason || "-",
      "",
      `Meldende Person: ${name || "-"}`,
      `Rückkanal: ${contact || "-"}`,
      "",
      kind === "copyright"
        ? "Ich versichere in gutem Glauben, dass die Nutzung des oben genannten Inhalts nicht durch den Rechteinhaber, dessen Vertreter oder das Gesetz autorisiert ist, und dass die Angaben in dieser Meldung zutreffend sind."
        : "Ich versichere, dass meine Angaben zutreffend und vollständig sind.",
    ].join("\n");
    return body;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !reason.trim()) return toast.error("URL und Begründung sind Pflicht.");
    if (!name.trim() || !contact.trim()) return toast.error("Bitte Namen und Kontakt angeben.");
    if (!truthful) return toast.error("Bitte Richtigkeit bestätigen.");
    if (kind === "copyright" && !ownRights) return toast.error("Bitte Rechte-Inhaberschaft bestätigen.");

    try {
      const body = template();
      const mailto = `mailto:report@sonora.example?subject=${encodeURIComponent("Sonora Report: " + labelFor(kind))}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      toast.success("E-Mail-Programm geöffnet.");
    } catch {
      toast.error("Konnte E-Mail-Programm nicht öffnen. Bitte kopieren.");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(template());
      toast.success("Vorlage kopiert.");
    } catch {
      toast.error("Kopieren fehlgeschlagen.");
    }
  };

  return (
    <article className="max-w-2xl space-y-6">
      <header>
        <div className="text-hairline mb-1 inline-flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5" /> Trust & Safety</div>
        <h1 className="text-3xl font-semibold tracking-tight">Inhalt melden</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Wir prüfen jede Meldung nach dem Notice-and-Takedown-Prinzip (§ 10 TMG, Art. 14/16 DSA).
          Missbräuchliche Meldungen können zu Account-Sperren führen.
        </p>
      </header>

      <form onSubmit={submit} className="glass ring-chrome rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Art der Meldung</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["copyright", "illegal", "harassment", "other"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`p-2.5 rounded-xl text-sm text-left transition ${kind === k ? "ring-chrome bg-white/[0.06]" : "hover:bg-white/[0.03] ring-1 ring-white/5"}`}
              >
                <Flag className="inline h-3.5 w-3.5 mr-1.5 opacity-70" />
                {labelFor(k)}
              </button>
            ))}
          </div>
        </div>

        <Field label="URL / Link zum Inhalt *">
          <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://sonora.app/album/…"
            className="w-full px-3 py-2 rounded-xl bg-white/[0.03] ring-1 ring-white/10 outline-none focus:ring-white/25" />
        </Field>

        <Field label="Begründung *">
          <textarea required rows={5} maxLength={4000} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Was genau verletzt welche Rechte? Bei Copyright: welches Werk, wer ist Rechteinhaber?"
            className="w-full px-3 py-2 rounded-xl bg-white/[0.03] ring-1 ring-white/10 outline-none focus:ring-white/25" />
        </Field>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Dein Name *">
            <input required maxLength={200} value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.03] ring-1 ring-white/10" />
          </Field>
          <Field label="E-Mail / Rückkanal *">
            <input required type="email" maxLength={200} value={contact} onChange={(e) => setContact(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.03] ring-1 ring-white/10" />
          </Field>
        </div>

        {kind === "copyright" && (
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={ownRights} onChange={(e) => setOwnRights(e.target.checked)} className="mt-0.5" />
            Ich bin Rechteinhaber:in oder autorisierte:r Vertreter:in und versichere dies in gutem Glauben.
          </label>
        )}
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={truthful} onChange={(e) => setTruthful(e.target.checked)} className="mt-0.5" />
          Ich versichere, dass meine Angaben wahrheitsgemäß und vollständig sind.
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium ring-chrome" style={{ background: "var(--grad-chrome)", color: "#0a0a0a" }}>
            Meldung per E-Mail senden
          </button>
          <button type="button" onClick={copy} className="px-4 py-2 rounded-xl text-sm ring-chrome hover:bg-white/5 inline-flex items-center gap-2">
            <Copy className="h-3.5 w-3.5" /> Als Text kopieren
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Antwort per E-Mail innerhalb von 72 Stunden. Bei akuter Gefahr wende dich an die zuständigen Behörden.
        </p>
      </form>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function labelFor(k: "copyright" | "illegal" | "harassment" | "other") {
  return k === "copyright" ? "Urheberrecht (DMCA)"
    : k === "illegal" ? "Illegaler Inhalt"
    : k === "harassment" ? "Belästigung / Hassrede"
    : "Sonstiges";
}
