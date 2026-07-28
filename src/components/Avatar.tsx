import { User } from "lucide-react";
import { useSignedUrl } from "@/lib/storage-url";

export function Avatar({ url, name, size = 40, className = "" }: { url?: string | null; name?: string | null; size?: number; className?: string }) {
  const signed = useSignedUrl(url ?? null);
  const initials = (name ?? "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  return signed ? (
    <img src={signed} alt={name ?? ""} width={size} height={size} className={`rounded-full object-cover ${className}`} style={{ width: size, height: size }} />
  ) : (
    <div
      className={`rounded-full grid place-items-center bg-muted text-muted-foreground font-medium ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size / 3) }}
      aria-label={name ?? "Avatar"}
    >
      {initials || <User className="h-1/2 w-1/2" />}
    </div>
  );
}
