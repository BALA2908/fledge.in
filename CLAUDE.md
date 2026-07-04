# Fledge — Claude Code Project Guide

## What this is
Free platform for Indian college students: career pathways (roadmap +
curated multi-language resources) + a personal plan engine (§2C:
diagnostic, pacing, weekly adaptation — pure rules, no LLM) +
LeetCode-style coding judge + in-browser speaking practice + progress
tracking. Full context in PLAN.md.

## Stack
Next.js 15 App Router · TypeScript strict · Tailwind + shadcn/ui ·
framer-motion · Supabase (Postgres + Auth + RLS, Mumbai) · Monaco
editor · Piston public API (judge) · Web Speech API + MediaRecorder
(Communication Lab) · Vercel.

## Commands
npm run dev · npm run build · npm run lint · npm run test (vitest) ·
npm run db:seed (tsx scripts/seed.ts)

## Structure
app/ routes · components/ · lib/ (supabase/, judge/) · content/ (seed
JSON) · supabase/migrations/ · types/ · scripts/

## Non-negotiable rules
- Server components by default; "use client" only when interactivity needs it
- NEVER expose SUPABASE_SERVICE_ROLE_KEY, hidden_tests, or
  reference_solution to the client; browser reads problems only via the
  problems_public view
- RLS on every table; user data owner-only
- Judge: multi-test format, exactly ONE Piston call per run/submit
- Mobile-first (test at 360px), dark mode, loading/empty/error states on
  every page
- Design = PLAN.md §2A exactly: notebook tokens, Bricolage / Instrument
  Sans / JetBrains Mono / Caveat, pen-stroke motion,
  prefers-reduced-motion always
- Copy = PLAN.md §2B voice: senior-friend tone, banned-words list; every
  UI string gets a human pass from Bala before shipping
- Communication Lab: audio never leaves the browser; persist metrics only
- Personalization = lib/plan pure functions with unit tests; every plan
  decision returns a one-sentence reason; no LLM calls at runtime; the
  weekly schedule is derived, never stored
- Problem statements are ORIGINAL — never copy LeetCode/HackerRank wording
- Small commits per feature; npm run build must pass before ending a task

## Env
NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY ·
SUPABASE_SERVICE_ROLE_KEY (server only) · SENTRY_DSN (Phase 6)

## Current phase
Phase 0 — Scaffold   ← update this line as you progress
