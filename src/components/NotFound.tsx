import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center px-4">
      <div className="text-center max-w-md space-y-4">
        <div className="mx-auto h-14 w-14 rounded-2xl grid place-items-center ring-chrome" style={{ background: "var(--grad-chrome)" }}>
          <Compass className="h-6 w-6 text-black" />
        </div>
        <div className="text-hairline">Fehler 404</div>
        <h1 className="font-display text-4xl tracking-tight">Diese Frequenz ist leer.</h1>
        <p className="text-sm text-muted-foreground">
          Die Seite existiert nicht, ist umgezogen oder der Link ist alt.
        </p>
        <div className="flex flex-wrap gap-2 justify-center pt-2">
          <Link to="/" className="px-4 py-2 rounded-xl text-sm font-medium ring-chrome" style={{ background: "var(--grad-chrome)", color: "#0a0a0a" }}>
            Zurück zur Startseite
          </Link>
          <Link to="/search" className="px-4 py-2 rounded-xl text-sm ring-chrome hover:bg-white/5">
            Suche öffnen
          </Link>
        </div>
      </div>
    </div>
  );
}
