// Extract a dominant chroma color from an image URL. Falls back to chrome grey.
const cache = new Map<string, [number, number, number]>();

export async function dominantColor(url: string): Promise<[number, number, number]> {
  if (cache.has(url)) return cache.get(url)!;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve([168, 168, 176]);
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        // pick most saturated non-dark pixel
        let br = 0, bg = 0, bb = 0, bs = -1;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 200) continue;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const l = (max + min) / 2;
          if (l < 40 || l > 235) continue;
          const s = max === 0 ? 0 : (max - min) / max;
          const score = s * (1 - Math.abs(l - 140) / 200);
          if (score > bs) { bs = score; br = r; bg = g; bb = b; }
        }
        if (bs < 0) { br = 168; bg = 168; bb = 176; }
        const result: [number, number, number] = [br, bg, bb];
        cache.set(url, result);
        resolve(result);
      } catch {
        resolve([168, 168, 176]);
      }
    };
    img.onerror = () => resolve([168, 168, 176]);
    img.src = url;
  });
}
