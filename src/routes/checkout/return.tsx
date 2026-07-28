import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Diamond, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({ meta: [{ title: "Danke — Sonora Premium" }] }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <AppShell>
      <div className="max-w-md mx-auto text-center py-12">
        <div className="mx-auto h-16 w-16 rounded-full grid place-items-center ring-chrome mb-4" style={{ background: "var(--grad-chrome)" }}>
          {session_id ? <CheckCircle2 className="h-8 w-8 text-black" /> : <Diamond className="h-8 w-8 text-black" />}
        </div>
        <h1 className="font-display text-3xl">{session_id ? "Willkommen bei Premium" : "Checkout beendet"}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {session_id ? "Danke für deine Unterstützung. Dein Premium-Status wird gleich aktiv." : "Falls die Zahlung noch offen ist, kannst du sie erneut starten."}
        </p>
        <div className="mt-6 flex gap-2 justify-center">
          <Link to="/" className="px-4 py-2 rounded-xl ring-chrome text-sm" style={{ background: "var(--grad-chrome)", color: "#0a0a0a" }}>Zur Startseite</Link>
          <Link to="/premium" className="px-4 py-2 rounded-xl ring-chrome text-sm hover:bg-white/5">Premium-Übersicht</Link>
        </div>
      </div>
    </AppShell>
  );
}
