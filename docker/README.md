# Sonora – Self-Hosted Database Stack

One command spins up the complete backend on your VPS: Postgres, GoTrue (auth),
PostgREST (REST API), Storage, and an nginx gateway. The Sonora app itself runs
on Replit and connects to this stack over the internet.

## Prerequisites

- A Linux VPS (Ubuntu 22.04+ recommended) with a public IP
- [Docker Engine](https://docs.docker.com/engine/install/) + Compose v2
- Python 3 (pre-installed on most distros)
- Port **8000** open in your firewall (Supabase gateway)

## Quick start (fresh VPS)

```bash
# 1. Install Docker (skip if already installed)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 2. Clone the repo
git clone <your-repo-url> sonora && cd sonora

# 3. Start everything — secrets are generated automatically
./docker/start.sh
```

That's it. On first run the script:
- Generates a strong `JWT_SECRET`, `POSTGRES_PASSWORD`, `ANON_KEY`, and `SERVICE_ROLE_KEY`
- Detects your VPS's public IP
- Writes `docker/.env` (never committed — it's in `.gitignore`)
- Builds and starts all services
- Prints a ready-to-paste block of Replit env vars

## After it starts

Copy the printed env vars into your Replit project:
- Non-secret values → Replit **Env Vars** (Settings → Environment)
- `SUPABASE_SERVICE_ROLE_KEY` → Replit **Secrets**

Then restart the Replit workflow — the app will connect to your self-hosted stack.

## Commands

```bash
./docker/start.sh           # start (or restart) all services
./docker/start.sh down      # stop
./docker/start.sh logs      # tail live logs
./docker/start.sh config    # re-print the Replit env-var block
./docker/start.sh reset     # wipe all data (IRREVERSIBLE)
```

## Services

| Service | Image | Purpose |
|---|---|---|
| `db` | `supabase/postgres:15` | PostgreSQL with Supabase extensions |
| `auth` | `supabase/gotrue` | Auth (JWT, email, OAuth) |
| `rest` | `postgrest/postgrest` | Auto-generated REST API over Postgres |
| `storage` | `supabase/storage-api` | File storage |
| `gateway` | `nginx` | Single entry point at `:8000` |

The `app` service in `docker-compose.yml` is optional — it builds and runs the
TanStack app container locally. You don't need it when the app runs on Replit.

## Ports

| Port | Service | Must be public? |
|---|---|---|
| 8000 | nginx gateway (Supabase) | **Yes** — browser + Replit app connect here |
| 54322 | Postgres | No — internal only |
| 3000 | App container (optional) | Only if running app locally |

## Database migrations

Migrations in `supabase/migrations/` are applied automatically on first start
via `docker/init-db/00-init.sh`. New migrations are **not** auto-applied to an
existing volume — run them manually with:

```bash
docker exec -i sonora-db-1 psql -U postgres -d postgres < supabase/migrations/<file>.sql
```

Or wipe and restart to apply everything fresh:

```bash
./docker/start.sh reset
./docker/start.sh
```

## Regenerating secrets

If you need to rotate secrets:

```bash
# Edit docker/.env — change JWT_SECRET, POSTGRES_PASSWORD, etc.
# Then restart; start.sh will re-sign ANON_KEY and SERVICE_ROLE_KEY automatically.
./docker/start.sh down
./docker/start.sh
```

Update the corresponding Replit env vars / secrets after rotating.

## Custom domain / HTTPS

Point a domain at your VPS and put a reverse proxy (Caddy, nginx, Traefik) in
front of port 8000. Then update `SUPABASE_PUBLIC_URL` in `docker/.env` and
`SUPABASE_URL` / `VITE_SUPABASE_URL` in Replit to the `https://` domain URL.

Caddy example (auto-HTTPS):
```
supabase.yourdomain.com {
    reverse_proxy localhost:8000
}
```

## What's intentionally excluded

- **Supabase Studio** — not needed for operation; add as a service if you want it
- **Realtime, Edge Functions, imgproxy** — not used by this codebase
- **Kong** — nginx is a simpler gateway for this stack
