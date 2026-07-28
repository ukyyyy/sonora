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

pick_free_port() {
  local port="${1:-3000}"
  while :; do
    if python - "$port" <<'PY' 2>/dev/null
import socket
import sys
s = socket.socket()
try:
    s.bind(("0.0.0.0", int(sys.argv[1])))
    s.close()
    raise SystemExit(0)
except OSError:
    raise SystemExit(1)
PY
    then
      echo "$port"
      return 0
    fi
    port=$((port + 1))
  done
}

APP_PORT="${APP_PORT:-$(grep '^APP_PORT' .env 2>/dev/null | cut -d= -f2 || true)}"
GATEWAY_PORT="${GATEWAY_PORT:-$(grep '^GATEWAY_PORT' .env 2>/dev/null | cut -d= -f2 || true)}"

if [ -z "$APP_PORT" ]; then
  APP_PORT="3000"
fi
if [ -z "$GATEWAY_PORT" ]; then
  GATEWAY_PORT="8000"
fi

APP_PORT="$(pick_free_port "$APP_PORT")"
GATEWAY_PORT="$(pick_free_port "$GATEWAY_PORT")"

export APP_PORT GATEWAY_PORT

CMD="${1:-up}"
COMPOSE=(docker compose --env-file .env -f docker-compose.yml)

case "$CMD" in
  up|start|"")
    "${COMPOSE[@]}" up -d --build
    echo ""
    echo "✅ Sonora is starting."
    echo "   App:      http://localhost:${APP_PORT}"
    echo "   Supabase: http://localhost:${GATEWAY_PORT}"
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
