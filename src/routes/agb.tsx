import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/agb")({
  head: () => ({
    meta: [
      { title: "AGB — Sonora" },
      { name: "description", content: "Allgemeine Geschäftsbedingungen für die Nutzung von Sonora." },
      { property: "og:title", content: "AGB — Sonora" },
      { property: "og:description", content: "Nutzungsbedingungen für Sonora." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/agb" }],
  }),
  component: AGB,
});

function AGB() {
  return (
    <article className="max-w-2xl space-y-6 text-sm leading-relaxed">
      <header>
        <div className="text-hairline mb-1">Rechtliches</div>
        <h1 className="text-3xl font-semibold tracking-tight">Allgemeine Geschäftsbedingungen</h1>
        <p className="text-muted-foreground mt-1">Stand: {new Date().toLocaleDateString("de-DE")}</p>
      </header>

      <Section title="1. Geltungsbereich">
        Diese AGB regeln das Nutzungsverhältnis zwischen dem Betreiber von Sonora (nachfolgend „Betreiber",
        Anschrift siehe <a href="/impressum" className="underline">Impressum</a>) und den registrierten
        Nutzer:innen der Plattform. Mit der Registrierung akzeptierst du diese Bedingungen.
      </Section>

      <Section title="2. Leistungen">
        Sonora ist eine Musik-Streaming-Plattform, auf der verifizierte Artists eigene Musik veröffentlichen
        und Nutzer:innen diese kostenlos streamen, liken, in Playlists sammeln und Artists folgen können.
        Zusätzlich wird ein optionales, kostenpflichtiges Abo („Sonora Premium") angeboten.
        Das Grundangebot ist kostenlos und werbefrei.
      </Section>

      <Section title="3. Registrierung & Account">
        Zur Nutzung ist eine kostenlose Registrierung erforderlich. Du versicherst, dass deine Angaben
        wahrheitsgemäß sind, du das 16. Lebensjahr vollendet hast und deine Zugangsdaten geheim hältst.
        Der Betreiber darf Accounts bei Verstößen sperren oder löschen.
      </Section>

      <Section title="4. Artist-Verifizierung & Uploads">
        Nur verifizierte Artists dürfen Musik hochladen. Mit dem Upload versicherst du, dass du alle
        erforderlichen Rechte (Urheberrecht, Leistungsschutzrechte, Rechte Dritter) an den hochgeladenen
        Inhalten besitzt oder wirksam eingeräumt bekommen hast. Du räumst dem Betreiber ein einfaches,
        räumlich unbeschränktes, zeitlich auf die Speicherung begrenztes Nutzungsrecht ein, das
        Wiedergeben, Streamen und Bereitstellen der Inhalte auf der Plattform zu ermöglichen.
        Illegale, jugendgefährdende, gewaltverherrlichende, diskriminierende oder KI-generierte
        Voice-Clone-Inhalte ohne Zustimmung sind untersagt.
      </Section>

      <Section title="5. Sonora Premium (kostenpflichtiges Abo)">
        Premium wird als monatliches oder jährliches Abonnement über unseren Zahlungsdienstleister Stripe
        abgeschlossen. Preise inkl. gesetzlicher USt. sind auf der <a href="/premium" className="underline">Premium-Seite</a>
        ausgewiesen. Das Abo verlängert sich automatisch am Ende der Laufzeit, ist aber jederzeit zum
        Laufzeitende kündbar (Zugang bis dahin bleibt bestehen). Kündigung über „Abo verwalten" in der
        Premium-Sektion oder in den <a href="/settings" className="underline">Einstellungen</a>. Für Verbraucher:innen gilt zusätzlich das
        gesetzliche Widerrufsrecht — siehe <a href="/widerruf" className="underline">Widerrufsbelehrung</a>.
      </Section>

      <Section title="6. Verhalten & Meldungen">
        Belästigung, Spam, Manipulation von Plays/Likes/Followern sowie das Umgehen technischer
        Schutzmaßnahmen sind untersagt. Rechtsverletzungen bitte über das
        <a href="/report" className="underline"> Meldeformular</a> anzeigen; wir prüfen zeitnah nach dem
        Notice-and-Takedown-Prinzip (§ 10 TMG / Art. 14 DSA).
      </Section>

      <Section title="7. Haftung">
        Für Inhalte, die Nutzer:innen einstellen, haftet der jeweilige Ersteller. Der Betreiber haftet nur
        für Vorsatz und grobe Fahrlässigkeit sowie für Verletzungen wesentlicher Vertragspflichten
        (Kardinalpflichten) im Rahmen des vorhersehbaren, typischen Schadens. Haftung bei Verletzung
        von Leben, Körper, Gesundheit bleibt unberührt.
      </Section>

      <Section title="8. Kündigung des Accounts">
        Du kannst deinen Account jederzeit in den <a href="/settings" className="underline">Einstellungen</a> löschen.
        Ein laufendes Premium-Abo musst du separat über das Kundenportal beenden.
      </Section>

      <Section title="9. Änderungen der AGB">
        Änderungen werden per E-Mail oder im Dashboard mit mindestens 30 Tagen Vorlauf angekündigt.
        Widersprichst du nicht bis zum Wirksamwerden, gelten sie als angenommen.
      </Section>

      <Section title="10. Anwendbares Recht & Streitbeilegung">
        Es gilt deutsches Recht. Die EU-Plattform zur Online-Streitbeilegung findest du unter
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer" className="underline"> ec.europa.eu/consumers/odr</a>.
        Zur Teilnahme an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle sind wir nicht
        verpflichtet und nicht bereit.
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground">{children}</p>
    </section>
  );
}
