import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { PlayerProvider } from "@/lib/player-context";
import { UIProvider } from "@/lib/ui";
import { AppShell } from "@/components/AppShell";
import { ToastLayer } from "@/components/ToastLayer";
import { ModalLayer } from "@/components/ModalLayer";
import { CommandPalette } from "@/components/CommandPalette";
import { QueuePanel } from "@/components/QueuePanel";
import { NowPlaying } from "@/components/NowPlaying";
import { CookieBanner } from "@/components/CookieBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { NotFound } from "@/components/NotFound";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0a0a0a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Sonora" },
      { title: "Sonora — Musik von unabhängigen Artists" },
      { name: "description", content: "Streame Musik von verifizierten Independent-Artists. Höre, folge, like und erstelle Playlists." },
      { property: "og:title", content: "Sonora — Musik-Streaming für Independent-Artists" },
      { property: "og:description", content: "Streame Musik von verifizierten Independent-Artists." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif&family=Space+Grotesk:wght@500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => <NotFound />,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <UIProvider>
        <AuthProvider>
          <PlayerProvider>
            <AppShell>
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </AppShell>
            <QueuePanel />
            <NowPlaying />
            <CommandPalette />
            <ModalLayer />
            <ToastLayer />
            <CookieBanner />
            <KeyboardShortcuts />
          </PlayerProvider>
        </AuthProvider>
      </UIProvider>
    </QueryClientProvider>
  );
}
