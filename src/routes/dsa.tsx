import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dsa")({
  head: () => ({ meta: [
    { title: "DSA-Kontaktstelle — Sonora" },
    { name: "description", content: "Kontaktstelle nach Digital Services Act (DSA) und Transparenzbericht." },
    { name: "robots", content: "noindex" },
  ] }),
  component: DSA,
});

function DSA() {
  return (
    <article className="max-w-2xl space-y-6 text-sm leading-relaxed">
      <header>
        <div className="text-hairline mb-1">Rechtliches</div>
        <h1 className="text-3xl font-semibold tracking-tight">DSA-Kontaktstelle</h1>
        <p className="text-muted-foreground mt-1">Nach Art. 11 & 12 Digital Services Act (Verordnung (EU) 2022/2065).</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Zentrale Kontaktstelle für Behörden</h2>
        <p className="text-muted-foreground">
          E-Mail: <a className="underline" href="mailto:dsa@sonora.app">dsa@sonora.app</a><br />
          Sprache: Deutsch und Englisch<br />
          Postanschrift: siehe <Link to="/impressum" className="underline">Impressum</Link>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Kontaktstelle für Nutzer:innen</h2>
        <p className="text-muted-foreground">
          Meldungen zu rechtswidrigen Inhalten: <Link to="/report" className="underline">Melde-Formular</Link>{" "}
          oder <a className="underline" href="mailto:report@sonora.app">report@sonora.app</a>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Bearbeitungszeit</h2>
        <p className="text-muted-foreground">
          Meldungen werden in der Regel innerhalb von 72 Stunden gesichtet und binnen 14 Tagen entschieden.
          Bei offensichtlich rechtswidrigen Inhalten (z. B. Kinderschutz, akute Gefahr) reagieren wir umgehend.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Beschwerdemechanismus (Art. 20 DSA)</h2>
        <p className="text-muted-foreground">
          Gegen eine Entscheidung (z. B. Entfernung von Inhalten, Konto-Sperre) kann innerhalb von 6 Monaten
          Widerspruch per E-Mail an <a className="underline" href="mailto:dsa@sonora.app">dsa@sonora.app</a> eingelegt werden.
          Die Prüfung erfolgt durch eine unabhängige Person aus dem Team.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Repeat-Infringer-Policy</h2>
        <p className="text-muted-foreground">
          Wiederholte Urheberrechtsverletzungen führen zur dauerhaften Sperrung des Kontos. Nach der dritten
          bestätigten Meldung wird das Konto gesperrt und alle Uploads entfernt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Transparenzbericht</h2>
        <p className="text-muted-foreground">
          Sonora veröffentlicht jährlich einen Transparenzbericht nach Art. 15 DSA mit Angaben zu erhaltenen
          Meldungen, entfernten Inhalten und Bearbeitungszeiten. Der erste Bericht erscheint zum Jahresende.
        </p>
      </section>
    </article>
  );
}
