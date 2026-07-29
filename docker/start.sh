#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Sonora self-host bootstrap — zero-config one-liner
#
#   ./docker/start.sh           start  (auto-generates secrets on first run)
#   ./docker/start.sh down      stop all services
#   ./docker/start.sh logs      tail live logs
#   ./docker/start.sh reset     wipe volumes — DESTROYS ALL DATA
#   ./docker/start.sh config    re-print the running URLs and env vars
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

# ── Dependency check ──────────────────────────────────────────────────────────
need() {
  if ! command -v "$1" &>/dev/null; then
    echo "❌  '$1' is required but not installed."
    [ "${2:-}" ] && echo "    $2"
    exit 1
  fi
}
need docker  "Install Docker: https://docs.docker.com/engine/install/"
need python3 "Install Python 3: sudo apt install python3  (or equivalent)"

if ! docker compose version &>/dev/null 2>&1; then
  echo "❌  'docker compose' (v2) is required."
  echo "    https://docs.docker.com/compose/install/"
  exit 1
fi

# ── Helpers ───────────────────────────────────────────────────────────────────
gen_secret() {
  # 48 random bytes → url-safe base64, trimmed to 64 printable chars
  openssl rand -base64 48 | tr -d '+/=\n' | head -c 64
}

sign_jwt() {
  # sign_jwt <secret> <role>
  python3 - "$1" "$2" <<'PY'
import sys, hmac, hashlib, base64, json, time

def b64url(data):
    if isinstance(data, str): data = data.encode()
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

secret, role = sys.argv[1], sys.argv[2]
exp = int(time.time()) + 10 * 365 * 24 * 3600          # 10 years

payload = {"iss": "supabase", "role": role, "exp": exp}
header  = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(',', ':')))
body    = b64url(json.dumps(payload, separators=(',', ':')))
msg     = f"{header}.{body}".encode()
sig     = hmac.new(secret.encode(), msg, hashlib.sha256).digest()
print(f"{header}.{body}.{b64url(sig)}")
PY
}

