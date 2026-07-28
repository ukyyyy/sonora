import { BadgeCheck, Shield, Diamond } from "lucide-react";

export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span title="Verifizierter Artist" className={`inline-flex items-center ${className}`}>
      <BadgeCheck className="h-4 w-4" style={{ color: "var(--color-verified)" }} />
    </span>
  );
}

export function AdminBadge({ className = "" }: { className?: string }) {
  return (
    <span title="Admin" className={`inline-flex items-center ${className}`}>
      <Shield className="h-4 w-4" style={{ color: "var(--color-admin)" }} />
    </span>
  );
}

export function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <span title="Sonora Premium" className={`inline-flex items-center ${className}`}>
      <Diamond className="h-3.5 w-3.5" style={{ color: "var(--color-verified)" }} />
    </span>
  );
}
