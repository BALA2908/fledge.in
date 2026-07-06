# Self-hosted Piston for Fledge's judge

The public `emkc.org` Piston API is whitelist-only since 2026-02-15, so the
judge runs against our own Piston instance. Deploy once; the app talks to it
via the `PISTON_URL` env var.

## Recommended host: Oracle Cloud Always-Free VM

Oracle's always-free ARM VM (4 cores / 24 GB) is free forever and allows
privileged Docker — which Piston needs for its sandbox. Any VPS with Docker
works; a $5/mo box is fine too.

1. Create the VM (Ubuntu 22.04), open port **2000** in the security list.
2. SSH in and install Docker:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. Copy this folder up (or just the two files) and start it:
   ```bash
   docker compose up -d
   ./install-runtimes.sh
   ```
4. The installer prints the installed versions. Note them — the app pins
   these in `lib/judge/languages.ts`.
5. Put it behind HTTPS (Caddy one-liner, or Cloudflare Tunnel) so the
   browser and Vercel can reach it securely. Your `PISTON_URL` is then:
   ```
   https://your-host/api/v2/piston
   ```

## Then hand the URL back

Tell Claude the base URL and it will:
- set `PISTON_URL` in Vercel (all environments) and `.env.local`,
- reconcile `lib/judge/languages.ts` version pins to what's installed,
- run the end-to-end test (AC in all 4 languages, WA, TLE) against it.

## Note on scale
One small box handles a classroom easily. Piston already sandboxes each run
(CPU/mem/time caps); our judge adds a 5s per-user throttle and one Piston
call per submit, so load stays modest.
