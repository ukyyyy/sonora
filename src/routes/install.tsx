import { createFileRoute, Link } from "@tanstack/react-router";
import { Apple, Play, Globe, Sparkles, Music2, Headphones, Download, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/install")({
  head: () => ({
    meta: [
      { title: "Sonora installieren — App, iOS, Android & Web" },
      { name: "description", content: "Hol dir Sonora auf iPhone, Android oder direkt im Browser. Musik streamen, Artists folgen und Playlists überall mitnehmen." },
      { property: "og:title", content: "Sonora installieren — App, iOS, Android & Web" },
      { property: "og:description", content: "Streaming ohne Kompromisse — Sonora auf allen Geräten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/install" }],
  }),
  component: InstallPage,
});

function InstallPage() {
  return (
    <article className="space-y-14 pb-6">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl glass-strong ring-chrome p-8 md:p-14">
        <div
          className="absolute -top-32 -right-24 h-80 w-80 rounded-full opacity-40 blur-3xl pointer-events-none"
          style={{ background: "var(--grad-chrome)" }}
        />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full opacity-25 blur-3xl pointer-events-none bg-primary" />
        <div className="relative max-w-2xl space-y-5">
          <div className="text-hairline">Introducing Sonora</div>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight">
            Musik, die sich anfühlt&nbsp;wie&nbsp;flüssiges&nbsp;Chrom.
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl">
            Sonora ist eine unabhängige Streaming-Plattform für verifizierte Artists.
            Kein Algorithmus-Rauschen, keine Ads – nur Musik, Community und ein
            Interface, das du gerne benutzt.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium ring-chrome"
              style={{ background: "var(--grad-chrome)", color: "#0a0a0a" }}
            >
              <Sparkles className="h-4 w-4" /> Jetzt im Web starten
            </Link>
            <a href="#download" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm glass ring-chrome hover:bg-white/5 transition">
              <Download className="h-4 w-4" /> App laden
            </a>
          </div>
        </div>
      </header>

      {/* Feature strip */}
      <section className="grid gap-4 md:grid-cols-3">
        <Feature icon={<Music2 className="h-5 w-5" />} title="Verifizierte Artists" text="Nur überprüfte Künstler:innen laden hoch – kein Spam, keine Fakes." />
        <Feature icon={<Headphones className="h-5 w-5" />} title="Persistenter Player" text="Weiterhören beim Seitenwechsel, Fullscreen-Modus und Queue-Management." />
        <Feature icon={<ShieldCheck className="h-5 w-5" />} title="DSGVO-konform" text="Deine Daten liegen in der EU. Export & Löschung mit einem Klick." />
      </section>

      {/* Install cards */}
      <section id="download" className="space-y-5">
        <div>
          <div className="text-hairline mb-1">Install Sonora</div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Überall verfügbar</h2>
          <p className="text-muted-foreground mt-1 text-sm">Wähl dein Gerät. Ein Account – alles synchron.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StoreCard
            icon={<Apple className="h-6 w-6" />}
            eyebrow="iPhone & iPad"
            title="App Store"
            subtitle="Bald verfügbar"
            href="#"
            disabled
          />
          <StoreCard
            icon={<Play className="h-6 w-6" />}
            eyebrow="Android"
            title="Google Play"
            subtitle="Bald verfügbar"
            href="#"
            disabled
          />
          <StoreCard
            icon={<Globe className="h-6 w-6" />}
            eyebrow="Alle Plattformen"
            title="Web App"
            subtitle="Sofort starten – kein Download"
            href="/"
            internal
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Tipp: Öffne Sonora im mobilen Browser und tippe auf „Zum Home-Bildschirm hinzufügen“
          – so bekommst du die Web-App als Icon ohne App Store.
        </p>
      </section>

      {/* Why Sonora */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass ring-chrome rounded-2xl p-6 space-y-3">
          <div className="text-hairline">Für Hörer:innen</div>
          <h3 className="text-xl font-semibold">Entdecke neue Klänge</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Trending-Charts, kuratierte Releases, folgen &amp; liken, unbegrenzt Playlists.
            Gelikte Songs landen automatisch in deiner Bibliothek.
          </p>
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-foreground hover:underline">Zum Feed →</Link>
        </div>
        <div className="glass ring-chrome rounded-2xl p-6 space-y-3">
          <div className="text-hairline">Für Artists</div>
          <h3 className="text-xl font-semibold">Direkt zum Publikum</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Verifizierung per Demo oder Portfolio, dann Singles, EPs oder Alben hochladen –
            mit Plays, Likes und Follower-Stats im Dashboard.
          </p>
          <Link to="/become-artist" className="inline-flex items-center gap-1 text-sm text-foreground hover:underline">Artist werden →</Link>
        </div>
      </section>

      <footer className="pt-6 border-t border-white/5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <Link to="/impressum" className="hover:text-foreground">Impressum</Link>
        <Link to="/datenschutz" className="hover:text-foreground">Datenschutz</Link>
        <span className="ml-auto">© Sonora</span>
      </footer>
    </article>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="glass ring-chrome rounded-2xl p-5 space-y-2">
      <div className="h-9 w-9 rounded-xl grid place-items-center bg-white/5 ring-chrome">{icon}</div>
      <div className="font-medium">{title}</div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function StoreCard({
  icon, eyebrow, title, subtitle, href, disabled, internal,
}: {
  icon: React.ReactNode; eyebrow: string; title: string; subtitle: string;
  href: string; disabled?: boolean; internal?: boolean;
}) {
  const inner = (
    <div className={`relative overflow-hidden rounded-2xl glass-strong ring-chrome p-5 h-full flex flex-col gap-3 transition ${disabled ? "opacity-60" : "hover:bg-white/[0.04]"}`}>
      <div className="flex items-center justify-between">
        <div className="h-11 w-11 rounded-xl grid place-items-center ring-chrome" style={{ background: "var(--grad-chrome)", color: "#0a0a0a" }}>
          {icon}
        </div>
        {disabled && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Coming soon</span>}
      </div>
      <div>
        <div className="text-hairline mb-0.5">{eyebrow}</div>
        <div className="text-lg font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
  if (disabled) return <div>{inner}</div>;
  if (internal) return <Link to={href}>{inner}</Link>;
  return <a href={href} target="_blank" rel="noreferrer">{inner}</a>;
}
