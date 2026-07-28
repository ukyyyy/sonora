import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const body = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /settings\nDisallow: /reset-password\nDisallow: /forgot-password\nDisallow: /checkout\n\nSitemap: ${origin}/api/sitemap.xml\n`;
        return new Response(body, { headers: { "Content-Type": "text/plain", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
