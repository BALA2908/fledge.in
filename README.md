# fledge — become full-fledged

A free platform for Indian college students: pick a career goal, follow a
structured roadmap with curated resources in your language (English / Tamil /
Hindi), practice original coding problems in the browser, train your speaking
out loud, and track your progress.

Full product spec: [PLAN.md](./PLAN.md) · Working agreements: [CLAUDE.md](./CLAUDE.md)

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 + shadcn/ui ·
framer-motion · Supabase (Postgres + Auth + RLS) · Monaco editor · Piston
(code execution) · Web Speech API (Communication Lab) · Vercel

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build — must pass before committing
npm run lint
```

Environment: copy `.env.example` to `.env.local` and fill in the Supabase
keys (needed from Phase 1 onward; the app runs without them in Phase 0).

## Deploying to Vercel

1. Push this repo to GitHub:
   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the
   repo. Next.js is auto-detected; no build settings to change.
3. Deploy. Env vars are not needed until Phase 1 — add the three Supabase
   keys under **Project → Settings → Environment Variables** when the
   database layer lands.

## Project structure

```
app/                  routes (App Router)
components/           ui/ (shadcn) · shared/ · brand/
lib/                  utilities, motion system; judge/ + supabase/ later
content/              seed JSON (pathways, problems) — Phase 1
supabase/migrations/  SQL migrations — Phase 1
types/                shared types + zod schemas — Phase 1
scripts/              seed + verification scripts — Phase 1
```

## Status

**Phase 0 — Scaffold**: design foundation (the "Ruled Notebook" system),
layout shell, placeholder pages. See PLAN.md §6 for the phase roadmap.
