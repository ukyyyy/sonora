#!/usr/bin/env bash
# One-command Sonora self-host bootstrap.
#   ./docker/start.sh          # start (build on first run)
#   ./docker/start.sh down     # stop
#   ./docker/start.sh logs     # tail logs
#   ./docker/start.sh reset    # wipe volumes (DESTROYS DATA)
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "==> Creating docker/.env from .env.example (edit it before running in production)"
  cp .env.example .env
fi

CMD="${1:-up}"
COMPOSE=(docker compose --env-file .env -f docker-compose.yml)

case "$CMD" in
  up|start|"")
    "${COMPOSE[@]}" up -d --build
    echo ""
    echo "✅ Sonora is starting."
    echo "   App:      http://localhost:$(grep ^APP_PORT .env | cut -d= -f2)"
    echo "   Supabase: http://localhost:$(grep ^GATEWAY_PORT .env | cut -d= -f2)"
    echo "   Logs:     ./docker/start.sh logs"
    ;;
  down|stop)
    "${COMPOSE[@]}" down ;;
  logs)
    "${COMPOSE[@]}" logs -f ;;
  reset)
    "${COMPOSE[@]}" down -v ;;
  *)
    echo "Unknown command: $CMD"; exit 1 ;;
esac
