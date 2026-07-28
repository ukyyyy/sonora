import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/widerruf")({
  head: () => ({
    meta: [
      { title: "Widerrufsbelehrung — Sonora" },
      { name: "description", content: "Widerrufsrecht für Verbraucher:innen bei Sonora Premium." },
      { property: "og:title", content: "Widerrufsbelehrung — Sonora" },
      { property: "og:description", content: "Dein 14-tägiges Widerrufsrecht für Sonora Premium." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/widerruf" }],
  }),
  component: Widerruf,
});

function Widerruf() {
  return (
    <article className="max-w-2xl space-y-6 text-sm leading-relaxed">
      <header>
        <div className="text-hairline mb-1">Rechtliches</div>
        <h1 className="text-3xl font-semibold tracking-tight">Widerrufsbelehrung</h1>
        <p className="text-muted-foreground mt-1">Gilt für Verbraucher:innen (§ 13 BGB) beim Abschluss eines Sonora-Premium-Abos.</p>
      </header>

      <section className="glass ring-chrome rounded-2xl p-5 space-y-3">
        <h2 className="text-lg font-semibold">Widerrufsrecht</h2>
        <p className="text-muted-foreground">
          Du hast das Recht, binnen <strong>vierzehn Tagen</strong> ohne Angabe von Gründen diesen Vertrag
          zu widerrufen. Die Frist beginnt mit dem Tag des Vertragsabschlusses.
        </p>
        <p className="text-muted-foreground">
          Um dein Widerrufsrecht auszuüben, musst du uns (Kontakt: siehe <a href="/impressum" className="underline">Impressum</a>) mittels einer eindeutigen
          Erklärung (z. B. per E-Mail) über deinen Entschluss informieren. Zur Wahrung der Widerrufsfrist
          reicht die rechtzeitige Absendung der Mitteilung.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Folgen des Widerrufs</h2>
        <p className="text-muted-foreground">
          Wenn du widerrufst, erstatten wir dir alle Zahlungen, die wir von dir erhalten haben,
          unverzüglich und spätestens binnen 14 Tagen ab Eingang deines Widerrufs. Für die Rückzahlung
          verwenden wir dasselbe Zahlungsmittel wie bei der ursprünglichen Transaktion.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Vorzeitiges Erlöschen des Widerrufsrechts</h2>
        <p className="text-muted-foreground">
          Da Sonora Premium ein digitaler Dienst ist und die Bereitstellung sofort nach Vertragsabschluss
          beginnt, erlischt dein Widerrufsrecht gemäß § 356 Abs. 5 BGB, wenn du beim Kaufvorgang
          ausdrücklich zustimmst, dass wir mit der Ausführung <em>vor Ablauf</em> der Widerrufsfrist
          beginnen und du gleichzeitig deine Kenntnis vom Erlöschen des Widerrufsrechts bestätigst.
          Diese Zustimmung erteilst du aktiv im Checkout — vorher startet dein Zugang nicht.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Muster-Widerrufsformular</h2>
        <pre className="whitespace-pre-wrap text-xs bg-white/[0.03] ring-chrome rounded-xl p-4 font-mono">
{`An: [Anschrift laut Impressum]
E-Mail: [Kontakt-Mail]

Hiermit widerrufe(n) ich/wir den von mir/uns
abgeschlossenen Vertrag über das folgende
Abonnement:

Sonora Premium — [Monatlich / Jährlich]
Bestellt am: __________
Name: __________
Anschrift: __________
Datum, Unterschrift: __________`}
        </pre>
      </section>
    </article>
  );
}