detect_public_ip() {
  local ip=""

  _fetch() {
    # Try curl then wget; both with short timeout
    if command -v curl &>/dev/null; then
      curl -fsSL --max-time 4 "$1" 2>/dev/null
    elif command -v wget &>/dev/null; then
      wget -qO- --timeout=4 "$1" 2>/dev/null
    fi
  }

  # 1. Cloud provider instance-metadata (no DNS needed on most VPS/cloud)
  ip=$(_fetch http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || true)  # AWS
  [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || \
  ip=$(_fetch http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address 2>/dev/null || true)  # Hetzner
  [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || \
  ip=$(_fetch http://169.254.169.254/metadata/v1/interface/0/ipv4/address 2>/dev/null || true)          # DigitalOcean

  # 2. Public IP-echo services
  [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || ip=$(_fetch https://api.ipify.org    || true)
  [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || ip=$(_fetch https://ifconfig.me      || true)
  [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || ip=$(_fetch https://ipecho.net/plain || true)
  [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || ip=$(_fetch https://checkip.amazonaws.com || true)

  # 3. Local network IP as last resort (private, but better than nothing)
  if ! [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    ip=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
    if [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "⚠️  Could not detect public IP — using private IP ${ip}." \
           "Update SUPABASE_PUBLIC_URL in docker/.env if this is wrong." >&2
    else
      ip="YOUR_VPS_IP"
      echo "⚠️  Could not detect public IP. Set SUPABASE_PUBLIC_URL manually in docker/.env." >&2
    fi
  fi

  ip="${ip//[$'\t\r\n ']}"
  echo "$ip"
}

detect_firewall() {
  # Returns: ufw | firewalld | iptables | none
  if command -v ufw &>/dev/null && ufw status 2>/dev/null | grep -q "Status: active"; then
    echo "ufw"
  elif command -v firewall-cmd &>/dev/null && firewall-cmd --state 2>/dev/null | grep -q "running"; then
    echo "firewalld"
  elif command -v iptables &>/dev/null && iptables -L INPUT -n 2>/dev/null | grep -qv "ACCEPT.*all"; then
    echo "iptables"
  else
    echo "none"
  fi
}

open_ports() {
  # shellcheck disable=SC1091
  source .env
  local gw="${GATEWAY_PORT:-8088}" app="${APP_PORT:-3000}"
  local fw
  fw=$(detect_firewall)

  echo "==> Opening ports ${gw} and ${app} (firewall: ${fw})"
  case "$fw" in
    ufw)
      sudo ufw allow "${gw}/tcp"
      sudo ufw allow "${app}/tcp"
      echo "✅  ufw rules added."
      ;;
    firewalld)
      sudo firewall-cmd --permanent --add-port="${gw}/tcp"
      sudo firewall-cmd --permanent --add-port="${app}/tcp"
      sudo firewall-cmd --reload
      echo "✅  firewalld rules added."
      ;;
    iptables)
      sudo iptables -I INPUT -p tcp --dport "${gw}" -j ACCEPT
      sudo iptables -I INPUT -p tcp --dport "${app}" -j ACCEPT
      # Persist if iptables-save is available
      if command -v iptables-save &>/dev/null && [ -f /etc/iptables/rules.v4 ]; then
        sudo iptables-save | sudo tee /etc/iptables/rules.v4 >/dev/null
        echo "✅  iptables rules added and saved."
      else
        echo "✅  iptables rules added (not persisted — reboot may reset them)."
      fi
      ;;
    none)
      echo "⚠️  No active OS firewall detected."
      echo "   If you're on a cloud VPS (Hetzner / DigitalOcean / AWS / GCP),"
      echo "   open ports ${gw} and ${app} in your provider's firewall / security-group panel."
      ;;
  esac
}

pick_free_port() {
  # Try up to 10 consecutive ports starting from $1; exit with error if all taken.
  local port="${1:-3000}"
  local tries=0
  while [ $tries -lt 10 ]; do
    if python3 -c "
import socket, sys
s = socket.socket()
try:
  s.bind(('0.0.0.0', int(sys.argv[1]))); s.close(); raise SystemExit(0)
except OSError: raise SystemExit(1)
" "$port" 2>/dev/null; then
      echo "$port"; return 0
    fi
    port=$((port + 1))
    tries=$((tries + 1))
  done
  echo "❌  Could not find a free port near ${1} (tried $tries ports)." >&2
  exit 1
}

print_config() {
  # shellcheck disable=SC1091
  source .env
  local pub_ip gw_port app_port supa_url app_url
  pub_ip=$(detect_public_ip)
  gw_port="${GATEWAY_PORT:-8088}"
  app_port="${APP_PORT:-3000}"
  supa_url="http://${pub_ip}:${gw_port}"
  app_url="http://${pub_ip}:${app_port}"

  # Patch SUPABASE_PUBLIC_URL in .env if it still contains localhost/127.0.0.1
  if grep -qE 'SUPABASE_PUBLIC_URL=https?://(localhost|127\.0\.0\.1)' .env 2>/dev/null; then
    sed -i "s|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=${supa_url}|" .env
    echo "==> Updated SUPABASE_PUBLIC_URL to ${supa_url} in docker/.env"
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Sonora is running"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  App             →  ${app_url}"
  echo "  Supabase API    →  ${supa_url}  (auth / rest / storage)"
  echo "  Postgres        →  ${pub_ip}:54322"
  echo ""
  echo "  ── App environment (.env or your hosting panel) ─────────────────"
  echo "  SUPABASE_URL=${supa_url}"
  echo "  SUPABASE_PROJECT_ID=sonora"
  echo "  SUPABASE_PUBLISHABLE_KEY=${ANON_KEY}"
  echo "  VITE_SUPABASE_URL=${supa_url}"
  echo "  VITE_SUPABASE_PROJECT_ID=sonora"
  echo "  VITE_SUPABASE_PUBLISHABLE_KEY=${ANON_KEY}"
  echo ""
  echo "  ── Keep these secret (never public) ─────────────────────────────"
  echo "  SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}"
  echo ""
  echo "  ── Firewall ─────────────────────────────────────────────────────"
  local fw
  fw=$(detect_firewall)
  case "$fw" in
    ufw)
      echo "  ufw detected — run to open ports:"
      echo "    sudo ufw allow ${gw_port}/tcp"
      echo "    sudo ufw allow ${app_port}/tcp"
      echo "  Or let the script do it: ./docker/start.sh open-ports"
      ;;
    firewalld)
      echo "  firewalld detected — run to open ports:"
      echo "    sudo firewall-cmd --permanent --add-port=${gw_port}/tcp"
      echo "    sudo firewall-cmd --permanent --add-port=${app_port}/tcp"
      echo "    sudo firewall-cmd --reload"
      echo "  Or let the script do it: ./docker/start.sh open-ports"
      ;;
    iptables)
      echo "  iptables detected — run to open ports:"
      echo "    sudo iptables -I INPUT -p tcp --dport ${gw_port} -j ACCEPT"
      echo "    sudo iptables -I INPUT -p tcp --dport ${app_port} -j ACCEPT"
      echo "  Or let the script do it: ./docker/start.sh open-ports"
      ;;
    none)
      echo "  No OS firewall detected."
      echo "  ⚠️  If on a cloud VPS (Hetzner/DigitalOcean/AWS) open ports"
      echo "     ${gw_port} and ${app_port} in your provider's firewall/security-group panel."
      ;;
    *)
      echo "  Run: ./docker/start.sh open-ports  (or open ${gw_port} and ${app_port} manually)"
      ;;
  esac
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
}

# ── Bootstrap .env on first run ───────────────────────────────────────────────
bootstrap_env() {
  echo "==> No docker/.env found — generating secrets automatically …"

  local pg_pass jwt_secret anon_key svc_key pub_ip app_port gw_port
  pg_pass=$(gen_secret)
  jwt_secret=$(gen_secret)
  anon_key=$(sign_jwt "$jwt_secret" "anon")
  svc_key=$(sign_jwt "$jwt_secret" "service_role")
  pub_ip=$(detect_public_ip)
  app_port=$(pick_free_port 3000)
  gw_port=$(pick_free_port 8088)

  cat > .env <<ENV
# Auto-generated by ./docker/start.sh — DO NOT commit this file.

# Postgres
POSTGRES_PASSWORD=${pg_pass}
POSTGRES_DB=postgres
POSTGRES_USER=postgres

# JWT (used by GoTrue + PostgREST + Storage — min 32 chars)
JWT_SECRET=${jwt_secret}
JWT_EXPIRY=3600

# Pre-signed JWTs (matched to JWT_SECRET above — regenerated if you change JWT_SECRET)
ANON_KEY=${anon_key}
SERVICE_ROLE_KEY=${svc_key}

# Public URL the browser and app hit (the nginx gateway).
# Update SUPABASE_PUBLIC_URL if you put a domain/reverse-proxy in front.
SUPABASE_PUBLIC_URL=http://${pub_ip}:${gw_port}
SITE_URL=http://${pub_ip}:${app_port}

# Ports
APP_PORT=${app_port}
GATEWAY_PORT=${gw_port}
ENV

  echo "==> docker/.env created with freshly generated secrets."
}

# ── Regenerate JWTs if JWT_SECRET changed ─────────────────────────────────────
refresh_jwts_if_needed() {
  # shellcheck disable=SC1091
  source .env

  local current_anon current_svc
  current_anon=$(sign_jwt "$JWT_SECRET" "anon")
  current_svc=$(sign_jwt "$JWT_SECRET" "service_role")

  # Compare only header+payload (ignore exp drift from time of signing)
  local stored_hp current_hp
  stored_hp=$(echo "$ANON_KEY" | cut -d. -f1,2)
  current_hp=$(echo "$current_anon" | cut -d. -f1,2)

  if [ "$stored_hp" != "$current_hp" ]; then
    echo "==> JWT_SECRET changed — regenerating ANON_KEY and SERVICE_ROLE_KEY …"
    sed -i "s|^ANON_KEY=.*|ANON_KEY=${current_anon}|" .env
    sed -i "s|^SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=${current_svc}|" .env
    echo "==> JWTs updated in docker/.env."
  fi
}

# ── Main ──────────────────────────────────────────────────────────────────────
CMD="${1:-up}"

case "$CMD" in
  up|start|"")
    [ ! -f .env ] && bootstrap_env
    refresh_jwts_if_needed

    # ── Check ports are still free; reassign if taken by another process ──
    # shellcheck disable=SC1091
    source .env
    local cur_app="${APP_PORT:-3000}" cur_gw="${GATEWAY_PORT:-8088}"
    local new_app new_gw changed=0

    port_free() {
      python3 -c "
import socket, sys
s = socket.socket()
try: s.bind(('0.0.0.0', int(sys.argv[1]))); s.close(); raise SystemExit(0)
except OSError: raise SystemExit(1)
" "$1" 2>/dev/null
    }

    if ! port_free "$cur_app"; then
      new_app=$(pick_free_port $((cur_app + 1)))
      echo "==> Port ${cur_app} is in use — switching app to ${new_app}"
      sed -i "s|^APP_PORT=.*|APP_PORT=${new_app}|" .env
      changed=1
    fi
    if ! port_free "$cur_gw"; then
      new_gw=$(pick_free_port $((cur_gw + 1)))
      echo "==> Port ${cur_gw} is in use — switching gateway to ${new_gw}"
      sed -i "s|^GATEWAY_PORT=.*|GATEWAY_PORT=${new_gw}|" .env
      # Also update SUPABASE_PUBLIC_URL to the new gateway port
      local pub_ip
      pub_ip=$(detect_public_ip)
      sed -i "s|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=http://${pub_ip}:${new_gw}|" .env
      changed=1
    fi
    [ $changed -eq 1 ] && echo "==> docker/.env updated with new ports."

    # Re-source after all updates
    # shellcheck disable=SC1091
    source .env

    COMPOSE=(docker compose --env-file .env -f docker-compose.yml)
    "${COMPOSE[@]}" up -d --build

    APP_PORT="${APP_PORT:-3000}"
    GATEWAY_PORT="${GATEWAY_PORT:-8088}"

    echo ""
    echo "✅  Sonora stack is starting (services may take ~30 s on first run)."
    print_config
    ;;

  down|stop)
    docker compose --env-file .env -f docker-compose.yml down
    ;;

  logs)
    docker compose --env-file .env -f docker-compose.yml logs -f
    ;;

  diagnose)
    [ ! -f .env ] && { echo "No .env found — run ./docker/start.sh first."; exit 1; }
    # shellcheck disable=SC1091
    source .env
    local gw="${GATEWAY_PORT:-8088}" app="${APP_PORT:-3000}"
    echo ""
    echo "── Container status ────────────────────────────────────────────────"
    docker compose --env-file .env -f docker-compose.yml ps
    echo ""
    echo "── Ports Docker is listening on ────────────────────────────────────"
    ss -tlnp 2>/dev/null | grep -E "LISTEN|${gw}|${app}|54322" || \
      netstat -tlnp 2>/dev/null | grep -E "LISTEN|${gw}|${app}|54322" || \
      echo "(ss/netstat not available)"
    echo ""
    echo "── Local connectivity test ─────────────────────────────────────────"
    curl -sI --max-time 3 "http://127.0.0.1:${app}" 2>/dev/null | head -3 \
      && echo "✅  App reachable on localhost:${app}" \
      || echo "❌  App NOT reachable on localhost:${app}"
    curl -sI --max-time 3 "http://127.0.0.1:${gw}/auth/v1/health" 2>/dev/null | head -3 \
      && echo "✅  Gateway reachable on localhost:${gw}" \
      || echo "❌  Gateway NOT reachable on localhost:${gw}"
    echo ""
    echo "── OS firewall ─────────────────────────────────────────────────────"
    if command -v ufw &>/dev/null; then
      echo "ufw status: $(ufw status 2>/dev/null | head -1)"
    fi
    if command -v firewall-cmd &>/dev/null; then
      echo "firewalld: $(firewall-cmd --state 2>/dev/null)"
    fi
    echo "iptables INPUT chain:"
    iptables -L INPUT -n --line-numbers 2>/dev/null | head -10 || echo "(not available)"
    echo ""
    echo "── Most likely cause if local works but public doesn't ─────────────"
    echo "   → Cloud provider firewall (Hetzner / DigitalOcean / AWS / GCP)"
    echo "     This is SEPARATE from the OS firewall — must be configured"
    echo "     in your provider's web console / dashboard."
    echo ""
    echo "   Hetzner:        console.hetzner.cloud → Firewall → add rules"
    echo "   DigitalOcean:   cloud.digitalocean.com → Networking → Firewalls"
    echo "   AWS:            EC2 → Security Groups → Inbound Rules"
    echo "   GCP:            VPC → Firewall → allow tcp:${app},${gw}"
    echo "   Vultr/Linode:   usually no cloud firewall — check OS only"
    echo ""
    ;;

  open-ports|openports)
    [ ! -f .env ] && { echo "No .env found — run ./docker/start.sh first."; exit 1; }
    open_ports
    ;;

  reset)
    echo "⚠️  This will DESTROY all database and storage data."
    read -rp "Type 'yes' to confirm: " confirm
    [ "$confirm" = "yes" ] || { echo "Aborted."; exit 0; }
    docker compose --env-file .env -f docker-compose.yml down -v
    echo "✅  Volumes deleted. Run ./docker/start.sh to start fresh."
    ;;

  config)
    [ ! -f .env ] && { echo "No .env found — run ./docker/start.sh first."; exit 1; }
    print_config
    ;;

  *)
    echo "Unknown command: $CMD"
    echo "Usage: $0 [up|down|logs|reset|config]"
    exit 1
    ;;
esac
