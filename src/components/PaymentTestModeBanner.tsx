const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full text-center text-xs px-3 py-2 rounded-xl ring-chrome" style={{ background: "rgba(239,68,68,0.12)", color: "#fca5a5" }}>
        Produktions-Checkout noch nicht aktiviert.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full text-center text-xs px-3 py-2 rounded-xl ring-chrome" style={{ background: "rgba(251,146,60,0.12)", color: "#fdba74" }}>
        Testmodus — es wird kein echtes Geld abgebucht. Testkarte: 4242 4242 4242 4242
      </div>
    );
  }
  return null;
}
