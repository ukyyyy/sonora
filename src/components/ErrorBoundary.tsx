import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[Sonora] Fehler:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[50vh] grid place-items-center p-6">
          <div className="glass-strong ring-chrome rounded-3xl p-8 max-w-md text-center space-y-4">
            <div className="text-hairline">Etwas ist schiefgelaufen</div>
            <h1 className="text-2xl font-semibold">Uups.</h1>
            <p className="text-sm text-muted-foreground">
              Die Seite konnte nicht geladen werden. Versuche es erneut.
            </p>
            <button
              onClick={() => { this.setState({ error: null }); location.reload(); }}
              className="px-5 py-2 rounded-xl ring-chrome text-sm"
              style={{ background: "var(--grad-chrome)", color: "#0a0a0a" }}
            >
              Neu laden
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
