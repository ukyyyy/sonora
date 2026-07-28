import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Cookie } from "lucide-react";

const KEY = "sonora.consent.v2";

type Consent = { necessary: true; statistics: boolean; marketing: boolean; ts: string };

export function getConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch { return null; }
}

export function CookieBanner() {
  const [show, setShow] = useState(false);
  const [details, setDetails] = useState(false);
  const [stats, setStats] = useState(false);
  const [mkt, setMkt] = useState(false);

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setShow(true); } catch { /* ignore */ }
  }, []);

  const save = (s: boolean, m: boolean) => {
    const consent: Consent = { necessary: true, statistics: s, marketing: m, ts: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(consent)); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent("sonora:consent", { detail: consent }));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 md:bottom-28 z-40 pointer-events-none">
      <div className="mx-auto max-w-3xl pointer-events-auto glass-strong ring-chrome rounded-2xl p-4 animate-liquid-in relative">
        <button onClick={() => save(false, false)} aria-label="Schließen" className="absolute top-2 right-2 h-7 w-7 grid place-items-center rounded-full hover:bg-white/10">
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl grid place-items-center ring-chrome shrink-0" style={{ background: "var(--grad-chrome)" }}>
            <Cookie className="h-4 w-4 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Cookie- & Speicher-Einstellungen</div>
            <p className="text-xs text-muted-foreground mt-1">
              Wir nutzen ausschließlich technisch <strong>notwendige</strong> Speicherung (Login-Session,
              Player-Zustand). Statistik & Marketing sind standardmäßig aus — du kannst sie freiwillig zulassen.
              Details in der <Link to="/datenschutz" className="underline text-foreground">Datenschutzerklärung</Link>.
            </p>

            {details && (
              <div className="mt-3 space-y-2">
                <Row label="Notwendig" desc="Login, Session, Player. Ohne diese funktioniert Sonora nicht.">
                  <span className="text-xs text-muted-foreground">immer aktiv</span>
                </Row>
                <Row label="Statistik" desc="Anonyme Aggregation von Plays für Artist-Stats.">
                  <Toggle checked={stats} onChange={setStats} />
                </Row>
                <Row label="Marketing" desc="Aktuell nicht im Einsatz. Reserviert für zukünftige Empfehlungen.">
                  <Toggle checked={mkt} onChange={setMkt} />
                </Row>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 justify-end">
          <button onClick={() => setDetails((v) => !v)} className="text-xs px-3 py-1.5 rounded-xl hover:bg-white/5">
            {details ? "Weniger" : "Einstellungen"}
          </button>
          <button onClick={() => save(false, false)} className="text-xs px-3 py-1.5 rounded-xl ring-chrome hover:bg-white/5">
            Nur notwendige
          </button>
          {details && (
            <button onClick={() => save(stats, mkt)} className="text-xs px-3 py-1.5 rounded-xl ring-chrome hover:bg-white/5">
              Auswahl speichern
            </button>
          )}
          <button onClick={() => save(true, true)} className="text-xs px-4 py-1.5 rounded-xl ring-chrome" style={{ background: "var(--grad-chrome)", color: "#0a0a0a" }}>
            Alle zulassen
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02]">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`h-5 w-9 rounded-full transition relative ${checked ? "bg-white/70" : "bg-white/15"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-black transition ${checked ? "left-4" : "left-0.5"}`} />
    </button>
  );
}
