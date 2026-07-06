#!/usr/bin/env bash
# Installs the four languages Fledge's judge needs into a running Piston
# instance, then prints the installed versions so lib/judge/languages.ts
# can be pinned to match. Run AFTER `docker compose up -d`.
#
#   ./install-runtimes.sh              # local instance on :2000
#   PISTON=https://host/api/v2/piston ./install-runtimes.sh   # remote
set -euo pipefail

BASE="${PISTON:-http://localhost:2000/api/v2/piston}"

echo "Installing runtimes into $BASE …"
for lang in python java "c++" javascript; do
  echo "  → $lang"
  # Installs the latest available version of each language package.
  curl -fsS -X POST "$BASE/packages" \
    -H "Content-Type: application/json" \
    -d "{\"language\":\"$lang\"}" || echo "    (already installed or unavailable)"
done

echo
echo "Installed runtimes (pin these versions in lib/judge/languages.ts):"
curl -fsS "$BASE/runtimes" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const r of JSON.parse(d))console.log('  '+r.language+' '+r.version)})" \
  2>/dev/null || curl -fsS "$BASE/runtimes"
