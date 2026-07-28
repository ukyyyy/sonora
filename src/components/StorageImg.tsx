import { useSignedUrl } from "@/lib/storage-url";
import type { ImgHTMLAttributes } from "react";

export function StorageImg({ src, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { src?: string | null }) {
  const signed = useSignedUrl(src ?? null);
  if (!signed) return null;
  return <img src={signed} {...rest} />;
}
