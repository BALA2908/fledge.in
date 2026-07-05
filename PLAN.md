# Fledge — End-to-End Build Plan

> **One-liner:** A free platform for Indian college students — pick a career goal, follow a structured roadmap with curated resources in your preferred language (English / Tamil / Hindi), practice LeetCode-style problems with an in-browser judge, train your speaking out loud, and track your progress.

**The name: Fledge** — to grow the feathers you need for first flight. It's the root of the phrase every engineer is chasing — *full-fledged developer* — so the tagline writes itself: **Become full-fledged.** Verify before buying: `fledge.in` (fallbacks: getfledge.in, fledgehq.in, fledge.app), Google "fledge" + app/edtech, Play Store, Instagram/GitHub handles (@fledge.in / @fledgeapp if @fledge is gone), and a quick IP-India trademark search (classes 41/42). Known small namesakes, both far from this space: a Seattle accelerator (fledge.co), and Google once used "FLEDGE" for an adtech API — already renamed and fading.

**How to use this doc:** Drop this file into your repo root as `PLAN.md`. Claude Code can then read it any time you say "check PLAN.md". Each phase below has a copy-paste Claude Code prompt.

---

## 1. Scope — v1 (be ruthless about this)

**IN for launch:**
- 4 pathways: **Java Full-Stack Developer** (fully complete — your expertise, best content quality), **DSA & Problem Solving** (feeds the problem bank), Frontend Developer and Python Developer (partial / "in progress" badge)
- Roadmap pages: pathway → modules → topics, each topic with summary, tips, and resources tagged by language (English/Tamil/Hindi) and creator (Telusko, Kunal Kushwaha, Error Makes Clever, CodeWithHarry, Apna College, official docs, etc.)
- **Personal plan engine** (§2C): goal + target date + hours/week + an optional "what do you already know?" diagnostic → a week-by-week plan generated per student — skips modules they test out of, paces to their hours, mixes learning + problems + speaking sessions, and re-plans every week from their *measured* speed. Deterministic, explainable, ₹0
- Coding practice: ~60 original problems (easy/medium/hard), in-browser Monaco editor, run against test cases in **Python, Java, C++, JavaScript**, verdicts (AC/WA/TLE/RE/CE)
- MCQ quizzes for theory topics (Java OOP, Spring basics, etc.)
- **Communication Lab**: answer real HR questions or read passages out loud — live transcript, words-per-minute, filler-word count, read-aloud accuracy. Runs fully in the browser (Web Speech API): ₹0, and the audio never leaves the device
- A homepage that carries **your story** — low-tier college, no placements, the low months, the way out — written like a senior talking, not a brochure
- Signup/login (email + Google); onboarding captures goal + company type, target date, hours/week, language + format preference, and an optional diagnostic
- Dashboard: **your week's plan first** (learn · practice · speak items, each with its reason), then pathway progress %, solved-by-difficulty chart, activity heatmap + streak, recent submissions
- Deployed on a custom domain, SEO-ready, mobile-first

**OUT (post-launch, Phase 7 ideas):** AI hints/explanations, leaderboards, certificates, community/discussions, admin CMS, resume review, mock interviews, mobile app.

**Portfolio angle:** This complements TalentAI instead of duplicating it — TalentAI is B2B multi-agent recruiting; this is a B2C product with real users, content architecture, and a judge you designed for scale-on-zero-budget. Product companies love "I shipped something people use."

---

