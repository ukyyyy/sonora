import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum — Sonora" },
      { name: "description", content: "Impressum und Anbieterkennzeichnung nach § 5 TMG." },
      { property: "og:title", content: "Impressum — Sonora" },
      { property: "og:description", content: "Impressum und Anbieterkennzeichnung nach § 5 TMG." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/impressum" }],
  }),
  component: Impressum,
});

function Impressum() {
  return (
    <article className="max-w-2xl space-y-6 text-sm leading-relaxed">
      <header>
        <div className="text-hairline mb-1">Rechtliches</div>
        <h1 className="text-3xl font-semibold tracking-tight">Impressum</h1>
        <p className="text-muted-foreground mt-1">Angaben gemäß § 5 TMG</p>
      </header>

      <section className="glass ring-chrome rounded-2xl p-5 space-y-1">
        <p className="font-medium">[Vor- und Nachname / Firma des Betreibers]</p>
        <p>[Straße und Hausnummer]</p>
        <p>[PLZ und Ort]</p>
        <p>[Land]</p>
      </section>

      <section className="space-y-1">
        <h2 className="text-lg font-semibold">Kontakt</h2>
        <p>Telefon: [Telefonnummer]</p>
        <p>E-Mail: [E-Mail-Adresse]</p>
      </section>

      <section className="space-y-1">
        <h2 className="text-lg font-semibold">Umsatzsteuer-ID</h2>
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: [USt-IdNr., falls vorhanden]</p>
      </section>

      <section className="space-y-1">
        <h2 className="text-lg font-semibold">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>[Name], [Anschrift wie oben]</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Haftung für Inhalte</h2>
        <p className="text-muted-foreground">
          Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
          verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
          Informationen zu überwachen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
          Informationen nach den allgemeinen Gesetzen bleiben unberührt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Haftung für Links</h2>
        <p className="text-muted-foreground">
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss
          haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Urheberrecht</h2>
        <p className="text-muted-foreground">
          Auf Sonora hochgeladene Musik unterliegt dem Urheberrecht der jeweiligen Artists. Nutzer:innen
          verpflichten sich, keine Inhalte hochzuladen, an denen sie keine Rechte besitzen.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        Hinweis: Die Platzhalter in eckigen Klammern müssen vor Veröffentlichung durch die tatsächlichen
        Angaben des Betreibers ersetzt werden.
      </p>
    </article>
  );
}
