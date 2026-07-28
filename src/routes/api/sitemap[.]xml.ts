import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const routes = ["/", "/install", "/premium", "/impressum", "/datenschutz", "/agb", "/widerruf", "/dsa", "/support", "/report"];
        const urls = routes.map((r) => `<url><loc>${origin}${r}</loc><changefreq>weekly</changefreq></url>`).join("");
        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
