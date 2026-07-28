import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, { url: string; expires: number }>();
const inflight = new Map<string, Promise<string | null>>();
const TTL_MS = 60 * 60 * 1000; // 1h

function parse(url: string): { bucket: string; path: string } | null {
  const m = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?.*)?$/);
  if (!m) return null;
  return { bucket: m[1], path: decodeURIComponent(m[2]) };
}

export async function toSignedUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const parsed = parse(url);
  if (!parsed) return url;
  const key = `${parsed.bucket}/${parsed.path}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.url;
  if (inflight.has(key)) return inflight.get(key)!;
  const p = (async () => {
    const { data, error } = await supabase.storage.from(parsed.bucket).createSignedUrl(parsed.path, 3600);
    if (error || !data) return null;
    cache.set(key, { url: data.signedUrl, expires: now + TTL_MS - 60_000 });
    return data.signedUrl;
  })();
  inflight.set(key, p);
  try { return await p; } finally { inflight.delete(key); }
}

export function useSignedUrl(url: string | null | undefined): string | null {
  const [signed, setSigned] = useState<string | null>(() => {
    if (!url) return null;
    const parsed = parse(url);
    if (!parsed) return url;
    const hit = cache.get(`${parsed.bucket}/${parsed.path}`);
    return hit && hit.expires > Date.now() ? hit.url : null;
  });
  useEffect(() => {
    let alive = true;
    if (!url) { setSigned(null); return; }
    toSignedUrl(url).then((u) => { if (alive) setSigned(u); });
    return () => { alive = false; };
  }, [url]);
  return signed;
}
