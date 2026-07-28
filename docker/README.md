# Sonora – Self-Hosting mit Docker

Ein Kommando, dann läuft der komplette Stack lokal: Postgres, Auth (GoTrue),
PostgREST, Storage, ein nginx-Gateway und die TanStack-App.

## Voraussetzungen
- Docker Desktop / Docker Engine mit `docker compose` v2

## Start
```bash
./docker/start.sh
```
Beim ersten Lauf wird `docker/.env` aus `.env.example` erzeugt und das App-Image
gebaut. Danach:

- App:      http://localhost:3000
- Supabase: http://localhost:8000  (`/auth/v1`, `/rest/v1`, `/storage/v1`)
- Postgres: `localhost:54322`  (user/pw aus `.env`)

Weitere Kommandos:
```bash
./docker/start.sh logs    # Logs verfolgen
./docker/start.sh down    # stoppen
./docker/start.sh reset   # Volumes löschen (LÖSCHT ALLE DATEN)
```

## Datenbank
Beim ersten Start der `db` werden alle Dateien aus `supabase/migrations/*.sql`
in Datei-Reihenfolge angewandt (siehe `init-db/00-init.sh`). Neue Migrationen
werden erst nach `./docker/start.sh reset` oder manuellem `psql` erneut
angewandt.

## JWT-Keys in Produktion neu erzeugen
Die Demo-Werte in `.env.example` sind öffentlich bekannt. Für Produktion:

1. Neues `JWT_SECRET` (>= 32 Zeichen zufällig) in `docker/.env` setzen.
2. `ANON_KEY` und `SERVICE_ROLE_KEY` neu signieren, z. B.:
   ```bash
   node -e '
     const jwt=require("jsonwebtoken");
     const s=process.env.JWT_SECRET;
     console.log("ANON=",jwt.sign({iss:"supabase",role:"anon"},s,{expiresIn:"10y"}));
     console.log("SVC=", jwt.sign({iss:"supabase",role:"service_role"},s,{expiresIn:"10y"}));
   '
   ```
3. Beide Keys in `docker/.env` eintragen und neu starten.

## Google OAuth / Custom SMTP
Nicht Teil des Basis-Stacks. Bei Bedarf zusätzliche GoTrue-Env-Variablen im
`docker-compose.yml`-`auth`-Service ergänzen
(`GOTRUE_EXTERNAL_GOOGLE_*`, `GOTRUE_SMTP_*`).

## Was ist bewusst weggelassen
- Supabase Studio (nicht nötig zum Betrieb; kann als weiterer Service ergänzt werden)
- Realtime, Edge Functions, imgproxy (nicht vom Code genutzt)
- Kong (nginx reicht als schlanker Gateway)