## 2. Tech Stack — final decision + why

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | One codebase (frontend + API routes = your backend), free forever on Vercel, **no cold starts** (Render's free tier sleeps ~15 min and takes ~50s to wake — that feels broken to students), SSR/SSG for SEO (students find you via Google), and it's the highest-value new skill for you — you already know React, Next.js is the natural next step |
| UI | Tailwind CSS + shadcn/ui + next-themes (dark mode) | Fast, professional, Claude Code is excellent with this combo |
| Code editor | Monaco (`@monaco-editor/react`) | The VS Code editor, free, loads client-side |
| DB + Auth | **Supabase free tier** (Mumbai region `ap-south-1`) | Postgres 500MB + **Auth built-in** (email + Google OAuth, 50k MAU free) + Row Level Security. Auth is the hardest thing to DIY safely — this solves it for ₹0 |
| Code execution | **Piston public API** (`emkc.org`) — no key, free | You already know Piston from TalentAI. Shared rate limit (~5 req/s global) is handled by our judge design (see §3). Scale-up path: self-host Piston on Oracle Cloud Always Free (4 ARM cores, 24GB RAM, ₹0 forever) — just swap an env var |
| Charts | recharts | Dashboard donut + heatmap |
| Motion | framer-motion | The pen-stroke motion system in §2A — path draw, reveals, micro-interactions |
| Fonts | Bricolage Grotesque · Instrument Sans · JetBrains Mono · Caveat (next/font, all free) | The notebook identity in §2A |
| Voice practice | **Web Speech API + MediaRecorder** (built into the browser) | Live speech-to-text + playback, fully on-device — ₹0, no keys, private by design (best in Chrome/Edge) |
| Markdown | react-markdown + @tailwindcss/typography | Problem statements, topic content |
| Monitoring | Sentry free tier + Vercel Analytics | Errors + traffic, both ₹0 |
| Hosting | **Vercel Hobby** (free) + custom domain | Note: Hobby tier is for non-commercial use — fine for a free community project; revisit only if you monetize |

**Alternative considered and rejected:** FastAPI + React on Render free tier (your comfort stack). Rejected because Render free sleeps → 50-second cold starts for every student who visits after a quiet period. Spring Boot rejected for the same reason plus memory pressure on 512MB free tiers. If you strongly prefer FastAPI, host it on Oracle Cloud Always Free instead — but Next.js keeps everything simpler and teaches you more.

### Budget (₹500 max)

| Item | Cost |
|---|---|
| Vercel, Supabase, Piston, Sentry, Analytics | ₹0 |
| **AI features** — you don't need paid keys: Google AI Studio gives a **free-tier Gemini API key with no credit card** (rate-limited but plenty for hints later). Also: all content is generated at **build time** by Claude Code, so runtime AI cost is ₹0 by design | ₹0 |
| Domain — `.in` ≈ ₹299–499 or `.xyz` ≈ ₹150 first year (Hostinger / GoDaddy / Namecheap) | **₹150–499** |
| **Total** | **≤ ₹500** ✅ |

The whole ₹500 goes to the domain. That's the right spend — it's what makes this a real product instead of a `vercel.app` subdomain.

---

## 2A. Design Direction — "The Ruled Notebook"

Every Indian student has filled a notebook with a **red double margin and pale ruled lines**. That page — the place they actually learned — is this site's visual world. Not corporate ed-tech, not a Tailwind template, and deliberately **not** the cream-background + high-contrast-serif + terracotta look every AI-generated site wears in 2025. This is **a senior's notebook, opened for a junior.**

One-line brief for Claude Code: *ink on ruled paper, a ballpoint-blue path drawn by hand, a red margin that holds notes — quiet and disciplined everywhere else.*

### Brand: the fledge wordmark
The name is the promise — *fledge*: ready for first flight. And the bridge into our notebook world is the **paper plane**: a page torn from this very ruled notebook, folded, and thrown. Flight metaphor and notebook design become one object.
- **Wordmark:** `fledge`, lowercase, Bricolage Grotesque SemiBold, ink color. After the final "e", a tiny pen-drawn paper plane lifting off along a dotted ballpoint-blue trail rising left→right. The trail draws itself once on first paint (SVG stroke-dashoffset, ~600ms; static under reduced-motion). Keep the plane doodle-style — one pen stroke, slight wobble — so it never reads as Telegram's solid plane. Build once as `components/brand/Wordmark.tsx` in Phase 0 and reuse everywhere.
- **App icon / favicon:** notebook-white rounded square, one hand-drawn paper plane with a short dotted blue trail. No letters at small sizes.
- **Casing:** the wordmark is lowercase `fledge`; prose says "Fledge".
- **Tagline:** *Become full-fledged.* (alt: *First flight starts here.*)
- **Hero tie-in:** the §2A hero path can end with the OFFER chit folding into a paper plane that lifts off — one beat, once, skippable.

### Tokens
| Token | Light — "Notebook" | Dark — "Night study" |
|---|---|---|
| Page | `#FCFBF7` | `#101319` |
| Text ink | `#1C1E26` | `#E8EAF2` |
| Ruled line | `#E3E7EF` (faint) | `#1D2330` |
| Margin red | `#D64545` — the structural margin rule + red-pen moments only (wrong answer, real warnings) | `#FF7A7A` |
| Ballpoint blue (the one accent) | `#2547C9` — CTAs, links, the drawn path, focus rings | `#7A9BFF` |
| Verdict green | `#2E9E5B` | `#4ADE80` |
| Code surfaces | the workspace editor panel is always `#14161C` — code always feels like an IDE | same |

Hard rules: one accent (blue). No gradients, no glassmorphism, no stock photos. The only illustration language is **pen**: inline-SVG doodles, squiggles, underlines, circles.

### Typography
| Role | Face (Google Fonts, free) | Use |
|---|---|---|
| Display | **Bricolage Grotesque** | headlines only, 600–800, tight leading — characterful and human |
| Body / UI | **Instrument Sans** | 400 / 500 / 600 |
| Code & numbers | **JetBrains Mono** | editor, verdicts, stats |
| Margin notes | **Caveat** | handwritten tips ONLY — never body text, max one cluster per screen |

### Layout signature
Content pages read like a notebook page: a thin **red margin rule on the left**, annotations living in the margin gutter (handwritten tips, checkboxes, tiny doodles), content sitting right of it over faint ruled lines. The margin isn't decoration — it encodes meaning: *margin = notes*, exactly like a real notebook.

### Motion system (framer-motion)
1. **The pen is the motif.** Things that appear, *write themselves*: SVG stroke-draw for the path, checkmarks, underlines.
2. Purpose over decoration. 150–400ms, ease-out, transform/opacity only (60fps), stagger 40–70ms, scroll-reveals fire once.
3. `prefers-reduced-motion` ⇒ simple fades. Non-negotiable.
4. Nothing loops except the streak flame's faint flicker.

### Signature moments (spend all boldness here; stay quiet everywhere else)
1. **Hero:** a ballpoint-blue path draws itself down a ruled page — from a small tick labeled "Day 1" to a stapled chit reading **OFFER** — pen-circling three milestones on the way ("first program", "first project", "first interview"). One orchestrated ~2s moment, skippable by scroll; reduced-motion users see the finished path.
2. **The roadmap IS that path.** On `/pathways/[slug]` the blue line is the spine connecting modules — and when you're signed in, *the drawn stretch is your completed part*. You literally see how far you've walked.
3. **First-ever AC:** a one-time full-screen beat — a red-ink **ACCEPTED** stamp thuds onto the page with the line *"First of many."* Never repeats.
4. Topic tips as **Caveat margin notes** with a hand-drawn underline.
5. Dashboard numbers count up; the streak flame flickers.

### Reusable design preamble — paste at the top of every UI phase prompt
```text
Quality bar: you are the design lead whose work gets screenshotted and
shared. PLAN.md §2A is the spec — tokens, type, motion, signature
moments — not a suggestion. Before coding, write a short design plan for
this phase and self-check: "would this same design fit any generic
ed-tech site?" If yes, revise until it could only belong to this
notebook world. While building, run the dev server, screenshot each
screen and self-critique (mirror check: remove one decoration before
finishing). Respect prefers-reduced-motion everywhere. If a screen looks
like a Tailwind template, redo it before showing me.
```

---

## 2B. Voice of the Site — every word sounds like a senior who's been there

The rule that beats all rules: **read it aloud. If you wouldn't say it to a junior over chai, rewrite it.** Claude Code drafts; **you do a human pass on every UI string before it ships** — that is what "human-written" means in practice, and it's baked into CLAUDE.md.

### Writing rules
1. "you" and "I". Never "users", "candidates", or "one".
2. Contractions. Short sentences — mostly under 14 words.
3. Specific beats abstract: say "Spring Boot", "third arrear", "off-campus drive" — never "industry-relevant skills".
4. Active voice; a button says exactly what happens: "Pick your path", "Run code", "Save session" — never "Submit" or "Get Started Now!".
5. Feelings named plainly, then forward motion. Honest — never pity, never hype.
6. Errors say what happened and what to do next; no apologizing, no vagueness. Empty states are invitations: *"Solve your first problem →"*.
7. **Banned words:** empower, unlock, leverage, elevate, seamless, supercharge, cutting-edge, world-class, game-changer, revolutionize, "in today's fast-paced world", journey (say *path*), delve, "free"/"always free" as branding (lead with value, not price).

### Hero copy — pick one, edit freely
**Option A** — H1: *Your college doesn't decide your career.* · Sub: *Your next six months do. Roadmaps, real practice problems, and speaking drills — from a fresher who got out of a no-placement college and wrote down every step.*

> **No "free" branding (decided July 2026):** Fledge is a service, and pricing talk cheapens it. Never brand it "free" or "always free" in UI copy — lead with the value and the story. (The site still costs students nothing; we just don't make that the pitch.)

**Option B** — H1: *No placements at your college? Same.* · Sub: *So I built my own way in — and left the map behind. Pick a path. Practice in English — it's what the interview panel speaks. Keep going till the offer letter.*

> **English-first (decided July 2026):** copy never leads with "in your language." English resources lead and are the default; practicing in English is sold as placement-communication training. Tamil/Hindi links stay in the data as a quiet "prefer your mother tongue?" fallback — demoted, never deleted.

CTA: **Pick your path →** · secondary link: *Read my story*

### "A note from Bala" — homepage story section (DRAFT — you must edit this)
This is *your* story, so these words are scaffolding, not final. Change every line until it sounds like you speaking. Keep only what's true — and only what you're comfortable with strangers reading. The hardest line (the low months) is yours to keep, soften, or cut; the story works either way.

> I studied at a college most recruiters have never heard of. No product company ever visited. In final year, friends from bigger colleges posted offer letters; I collected rejection mails and stopped opening LinkedIn. There were weeks I didn't want to leave my room.
>
> What changed things wasn't luck or talent. It was a map. I picked one path and stopped jumping between ten tutorials. I built small projects. I practiced problems daily. I applied off-campus everywhere, failed the same company's test more than once, and kept walking.
>
> Today I'm a software engineer working on AI systems. I'm not special. I just had a direction and refused to stop.
>
> This site is that map — free, in plain English, with everything I wish someone had handed me in second year.
>
> — Bala · [role], [company] · from a college you haven't heard of

Design note: render it as a notebook card pinned slightly askew, one Caveat scribble in the margin (*"this part was hard —"*), your signature if you want it. This section must feel *personal*, not designed-at.

---

## 2C. Personalization Engine — adaptive plans without an LLM

The pathway content is the **map** — universal, curated, high quality. Personalization is each student's **route on that map**: where they start, what they skip, how fast they move, and what this week looks like. Routes are computed by pure TypeScript rules — deterministic, testable, explainable, ₹0. That's *more* trustworthy than LLM-generated plans (no hallucinated schedules, identical quality for student #1 and student #10,000), and a better interview story: an adaptive scheduling engine you can whiteboard beats "I called an API."

### Inputs → effects
| Input | How we get it | What it changes |
|---|---|---|
| Goal + target company type (service/product) | asked at onboarding (goal kept as free text too) | the practice mix — product ⇒ heavier DSA volume |
| Target date | asked | how many weeks the work spreads across |
| Hours/week | asked | weekly capacity (with ~15% buffer) |
| What they already know | optional **diagnostic**: 2 sharp MCQs per module; ≥80% in a module ⇒ suggest skipping it — student confirms, never forced | the starting point; skipped modules appear pen-struck on the roadmap with *"tested out · 85%"* |
| Language + format preference | asked | resource ordering (Tamil-first, video-first…) |
| **Real learning speed** | **measured, never asked**: actual completed minutes vs planned, per week | pace_factor (EMA, clamped 0.5–1.5) reshapes every future week |
| Topic quiz scores | measured | <60% ⇒ a revise item (one deep resource + 2 problems) inserted before moving on |

### The generator (`lib/plan/` — pure functions + unit tests)
1. Remaining topics = pathway order − skipped modules − completed topics. **Core track** additionally drops `is_core:false` deep-dives.
2. Workload = Σ est_minutes vs capacity = hours/week × pace_factor. Doesn't fit the target date? **Don't pretend.** Show three honest options with real numbers: add hours · move the date · switch to Core track.
3. Fill each week: learn items in order + practice targets ramping easy→medium (heavier for product-company goals) + 2 speaking sessions.
4. **Every item carries a one-sentence `reason`** — "4 topics this week because you gave 6 hrs", "Skipped Core Java — you scored 85%". If the plan can't explain itself in plain words, that's a bug.
5. The schedule is **derived, never stored** — recomputed from (plan inputs + progress + today) on every dashboard load. No sync bugs; replanning is free.

### Weekly adaptation
Behind ⇒ a banner with one-tap fixes (redistribute · add hours · switch to Core track), each previewing its effect before applying. Ahead ⇒ topics pull forward and a medium problem gets suggested. The drawn path on the roadmap (§2A) always shows **plan** position — the metaphor stays honest: same map, *your* route.

### Where an LLM fits later (Phase 8, free tier, pure garnish)
Plain-English goal intake ("I want a Java backend job by June, I know basic C") and a weekly mentor note. The engine underneath never depends on it.

---

## 3. Architecture

### Routes
```
/                          landing (hero, pathways, how it works)
/pathways                  all pathways
/pathways/[slug]           roadmap: modules → topics timeline
/pathways/[slug]/[topic]   topic page: summary, tips, resources (language filter), linked problems
/problems                  filterable problem list (difficulty, tags, status)
/problems/[slug]           workspace: statement + Monaco editor + run/submit + results
/speak                     communication lab (modes + history)
/speak/[slug]              speaking session → live transcript → metrics
/login /signup /onboarding /dashboard /profile
/api/run  /api/submit  /api/cron/keepalive  /auth/callback
```

### Judge design — the key decision
Piston's public API has a **shared ~5 requests/second limit for everyone**. If we made one API call per test case, 10 hidden tests = 10 calls = instantly throttled with a few concurrent users.

**Solution: Codeforces-style multi-test problems.** Every problem's input starts with `T` (number of test cases), followed by all cases. The student's program loops T times. So judging a submission = **exactly ONE Piston call**, no matter how many test cases. Output is compared line-by-line per case server-side.

Flow: `Monaco → POST /api/submit → server fetches hidden tests (admin client, never sent to browser) → 1 Piston call → compare outputs → verdict → save submission → update daily_activity`.

Additional protections: per-user 5-second throttle between runs, code size cap (64KB), `run_timeout` per problem, and hidden tests + reference solutions live behind a DB view the browser can never read.

---

## 4. Database Schema (Supabase / Postgres)

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | id (= auth.users.id), full_name, college, grad_year, preferred_langs text[], format_pref (video_first/reading_first/mixed), pathway_slug | auto-created by trigger on signup |
| `pathways` | slug, title, tagline, description, outcomes[], is_published, sort | |
| `modules` | pathway_id, sort, title, description, est_hours | |
| `topics` | module_id, sort, slug, title, summary_md, tips[], est_minutes, is_core | is_core=false marks optional deep-dives the Core track can drop |
| `resources` | topic_id, type (video/doc/article/course), title, url, source (e.g. "Telusko"), language (english/tamil/hindi), minutes, depth (intro/deep), is_verified | English listed first + default; tamil/hindi kept as fallback |
| `problems` | slug, title, difficulty, kind (coding/mcq), statement_md, input_format_md, output_format_md, constraints_md, sample_tests jsonb, **hidden_tests jsonb**, starter_code jsonb, **reference_solution jsonb**, mcq jsonb, hints[], tags[], topic_slugs[], pathway_slugs[], module_slug, diagnostic (bool), time_limit_ms | bold columns are secret |
| `submissions` | user_id, problem_id, language, code, verdict, passed, total, runtime_ms | |
| `topic_progress` | user_id, topic_id, completed_at | PK (user_id, topic_id) |
| `daily_activity` | user_id, day, problems_solved, topics_completed, speaking_sessions | powers heatmap + streak |
| `speaking_prompts` | kind (hr_question/reading_passage), title, prompt_md, tips[], sort, is_published | Communication Lab content |
| `speaking_sessions` | user_id, prompt_id, mode, duration_s, wpm, filler_count, fillers jsonb, accuracy_pct, transcript (opt-in only), created_at | metrics only — the audio itself is never stored anywhere |
| `user_plans` | user_id, pathway_slug, goal_note, company_type (service/product), target_date, hours_per_week, track (full/core), pace_factor numeric default 1.0, skipped_modules text[], updated_at — unique(user_id, pathway_slug) | plan **inputs** only; the weekly schedule is always derived (§2C) |
| `diagnostic_results` | user_id, pathway_slug, module_slug, score_pct, taken_at | powers "tested out · 85%" explainability |

**Security rules (non-negotiable):**
- RLS on everything: content tables = public read (published only); user tables = owner-only
- Browser reads problems **only** through a `problems_public` view that excludes `hidden_tests` and `reference_solution`. Direct table select is revoked for anon/authenticated roles
- `SUPABASE_SERVICE_ROLE_KEY` is server-only, used inside `/api/submit` and the seed script

---

## 5. Content Strategy — how you get quality content for ₹0

This is the trick that makes the budget work: **Claude Code generates all content at build time** (during development, on your laptop) → stored as JSON in `/content` → seeded into Supabase. Zero runtime AI cost. You are the editor, not the writer.

```
content/
  pathways/java-fullstack.json     ← modules, topics, summaries, tips, resources
  pathways/dsa.json
  problems/dsa/two-sum-canteen.json  ← one file per problem
  problems/mcq-java/oop-basics-01.json
```

**Three hard rules:**
1. **Original problem statements only.** Never copy LeetCode/HackerRank wording — that's copyrighted. Claude Code writes fresh stories (campus/canteen/train-ticket flavored problems are fun and original) even for classic patterns like two-sum or sliding window.
2. **Every problem is validated before saving.** Claude Code writes a reference solution + test generator, then *actually runs* the solution against every test case locally. No hand-written expected outputs = no wrong answers in your judge.
3. **You verify every YouTube URL yourself.** Claude will sometimes get exact playlist URLs wrong. It fills in `source: "Telusko"`, exact video title, and `is_verified: false`; you paste the real URL and flip the flag. Official docs (docs.oracle.com, spring.io, MDN, react.dev) are safe for Claude to link directly.

Example problem JSON shape:
```json
{
  "slug": "canteen-token-pairs",
  "title": "Canteen Token Pairs",
  "difficulty": "easy",
  "kind": "coding",
  "statement_md": "The college canteen issues tokens...",
  "input_format_md": "First line T. For each test: N and target, then N integers.",
  "output_format_md": "For each test case print YES or NO.",
  "sample_tests": [{"input": "2\n4 9\n2 7 11 15\n3 10\n1 2 3\n", "output": "YES\nNO\n"}],
  "hidden_tests": [ "... 8–15 cases incl. edge + max-constraint ..." ],
  "starter_code": {"python": "...", "java": "...", "cpp": "...", "javascript": "..."},
  "reference_solution": {"python": "..."},
  "hints": ["Think about what you've already seen.", "A set gives O(1) lookup."],
  "tags": ["arrays", "hashing"],
  "topic_slugs": ["hashing-basics"],
  "pathway_slugs": ["dsa"],
  "time_limit_ms": 4000
}
```

---

## 6. Phase Plan — with copy-paste Claude Code prompts

**Realistic timeline at ~2 hrs/day alongside your Virtusa job: 7–9 weeks.** Each phase ends with something working and deployed. Run one phase per Claude Code session, `/clear` between phases.

---

### Phase 0 — Scaffold + Deploy-First (1–2 days)

**Your manual to-dos first:** GitHub repo created · Vercel account (link GitHub) · Supabase account (create project, **Mumbai region**, save the URL + anon key + service role key somewhere safe).

**Done when:** hello-world app with header/footer/dark-mode is live on `your-app.vercel.app`, `CLAUDE.md` and `PLAN.md` exist in the repo.

**Claude Code prompt:**
```text
You are building "Fledge" — a free career-prep platform for Indian college
students: structured learning pathways + curated resources + a LeetCode-style
coding judge + progress tracking. Read PLAN.md in the repo root for full context.

Stack (fixed): Next.js 15 (App Router) + TypeScript strict + Tailwind CSS +
shadcn/ui + next-themes. Supabase comes in Phase 1. Deploys to Vercel.

Tasks:
1. Scaffold with create-next-app (TypeScript, Tailwind, ESLint, App Router,
   no src/ dir, import alias @/*).
2. Init shadcn/ui (dark mode via class). Add: button, card, badge, tabs,
   accordion, input, label, dropdown-menu, avatar, progress, dialog,
   sonner, skeleton, tooltip, select, checkbox, switch. Install
   framer-motion.
3. Folder structure: app/, components/ (ui + shared), lib/, content/,
   supabase/migrations/, types/, scripts/.
4. Design foundation per PLAN.md §2A: fonts via next/font/google —
   Bricolage Grotesque (display), Instrument Sans (body), JetBrains Mono
   (code), Caveat (margin notes); the §2A palette as CSS variables wired
   into Tailwind for both themes (light "Notebook", dark "Night study");
   a global prefers-reduced-motion pattern. Base layout: sticky header
   (the fledge wordmark per the §2A brand block; nav: Pathways,
   Problems, Speak, Dashboard;
   theme toggle; "Sign in" placeholder), quiet footer, mobile-first,
   next-themes.
5. Placeholder pages: / (simple hero), /pathways, /problems, /speak,
   /dashboard.
6. Create CLAUDE.md at repo root with exactly the content I paste below.
   [PASTE THE CLAUDE.md TEMPLATE FROM PLAN.md §7]
7. Prettier config, .env.example (NEXT_PUBLIC_SUPABASE_URL,
   NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY), README with
   local-dev steps and Vercel deploy steps.
8. git init, sensible .gitignore, first commit.

Do NOT add database code yet. Verify `npm run build` passes before finishing,
then give me the exact Vercel deploy steps.
```

---

### Phase 1 — Database + Seed Engine + First Content (3–4 days)

**Your manual to-dos:** put the three Supabase keys in `.env.local` and in Vercel env vars.

**Done when:** migrations apply on a fresh Supabase project, `npm run db:seed` is idempotent, and an anon-key query provably **cannot** read `hidden_tests`.

**Prompt 1A — schema + seed pipeline:**
```text
Read CLAUDE.md and PLAN.md §4 (schema) first. Add the database layer.

1. Write Supabase SQL migration(s) in supabase/migrations/ creating every
   table from PLAN.md §4 with proper FKs, enums, indexes, and:
   - trigger: auto-insert into profiles on auth.users signup
   - RLS enabled on ALL tables. Published content = public read.
     profiles/submissions/topic_progress/daily_activity = owner-only.
   - a view `problems_public` excluding hidden_tests and reference_solution;
     REVOKE select on the problems table from anon/authenticated and GRANT
     select on the view instead.
2. lib/supabase/: browser client, server client (@supabase/ssr), admin client
   (service role — server-only, never imported in client components).
3. types/content.ts: zod schemas for pathway JSON and problem JSON matching
   PLAN.md §5's example shape. Export inferred TS types.
4. scripts/seed.ts (run via tsx, npm script "db:seed"): reads content/**/*.json,
   validates with zod (fail loudly with file + path of error), upserts via
   admin client keyed on slug. Idempotent.
5. Create content/ with one tiny sample pathway (1 module, 2 topics) and 2
   sample problems so seeding is testable end-to-end right now.
6. Write a small script scripts/verify-rls.ts that uses the ANON key to
   attempt reading hidden_tests and proves it fails.

Tell me the exact commands to apply migrations to my Supabase project.
```

**Prompt 1B — Java Full-Stack pathway content (run after 1A works):**
```text
Read CLAUDE.md, PLAN.md §5, and types/content.ts. Generate
content/pathways/java-fullstack.json — pathway "Java Full-Stack Developer"
for absolute-beginner Indian college students targeting fresher roles.

Modules in order: Programming Basics with Java → Core Java & OOP →
Collections & Generics → Exceptions & File I/O → JDBC & MySQL → Maven &
Build Basics → Spring Boot Fundamentals → REST APIs with Spring Boot →
HTML/CSS/JS Essentials → React Essentials → Full-Stack Mini Project →
Fresher Interview Prep.

Each module: 3–6 topics. Each topic:
- summary_md: 150–300 words, simple English, one concrete example
- tips: 2–4 one-liners (common fresher mistakes, interview angles)
- est_minutes: honest beginner time (read + watch one resource + try it)
- is_core: true, except ~20–30% deep-dive topics marked false (the Core
  track drops these)
- resources: 2–4 across languages, using these creator preferences:
  English → Telusko, Kunal Kushwaha · Hindi → CodeWithHarry, Apna College ·
  Tamil → Error Makes Clever. For every YOUTUBE resource: fill source and an
  exact searchable title, set url:"TODO" and is_verified:false — I will paste
  real URLs myself. For OFFICIAL DOCS (docs.oracle.com, spring.io, MDN,
  react.dev, baeldung.com) use real stable URLs.

Also create content/problems/mcq-java/: 3–5 MCQs per module
(kind:"mcq", mcq:{question_md, options[], correct_index, explanation_md}),
tagged with correct topic_slugs and pathway_slugs ["java-fullstack"].
Set module_slug on every MCQ and flag exactly 2 per module as
diagnostic:true — short, discriminative questions that reveal whether
someone already knows the module (never trivia).

Everything original wording. Validate the JSON against zod and run
npm run db:seed to confirm it loads.
```

**Prompt 1C — DSA problem bank (run in batches):**
```text
Read CLAUDE.md, PLAN.md §3 (judge design) and §5 (rules). Build the original
problem bank in content/problems/dsa/ — target 60 problems total:
25 easy, 25 medium, 10 hard across arrays, strings, hashing, two pointers,
sliding window, stack/queue, recursion, sorting & searching, prefix sums,
basic DP, math.

Non-negotiable rules per problem:
1. ORIGINAL statement — never LeetCode/HackerRank wording. Use fresh Indian
   campus-life framing (canteen tokens, train seats, hostel rooms, exam halls).
2. Codeforces-style multi-test I/O: first line T, then the cases; one answer
   line per case. Precise input_format_md / output_format_md. 2–3 sample_tests
   (safe to show), 8–15 hidden_tests including an edge case and a
   max-constraint case where a correct solution finishes well under
   time_limit_ms but a brute force TLEs (mediums/hards).
3. VALIDATION: write reference_solution.python and a test-case generator,
   RUN the solution against every test locally, and save only the outputs the
   solution produced. If the run fails, fix before saving.
4. starter_code for python, java (public class Main), cpp, javascript
   (Node stdin) — runnable skeleton that reads T, loops, calls a solve() stub.
5. 2 progressive hints, tags, topic_slugs, pathway_slugs ["dsa"]; tag
   interview-classic ones to ["dsa","java-fullstack"] too.

Work in batches of 10, then STOP and show me a summary table
(slug | difficulty | tags | tests count | validated ✓) for review before
the next batch. Seed and verify after each batch.
```

---

### Phase 2 — Public Content Pages (3–5 days)

**Done when:** a logged-out visitor can browse the full Java pathway, read topics, filter resources by language, and view the problem list — all responsive, dark-mode, SEO-tagged — and the homepage makes them *feel* something.

**Claude Code prompt:**
```text
Read CLAUDE.md, then PLAN.md §2A (design) and §2B (voice) — they are the
spec for this phase. [PASTE THE DESIGN PREAMBLE FROM §2A HERE.]
Build the public experience from seeded data. Server components by
default; anon server client; problems ONLY via the problems_public view.
All animation via framer-motion following §2A's motion rules.

1. / landing — the page a stressed second-year should fall in love with:
   a. Hero: §2B copy (Option A unless I say otherwise), CTA "Pick your
      path →", secondary "Read my story". Signature moment (§2A #1): the
      ruled-page hero where a ballpoint-blue path draws itself from a
      "Day 1" tick to a stapled OFFER chit, pen-circling three milestones
      as it passes. Skippable by scroll; reduced-motion users see the
      finished path.
   b. "Why this exists" — three short honest lines, not feature marketing.
   c. "A note from Bala" — the §2B founder note as a notebook card pinned
      slightly askew, one Caveat margin scribble, signature. Personal,
      not designed-at.
   d. How it works (3 steps with small pen doodles), a language strip
      (English · Tamil · Hindi), pathway cards, quiet footer.
   e. Full metadata + OpenGraph.
2. /pathways: grid — title, tagline, module count, est hours, an honest
   "in progress" badge where content is partial.
3. /pathways/[slug]: the roadmap IS the drawn path (§2A #2) — a vertical
   ballpoint spine down a ruled page connecting module nodes, segments
   drawing in on scroll; modules expand to topic lists with checkboxes
   (disabled + tooltip "Sign in to track").
4. /pathways/[slug]/[topicSlug]: a notebook page — red margin rule on the
   left, summary_md to the right of it (typography plugin), tips as
   Caveat margin notes with a pen underline, resources with language
   filter chips (English/Tamil/Hindi) + type icons, and a "Practice this
   topic" problem list.
5. /problems: filterable list — difficulty badges, tags, pathway filter,
   text search, solved-status placeholder.

Bar: perfect at 360px, both themes, skeletons, §2B-voice empty states,
generateStaticParams where possible, Lighthouse a11y ≥ 95 — and the
screenshot test: if any section could belong to a generic ed-tech
template, redo it before showing me.
```

---

### Phase 3 — Auth + Onboarding + Your Plan (3–4 days)

**Your manual to-dos:** Supabase Dashboard → Auth: enable Google provider (create OAuth client in Google Cloud Console — free), set Site URL + redirect URLs for localhost and the Vercel domain.

**Done when:** full loop works on the deployed site — signup (email or Google) → onboarding (goal, hours, optional diagnostic) → a plan preview that explains itself → dashboard shell → logout → login.

**Claude Code prompt:**
```text
Read CLAUDE.md. Add authentication with Supabase using @supabase/ssr.

1. /login and /signup: email+password (with email-verification flow) and
   "Continue with Google". shadcn forms, zod validation, friendly inline
   errors, /auth/callback route handler.
2. middleware.ts: session refresh; protect /dashboard, /onboarding, /profile
   and the submit API; redirect logged-out users to /login?next=…
3. First login → /onboarding wizard (per PLAN.md §2C):
   step 1 — choose pathway
   step 2 — the goal: free-text goal_note, target company type
     (service/product), target date, hours/week, format preference
     (video-first / reading-first / mixed)
   step 3 — preferred resource languages (multi) + college + grad year
   step 4 — optional diagnostic: "Check what I already know" runs the
     pathway's diagnostic MCQs (2 per module, one module at a time;
     ≥80% in a module ⇒ suggest skipping it, student confirms each
     skip) — or "I'm starting from zero" skips straight past
   step 5 — plan preview: call lib/plan/generatePlan and show the
     week-by-week summary with its plain-sentence reasons ("Skipped
     Core Java — you scored 85%", "4 topics/week because you gave
     6 hrs"). Save profiles, user_plans, diagnostic_results → /dashboard.
   NOTE: implement lib/plan/generatePlan for now as a typed STUB with
   fixture output — Phase 5 builds the real engine; this preview UI must
   already consume the real interface so nothing changes later.
4. Header: replace Sign-in button with avatar dropdown (Dashboard, Profile,
   Sign out) when authed.
5. Verify the profiles auto-create trigger works for both email and Google
   signups (Google display name should populate full_name).

Security check before finishing: no service-role usage in any client
component; auth works on Vercel deploy, not just localhost.
```

---

### Phase 4 — Coding Workspace + Judge (5–7 days) ⭐ the core

**Done when:** you can solve a seeded easy problem end-to-end in all 4 languages and get **AC**; wrong code → **WA** with a sample-case diff; an infinite loop → **TLE**; and the judge's unit tests pass.

**Claude Code prompt:**
```text
Read CLAUDE.md and PLAN.md §3 carefully — the judge design is fixed:
multi-test problems, exactly ONE Piston call per run/submit.
Piston public API: POST https://emkc.org/api/v2/piston/execute with
{language, version, files:[{name, content}], stdin, run_timeout}.
GET /runtimes lists versions.

1. lib/judge/languages.ts: map our 4 languages (python, java, cpp,
   javascript) → Piston language names + pinned versions (fetch /runtimes
   once and hardcode sensible pins). Java's file must be Main.java.
2. lib/judge/compare.ts: pure function — split expected vs actual output
   into per-case line groups, trim trailing whitespace, return per-case
   pass/fail + first mismatch. lib/judge/verdict.ts: map Piston result →
   CE (compile stage error) / TLE (timeout or killed signal) /
   RE (nonzero exit, runtime stderr) / WA / AC. Write vitest unit tests
   for both files — cover trailing newlines, CRLF, partial output.
3. POST /api/run: body {slug, language, code}. Uses SAMPLE tests only
   (safe to reveal). Builds combined stdin, one Piston call with the
   problem's time_limit_ms, returns per-case results with expected vs got.
4. POST /api/submit (auth required): admin client fetches sample + hidden
   tests SERVER-SIDE ONLY. Same single-call flow. Response: verdict,
   passed/total, runtime — never hidden-test contents. Persist to
   submissions; on a user's FIRST AC for a problem, upsert daily_activity.
5. Throttling: reject if the user's last run/submit was < 5 seconds ago
   (in-memory map keyed by user/IP for runs + last submissions row check);
   cap code at 64KB; client disables buttons with a countdown while pending.
6. /problems/[slug] workspace: responsive two-pane layout — left: tabs
   (Description | Submissions | Hints revealed one-by-one with a
   "reveal hint" click); right: Monaco (dynamic import, ssr:false,
   theme synced to dark mode) with language select loading starter_code,
   persist the user's draft per problem+language in memory; bottom bar:
   Run + Submit + results panel with colored verdict badges, per-sample
   diff view, and a subtle success animation on first AC.
7. MCQ problems: render options, submit → instant correct/wrong +
   explanation_md reveal; store as a submissions row (verdict AC/WA).
8. Problem list: now show real solved/attempted status for the logged-in
   user.

Finish only when the vitest suite passes and you've walked me through a
manual test script I can run against the deployed site.
```

---

### Phase 5 — Personal Plan Engine + Progress + Dashboard (5–6 days)

**Done when:** two test users with different hours + diagnostic results get visibly different week-by-week plans; falling behind for a week changes next week's load with a one-line explanation; the dashboard reflects solves, topics and streaks after refresh; the generator/adapt test suites pass.

**Claude Code prompt:**
```text
Read CLAUDE.md and PLAN.md §2C — this phase builds the personalization
engine. Pure TypeScript + rules. No LLM anywhere.

1. lib/plan/generate.ts — a PURE function.
   In: the user_plans row (target_date, hours_per_week, track,
   skipped_modules, company_type, format_pref, pace_factor), the
   pathway's topics (order, est_minutes, is_core), topic_progress, today.
   Out: weeks[] of items {type: learn|practice|speak, ref, minutes,
   reason} — learn items in pathway order (skips removed; Core track
   drops is_core:false), practice targets ramping easy→medium (heavier
   volume when company_type=product), speak = 2 Communication Lab
   sessions/week; total capped at hours_per_week with ~15% buffer.
   Every item carries a one-sentence reason. If the workload can't fit
   the target date, return fit:false plus three options with real
   numbers (add N hrs/week · move date to X · Core track saves Y hrs).
2. lib/plan/adapt.ts: pace_factor = EMA of (actual completed minutes ÷
   planned) per week, clamped 0.5–1.5, persisted on user_plans; status
   on-track/behind/ahead; remaining weeks regenerate on every dashboard
   load (derived, never stored). A topic-quiz score <60% injects a
   revise item (one deep resource + 2 problems) before the next module.
3. Replace the Phase 3 stub so the onboarding preview runs the real
   engine.
4. Topic checkboxes on pathway + topic pages work (auth): upsert
   topic_progress, bump daily_activity; optimistic UI with rollback.
5. /dashboard becomes plan-first:
   - "This week for you" checklist (learn/practice/speak items, reason
     shown on hover/tap) + a week progress ring
   - behind/ahead banner with one-tap fixes (redistribute · add hours ·
     switch to Core track) — each previews its effect before applying
   - then the stats: pathway progress bar, solved-by-difficulty donut
     (recharts), acceptance rate, 26-week heatmap + current/best streak,
     recent submissions table, "Continue" card
6. Roadmap page when signed in: skipped modules pen-struck with a
   "tested out · 85%" margin note; the drawn path (§2A #2) now shows
   PLAN position, not just raw completion.
7. /profile: edit plan inputs (hours, target date, track, format pref) →
   regenerate with a confirm preview; switch pathway behind a confirm
   dialog (progress kept, plan re-scoped).
8. Resources on topic pages order by preferred_langs + format_pref
   (video-first vs reading-first); filter chips still override.
9. vitest for generate.ts + adapt.ts: fits / doesn't-fit, skips, Core
   track, pace speeding up and slowing down, revise-item injection.

All queries through RLS-safe clients. Skeletons + §2B-voice empty states
("Solve your first problem →") everywhere.
```

---

### Phase 6 — Communication Lab: voice practice (3–4 days)

**Why it costs ₹0:** the browser already has everything. **Web Speech API** (SpeechRecognition) turns speech into a live transcript; **MediaRecorder** captures audio for playback. Nothing is uploaded — we persist only the numbers (plus the transcript, only if the student flips a clearly-labeled toggle). Privacy becomes a feature: *"your voice never leaves your device."*

**Done when:** you can answer "Tell me about yourself" out loud in Chrome and get duration, WPM, highlighted filler words, and playback; read-aloud mode scores accuracy; Firefox shows the graceful fallback; the metrics unit tests pass.

**Claude Code prompt:**
```text
Read CLAUDE.md, PLAN.md §2A + §2B, then this. [PASTE THE DESIGN PREAMBLE
FROM §2A HERE.] Build the Communication Lab — in-browser speaking
practice. Hard rule: audio never leaves the device; we persist metrics
only (+ transcript when the student switches a clearly-labeled toggle on).

0. Migration: speaking_prompts and speaking_sessions per PLAN.md §4; add
   speaking_sessions int default 0 to daily_activity. RLS: prompts public
   read (published), sessions owner-only.
1. Content + seed: content/speaking/hr-questions.json — 30 prompts (self
   intro, strengths, "why should we hire you", explain your project,
   situational) each with tips[] and a simple answer framework in
   prompt_md (e.g., Present–Past–Future for self intro). And
   reading-passages.json — 15 passages, 60–120 words, easy→hard, tech +
   general topics. Everything in §2B voice.
2. /speak: two mode cards — "Answer like an interview" and "Read aloud" —
   recent sessions, and a short how-it-works + privacy note.
3. /speak/[slug]: prompt card (tips as margin notes) → big record button
   (click, or hold Space) → live interim transcript while speaking →
   stop → results:
   - duration + words-per-minute on a gauge with the 110–150 target band
   - filler words counted AND highlighted inline in the transcript (um,
     uh, like, you know, basically, actually, I mean, sentence-initial
     "so")
   - longest-pause estimate (gaps between recognition results)
   - read-aloud mode: accuracy % via normalized token diff against the
     passage, mismatches highlighted
   - playback from the local MediaRecorder blob
   Results open with one genuine positive line before any numbers (§2B).
   "Save session" persists metrics (+ transcript only if toggled on);
   the first session of the day bumps daily_activity.speaking_sessions.
4. Feature-detect SpeechRecognition (Chrome/Edge are solid; Chrome's
   engine needs internet — say so plainly in the UI). Fallback elsewhere:
   record + playback + a self-review checklist, honestly explained —
   never fake numbers.
5. Dashboard: add a Speaking card — sessions this week, average WPM,
   filler-count trend.
6. vitest tests for the wpm, filler-detection, and diff-accuracy
   functions.
```

**Honest limits (put a small note in the UI too):** recognition quality varies with accent, mic, and background noise — this is a practice mirror, not a judge. That's fine: the real win is a student *speaking out loud daily and hearing themselves back*, which is most of what communication improvement actually is.

---

### Phase 7 — Production Hardening + Launch (3–4 days)

**Your manual to-dos:** buy the domain (≤₹500) → add to Vercel → update Supabase Site URL + Google OAuth redirect/consent screen → create Sentry project.

**Claude Code prompt:**
```text
Read CLAUDE.md. Launch prep — no new features.

1. SEO: per-route metadata + canonical URLs, branded OG image (static is
   fine), app/sitemap.ts, app/robots.ts.
2. Audit every route: loading.tsx, error.tsx, not-found.tsx, empty states;
   mobile QA at 360px; a11y pass (labels, focus rings, contrast).
3. Sentry (client + server, free tier) and Vercel Analytics.
4. Supabase free projects pause after ~7 days of inactivity: add
   /api/cron/keepalive doing a trivial select, scheduled daily via
   vercel.json crons.
5. Security review checklist — prove each: hidden_tests/reference_solution
   unreachable from the browser via any route or view; throttles active on
   /api/run and /api/submit; code size cap; service key server-only; RLS
   verified with scripts/verify-rls.ts.
6. Performance: Lighthouse ≥ 90 all categories on / and one problem page;
   Monaco stays dynamically imported; optimize images/fonts.
7. Polish README (screenshots, architecture diagram, stack) — this repo is
   a portfolio piece. Add MIT LICENSE.
Then hand me a launch checklist: Vercel domain connect, Supabase prod auth
URLs, Google OAuth consent publishing, final seed run.
```

**Launch week (you, not Claude):** invite ~10 juniors from your college to use it and watch them (best feedback you'll ever get) → fix top 3 complaints → LinkedIn launch post telling the story (your Balance/Virtusa posts show you're good at this) → college WhatsApp groups → r/developersIndia → a feedback form (Google Forms) linked in the footer.

---

### Phase 8 — Post-launch ideas (still ~₹0)

- **AI hints & "explain my wrong answer"** using the free Google AI Studio Gemini key (strict per-user daily limits so you stay inside the free tier) — the same key can review Communication Lab transcripts too (grammar, structure, STAR-method feedback)
- **Plain-English goal intake** via the same free key ("I want a Java backend job by June, I know basic C") parsed into plan inputs — the §2C engine underneath stays deterministic
- Self-host Piston on **Oracle Cloud Always Free** when traffic outgrows the public API (swap one env var)
- Leaderboard, weekly challenge, simple admin page for adding content without editing JSON
- Complete the Frontend + Python pathways; add an Aptitude module and group-discussion practice (huge for service-company placements)

---

## 7. CLAUDE.md template (paste into repo root in Phase 0)

```markdown
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
```

---

## 8. How to work with Claude Code on this (habits that matter)

1. **One phase per session.** Paste the phase prompt, `/clear` before the next phase. CLAUDE.md + PLAN.md carry the context.
2. **Plan first, code second.** Start big tasks with: *"Read PLAN.md §X. Think hard and propose your implementation plan first — wait for my approval before writing code."* Review the plan; you'll catch drift early.
3. **Review diffs like a reviewer, not a spectator.** You're the tech lead here — this is also interview material ("how did you ensure quality when building with AI?").
4. **Commit small, per feature.** Easy rollback, clean history for your portfolio.
5. **Demand tests where correctness matters** — the judge (compare/verdict) has them for a reason; a wrong verdict destroys student trust instantly.
6. Update the "Current phase" line in CLAUDE.md as you move — future sessions orient instantly.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Piston public API rate limit (~5 req/s shared, no SLA) | One-call-per-submission design + 5s per-user throttle; scale path = self-host Piston on Oracle Cloud Always Free (₹0); judge URL is an env var |
| SpeechRecognition isn't everywhere (solid in Chrome/Edge, missing in Firefox; Chrome's engine needs internet) | Feature-detect → fallback record-and-self-review mode with an honest explainer |
| Accents / mic noise reduce transcription accuracy | Frame it as a practice mirror, not a judge — lenient thresholds, results open with a genuine positive |
| The founder story is deeply personal | You own every word: §2B is a draft; publish only what's true and what you're comfortable sharing |
| Topic time estimates (est_minutes) will be wrong at first | The plan self-corrects weekly from each student's real pace (pace_factor); later, recalibrate content from aggregate actual completion times |
| Rules-based personalization sounding less "AI" | The magic is explainability + weekly adaptation — every plan line says *why*; free-tier Gemini garnish can be added later without touching the engine |
| Supabase free project pauses after ~7 days inactivity | Daily keepalive cron (Phase 6) |
| Vercel Hobby = non-commercial only | Fine for a free community project; upgrade only if you ever monetize |
| Wrong/rotted YouTube links | `is_verified` flag; you paste and verify every video URL before publishing |
| Copying copyrighted problem statements | Hard rule in CLAUDE.md: original statements; you spot-check each batch |
| Wrong expected outputs breaking trust | Every test case generated by running the reference solution — never hand-written |
| Burnout (full-time job + this) | Phases are independent checkpoints; the site is *useful* from Phase 2 onward even before the judge exists — you can soft-launch the roadmap-only version early |

---

## 10. Quick-reference: total cost

Vercel ₹0 · Supabase ₹0 · Piston ₹0 · Web Speech API ₹0 · Fonts & animation ₹0 · Sentry ₹0 · Analytics ₹0 · Gemini (future, free tier) ₹0 · **Domain ₹150–499** → **Total ≤ ₹500.**

Ship it. 🚀
