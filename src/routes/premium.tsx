import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/lib/subscription";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { createPortalSession } from "@/lib/payments.functions";
import { useServerFn } from "@tanstack/react-start";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { toast } from "@/lib/toast";
import { Diamond, Sparkles, Palette, Image as ImageIcon, Zap, Heart } from "lucide-react";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Sonora Premium — Support the sound" },
      { name: "description", content: "Optionales Supporter-Abo mit Premium-Badge, HD-Covers und frühem Feature-Zugriff. Free bleibt vollständig nutzbar." },
    ],
  }),
  component: PremiumPage,
});

const PERKS = [
  { icon: Diamond, title: "Premium-Badge", text: "Chrome-Diamant an deinem Profil." },
  { icon: Sparkles, title: "Animierte Cover", text: "Bewegte Cover im Now-Playing." },
  { icon: ImageIcon, title: "HD Playlist-Cover", text: "Eigene Covers in hoher Auflösung hochladen." },
  { icon: Zap, title: "Früher Zugriff", text: "Neue Features (AI-Mix, Crossfade, Gapless) zuerst." },
  { icon: Heart, title: "Supporter-Flag", text: "Artists sehen, dass du sie unterstützt." },
  { icon: Palette, title: "Extra Themes", text: "Zusätzliche Chrome-Akzente für den Player." },
];

function PremiumPage() {
  const { user } = useAuth();
  const { isPremium, subscription } = useSubscription();
  const [plan, setPlan] = useState<"premium_monthly" | "premium_yearly" | null>(null);
  const portal = useServerFn(createPortalSession);

  async function openPortal() {
    if (!isPaymentsConfigured()) return;
    const r = await portal({ data: { environment: getStripeEnvironment(), returnUrl: window.location.href } });
    if ("error" in r) { toast.error(r.error); return; }
    window.open(r.url, "_blank");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

        <PaymentTestModeBanner />

        <div className="rounded-3xl glass-strong ring-chrome p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.15), transparent 60%)" }} />
          <Diamond className="mx-auto h-10 w-10 mb-3" style={{ color: "var(--color-verified)" }} />
          <h1 className="font-display text-4xl md:text-5xl tracking-tight">Sonora Premium</h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
            Kein Feature-Locking. Free bleibt vollständig nutzbar. Premium ist ein Supporter-Abo mit ein paar Extras.
          </p>
        </div>

        {isPremium && subscription ? (
          <div className="rounded-2xl glass ring-chrome p-5 flex items-center gap-4">
            <Diamond className="h-6 w-6" style={{ color: "var(--color-verified)" }} />
            <div className="flex-1">
              <div className="font-medium">Du bist Premium</div>
              <div className="text-xs text-muted-foreground">
                Status: {subscription.status}
                {subscription.current_period_end && ` · verlängert am ${new Date(subscription.current_period_end).toLocaleDateString("de-DE")}`}
                {subscription.cancel_at_period_end && " · endet danach"}
              </div>
            </div>
            <button onClick={openPortal} className="text-sm px-4 py-2 rounded-xl ring-chrome hover:bg-white/5">Abo verwalten</button>
          </div>
        ) : plan ? (
          <div className="space-y-3">
            <button onClick={() => setPlan(null)} className="text-xs text-muted-foreground hover:text-foreground">← Zurück</button>
            {isPaymentsConfigured() ? (
              <StripeEmbeddedCheckout priceId={plan} />
            ) : (
              <div className="rounded-2xl glass ring-chrome p-6 text-sm text-muted-foreground text-center">
                Bezahlungen sind gerade nicht verfügbar.
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            <PlanCard
              title="Monatlich" price="3,99 €" sub="pro Monat · jederzeit kündbar"
              onSelect={() => user ? setPlan("premium_monthly") : (window.location.href = "/auth")}
            />
            <PlanCard
              title="Jährlich" price="34,99 €" sub="pro Jahr · spart ~ 27 %" highlight
              onSelect={() => user ? setPlan("premium_yearly") : (window.location.href = "/auth")}
            />
          </div>
        )}

        <div className="rounded-2xl glass ring-chrome p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Was drin ist</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {PERKS.map((p) => (
              <div key={p.title} className="flex gap-3 p-3 rounded-xl bg-white/[0.02]">
                <p.icon className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "var(--color-verified)" }} />
                <div>
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          Preise inkl. USt. Abo verlängert sich automatisch, jederzeit kündbar. Siehe <Link to="/datenschutz" className="underline">Datenschutz</Link> & <Link to="/impressum" className="underline">Impressum</Link>.
        </p>
    </div>
  );
}


function PlanCard({ title, price, sub, highlight, onSelect }: { title: string; price: string; sub: string; highlight?: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`text-left rounded-2xl p-5 ring-chrome transition hover:bg-white/[0.04] ${highlight ? "glass-strong" : "glass"}`}
    >
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">{title}</div>
        {highlight && <span className="text-[10px] px-1.5 py-0.5 rounded-full ring-chrome">Beliebt</span>}
      </div>
      <div className="font-display text-3xl mt-1">{price}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      <div className="mt-4 text-sm inline-flex items-center gap-2" style={{ color: "var(--color-verified)" }}>
        <Diamond className="h-3.5 w-3.5" /> Auswählen
      </div>
    </button>
  );
}
