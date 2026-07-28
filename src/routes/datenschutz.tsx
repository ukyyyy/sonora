import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutz — Sonora" },
      { name: "description", content: "Datenschutzerklärung gemäß DSGVO für Sonora." },
      { property: "og:title", content: "Datenschutz — Sonora" },
      { property: "og:description", content: "Datenschutzerklärung gemäß DSGVO für Sonora." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/datenschutz" }],
  }),
  component: Datenschutz,
});

function Datenschutz() {
  return (
    <article className="max-w-2xl space-y-6 text-sm leading-relaxed">
      <header>
        <div className="text-hairline mb-1">Rechtliches</div>
        <h1 className="text-3xl font-semibold tracking-tight">Datenschutzerklärung</h1>
        <p className="text-muted-foreground mt-1">Diese Seite wird vom Betreiber von Sonora gepflegt und beantwortet häufige Fragen zum Umgang mit personenbezogenen Daten.</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">1. Verantwortlicher</h2>
        <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist der im Impressum genannte Betreiber.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. Erhobene Daten</h2>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li><strong className="text-foreground">Kontodaten:</strong> E-Mail-Adresse, Anzeigename, ggf. Profilbild, Biografie (bei Registrierung).</li>
          <li><strong className="text-foreground">Artist-Daten:</strong> Künstlername, Banner, hochgeladene Musik und Cover.</li>
          <li><strong className="text-foreground">Nutzungsdaten:</strong> Wiedergaben (Plays), Likes, Follows, Playlists — zur Bereitstellung des Dienstes.</li>
          <li><strong className="text-foreground">Verifizierung:</strong> Demo-Audio oder Portfolio-Links, die für die Prüfung eingereicht wurden.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">3. Rechtsgrundlagen</h2>
        <p className="text-muted-foreground">
          Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung),
          lit. a DSGVO (Einwilligung, z. B. bei Google-Login) und lit. f DSGVO (berechtigtes Interesse
          am Betrieb der Plattform).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">4. Auth & Google-Login</h2>
        <p className="text-muted-foreground">
          Bei Anmeldung via Google werden Name, E-Mail und Profil-ID übermittelt.
          Anbieter: Google Ireland Ltd., Gordon House, Barrow Street, Dublin 4, Irland.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. Auftragsverarbeiter / Subprozessoren</h2>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li><strong className="text-foreground">Supabase:</strong> Datenbank, Auth, Storage — Server in der EU (Frankfurt). AV-Vertrag vorhanden.</li>
          <li><strong className="text-foreground">Cloudflare Inc.:</strong> CDN, Edge-Hosting, DDoS-Schutz — Standardvertragsklauseln (SCC).</li>
          <li><strong className="text-foreground">Stripe Payments Europe Ltd. (Irland):</strong> Zahlungsabwicklung Premium-Abo, Rechnungsstellung. Datenübermittlung nur bei Kauf.</li>
          <li><strong className="text-foreground">Google Ireland Ltd.:</strong> Optionaler OAuth-Login (nur bei aktiver Nutzung).</li>
        </ul>
        <p className="text-xs text-muted-foreground">Aktualisierte Liste jederzeit auf Anfrage per E-Mail.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">6. Cookies & lokale Speicherung</h2>
        <p className="text-muted-foreground">
          Sonora verwendet ausschließlich technisch notwendige Speicherung (LocalStorage für die
          Anmelde-Session). Es findet kein Tracking und keine Werbung statt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">7. Speicherdauer</h2>
        <p className="text-muted-foreground">
          Daten werden gespeichert, solange dein Konto besteht. Nach Löschung des Kontos werden alle
          zugeordneten Inhalte (Profil, Musik, Playlists, Likes, Follows, Verifizierungen) unverzüglich
          entfernt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">8. Deine Rechte nach DSGVO</h2>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>Art. 15 — Auskunft: Datenexport verfügbar unter <a className="underline" href="/settings">Einstellungen</a>.</li>
          <li>Art. 16 — Berichtigung: Profil in den Einstellungen bearbeiten.</li>
          <li>Art. 17 — Löschung: Konto-Löschung direkt in den Einstellungen möglich.</li>
          <li>Art. 20 — Datenübertragbarkeit: JSON-Export in den Einstellungen.</li>
          <li>Art. 77 — Beschwerderecht bei der zuständigen Aufsichtsbehörde.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">9. Kontakt & DSA-Kontaktstelle</h2>
        <p className="text-muted-foreground">
          Datenschutz: <a className="underline" href="mailto:datenschutz@sonora.app">datenschutz@sonora.app</a><br />
          DSA-Kontaktstelle für Behörden: <a className="underline" href="/dsa">/dsa</a><br />
          Meldeformular für rechtswidrige Inhalte: <a className="underline" href="/report">/report</a>
        </p>
      </section>
    </article>
  );
}
