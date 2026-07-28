import { createFileRoute, Link } from "@tanstack/react-router";
import { LifeBuoy, Mail, Shield, FileWarning, Flag } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [
    { title: "Support & Kontakt — Sonora" },
    { name: "description", content: "Hilfe, Support-Kontakt und Meldewege für Sonora." },
    { property: "og:title", content: "Support & Kontakt — Sonora" },
    { property: "og:description", content: "Hilfe, Support-Kontakt und Meldewege für Sonora." },
    { name: "robots", content: "noindex" },
  ] }),
  component: Support,
});

function Support() {
  return (
    <article className="max-w-2xl space-y-6">
      <header>
        <div className="text-hairline mb-1">Hilfe</div>
        <h1 className="text-3xl font-semibold tracking-tight">Support & Kontakt</h1>
        <p className="text-muted-foreground mt-1 text-sm">Wir antworten innerhalb von 5 Werktagen.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <a href="mailto:support@sonora.app" className="glass ring-chrome rounded-xl p-4 hover:bg-muted flex items-start gap-3">
          <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Allgemeiner Support</div>
            <div className="text-xs text-muted-foreground">support@sonora.app</div>
          </div>
        </a>
        <a href="mailto:datenschutz@sonora.app" className="glass ring-chrome rounded-xl p-4 hover:bg-muted flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Datenschutz</div>
            <div className="text-xs text-muted-foreground">datenschutz@sonora.app</div>
          </div>
        </a>
        <Link to="/report" className="glass ring-chrome rounded-xl p-4 hover:bg-muted flex items-start gap-3">
          <Flag className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Inhalt melden</div>
            <div className="text-xs text-muted-foreground">Missbrauch, Rechtsverletzung</div>
          </div>
        </Link>
        <a href="mailto:dmca@sonora.app" className="glass ring-chrome rounded-xl p-4 hover:bg-muted flex items-start gap-3">
          <FileWarning className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">DMCA / Urheberrecht</div>
            <div className="text-xs text-muted-foreground">dmca@sonora.app</div>
          </div>
        </a>
      </div>

      <section className="space-y-2 pt-4 border-t border-border">
        <h2 className="text-lg font-semibold">Häufige Fragen</h2>
        <details className="glass ring-chrome rounded-xl p-4">
          <summary className="cursor-pointer font-medium">Wie werde ich verifizierter Artist?</summary>
          <p className="text-sm text-muted-foreground mt-2">
            Reiche unter <Link to="/become-artist" className="underline">Artist werden</Link> einen Demo-Track oder
            Portfolio-Links ein. Das Team prüft innerhalb weniger Tage.
          </p>
        </details>
        <details className="glass ring-chrome rounded-xl p-4">
          <summary className="cursor-pointer font-medium">Wie kündige ich mein Premium-Abo?</summary>
          <p className="text-sm text-muted-foreground mt-2">
            Unter <Link to="/settings" className="underline">Einstellungen</Link> im Abo-Bereich. Es endet zum Ablauf
            des laufenden Zeitraums.
          </p>
        </details>
        <details className="glass ring-chrome rounded-xl p-4">
          <summary className="cursor-pointer font-medium">Wie lösche ich mein Konto?</summary>
          <p className="text-sm text-muted-foreground mt-2">
            Unter <Link to="/settings" className="underline">Einstellungen</Link> ganz unten. Alle Daten
            (Profil, Playlists, Uploads) werden unwiderruflich entfernt (Art. 17 DSGVO).
          </p>
        </details>
        <details className="glass ring-chrome rounded-xl p-4">
          <summary className="cursor-pointer font-medium">Status / Ausfälle</summary>
          <p className="text-sm text-muted-foreground mt-2">
            Aktueller Betriebsstatus wird bei Störungen hier kommuniziert. Für Live-Updates: status.sonora.app.
          </p>
        </details>
      </section>

      <section className="text-xs text-muted-foreground pt-4 border-t border-border">
        <LifeBuoy className="inline h-3 w-3 mr-1" />
        Für dringende Rechtsanfragen: Nutze das DMCA-Formular für dokumentierbare Rechtsverletzungen.
      </section>
    </article>
  );
}
