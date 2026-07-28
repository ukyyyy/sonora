# Sonora

A music streaming platform for independent artists, built with TanStack Start (React + TypeScript), Tailwind CSS, Supabase (auth + database), and Stripe (payments).

## Running the app

The app runs with a single workflow: **Start application** (`npm run dev`), served on port 5000.

```
npm run dev
```

## Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (Vite + Nitro + React 19) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| Auth & DB | Supabase (GoTrue auth, PostgreSQL via PostgREST) |
| Payments | Stripe |
| Router | TanStack Router (file-based routing in `src/routes/`) |
| Data fetching | TanStack Query |

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | Replit env | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Replit env | Supabase anon/publishable key |
| `SUPABASE_PROJECT_ID` | Replit env | Supabase project ID |
| `SUPABASE_SERVICE_ROLE_KEY` | Replit secret | Admin key — bypasses RLS (server-only) |
| `VITE_SUPABASE_*` | Replit env | Client-side copies of the above |
| `VITE_PAYMENTS_CLIENT_TOKEN` | Replit env | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Replit secret | Stripe secret key for webhook/checkout |
| `SESSION_SECRET` | Replit secret | Session signing secret |

## Project structure

```
src/
  routes/         # File-based pages (TanStack Router)
    api/          # Server-side API routes (webhooks, etc.)
  components/     # Shared UI components
  integrations/
    supabase/     # Supabase client (client.ts) and admin client (client.server.ts)
  lib/            # Utilities and server functions
  styles.css      # Global Tailwind styles
supabase/
  migrations/     # SQL migration files
docker/           # Self-hosted stack (Postgres + GoTrue + PostgREST + Storage + nginx)
```

## Self-hosting (own VPS database)

The `docker/` directory contains a complete self-hosted Supabase stack (Postgres + GoTrue + PostgREST + Storage + nginx). To switch from cloud Supabase to your own server:

```bash
# On your VPS — one command, fully automated:
./docker/start.sh
```

The script auto-generates all secrets, detects your public IP, and prints the exact env vars to paste into Replit. See `docker/README.md` for full details including HTTPS/domain setup.

## User preferences

- Keep existing project structure and stack
- Prefer minimal changes when adding features
