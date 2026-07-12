#!/usr/bin/env bash
#
# One-paste setup for self-hosted Piston on a Google Cloud e2-micro
# (Ubuntu 22.04, always-free tier). Gives you a stable HTTPS URL with NO
# domain purchase, and a shared-secret header so only Fledge's backend can
# call it.
#
# How it works:
#   - 2 GB swap  → so g++/javac compiles don't OOM on 1 GB RAM
#   - Piston in Docker, bound to 127.0.0.1:2000 (never exposed directly)
#   - Caddy terminates HTTPS on <EXTERNAL_IP>.nip.io (nip.io = free wildcard
#     DNS that maps the hostname to your IP, so Let's Encrypt can issue a
#     real cert — no domain needed), checks the Authorization header, and
#     reverse-proxies to Piston.
#
# BEFORE running:
#   1. Reserve a STATIC external IP for this VM (VPC network → IP addresses →
#      reserve; free while attached) so the URL doesn't change on reboot.
#   2. Firewall: the VM must allow HTTP(80) + HTTPS(443) — the "Allow HTTP/
#      HTTPS traffic" checkboxes at create time do this.
#
# RUN (SSH into the VM, then):
#   export PISTON_SECRET="pick-a-long-random-string"
#   curl -fsSL <raw-url-of-this-file> | bash
#   # …or paste the whole script after setting PISTON_SECRET.
#
set -euo pipefail

if [[ -z "${PISTON_SECRET:-}" ]]; then
  echo "❌ Set PISTON_SECRET first:  export PISTON_SECRET=\"a-long-random-string\""
  exit 1
fi

echo "▸ Detecting external IP…"
EXTERNAL_IP="$(curl -fsS -H 'Metadata-Flavor: Google' \
  http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip || true)"
if [[ -z "$EXTERNAL_IP" ]]; then
  echo "❌ Couldn't read the external IP from metadata. Is this a GCP VM with an external IP?"
  exit 1
fi
HOST="${EXTERNAL_IP}.nip.io"
echo "  external IP: $EXTERNAL_IP → host: $HOST"

echo "▸ Creating a 2 GB swap file (for compiles on 1 GB RAM)…"
if ! sudo swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

echo "▸ Installing Docker…"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
fi

echo "▸ Starting Piston (bound to localhost only)…"
sudo docker rm -f fledge-piston 2>/dev/null || true
sudo docker run -d --name fledge-piston --restart unless-stopped \
  --privileged -p 127.0.0.1:2000:2000 \
  -v piston-packages:/piston/packages \
  ghcr.io/engineer-man/piston:latest

echo "▸ Waiting for Piston to come up…"
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:2000/api/v2/runtimes >/dev/null 2>&1; then break; fi
  sleep 2
done

echo "▸ Installing language runtimes (python, java, c++, node)…"
for lang in python java "c++" javascript; do
  echo "   → $lang"
  curl -fsS -X POST http://127.0.0.1:2000/api/v2/packages \
    -H 'Content-Type: application/json' -d "{\"language\":\"$lang\"}" >/dev/null || true
done

echo "▸ Installing Caddy (auto-HTTPS + secret check)…"
if ! command -v caddy >/dev/null; then
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl >/dev/null
  curl -1fsSL 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1fsSL 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo apt-get update -y >/dev/null
  sudo apt-get install -y caddy >/dev/null
fi

echo "▸ Writing Caddyfile…"
sudo tee /etc/caddy/Caddyfile >/dev/null <<CADDY
${HOST} {
  @authed header Authorization "Bearer ${PISTON_SECRET}"
  handle @authed {
    reverse_proxy 127.0.0.1:2000
  }
  respond "unauthorized" 401
}
CADDY
sudo systemctl restart caddy

cat <<DONE

✅ Done. Your judge is live at:
     https://${HOST}/api/v2

   Give Fledge these two values:
     PISTON_URL    = https://${HOST}/api/v2
     PISTON_SECRET = (the secret you set)

   Quick self-test (should print runtimes):
     curl -s https://${HOST}/api/v2/runtimes -H "Authorization: Bearer \$PISTON_SECRET"
   Without the header it should say "unauthorized".
DONE
