-- Fledge — Phase 1 initial schema (PLAN.md §4)
-- Applies cleanly to a fresh Supabase project.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.format_pref as enum ('video_first', 'reading_first', 'mixed');
create type public.resource_type as enum ('video', 'doc', 'article', 'course');
create type public.resource_language as enum ('english', 'tamil', 'hindi');
create type public.resource_depth as enum ('intro', 'deep');
create type public.problem_difficulty as enum ('easy', 'medium', 'hard');
create type public.problem_kind as enum ('coding', 'mcq');
create type public.submission_verdict as enum (
  'accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compile_error'
);
create type public.company_type as enum ('service', 'product');
create type public.plan_track as enum ('full', 'core');
create type public.speaking_kind as enum ('hr_question', 'reading_passage');

-- ---------------------------------------------------------------------------
-- Content tables (public read when published)
-- ---------------------------------------------------------------------------
create table public.pathways (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  tagline      text,
  description  text,
  outcomes     text[] not null default '{}',
  is_published boolean not null default false,
  sort         integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.modules (
  id          uuid primary key default gen_random_uuid(),
  pathway_id  uuid not null references public.pathways(id) on delete cascade,
  slug        text not null,
  sort        integer not null default 0,
  title       text not null,
  description text,
  est_hours   numeric,
  unique (pathway_id, slug)
);
create index modules_pathway_id_idx on public.modules (pathway_id, sort);

create table public.topics (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references public.modules(id) on delete cascade,
  slug        text not null unique,
  sort        integer not null default 0,
  title       text not null,
  summary_md  text,
  tips        text[] not null default '{}',
  est_minutes integer not null default 30,
  is_core     boolean not null default true
);
create index topics_module_id_idx on public.topics (module_id, sort);

create table public.resources (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references public.topics(id) on delete cascade,
  type        public.resource_type not null,
  title       text not null,
  url         text not null,
  source      text,
  language    public.resource_language not null,
  minutes     integer,
  depth       public.resource_depth not null default 'intro',
  is_verified boolean not null default false,
  sort        integer not null default 0
);
create index resources_topic_id_idx on public.resources (topic_id, sort);

-- problems: hidden_tests and reference_solution are SECRET. The browser only
-- ever reads the problems_public view (see bottom of this file).
create table public.problems (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title              text not null,
  difficulty         public.problem_difficulty not null,
  kind               public.problem_kind not null,
  statement_md       text,
  input_format_md    text,
  output_format_md   text,
  constraints_md     text,
  sample_tests       jsonb,
  hidden_tests       jsonb,             -- SECRET
  starter_code       jsonb,
  reference_solution jsonb,             -- SECRET
  mcq                jsonb,
  hints              text[] not null default '{}',
  tags               text[] not null default '{}',
  topic_slugs        text[] not null default '{}',
  pathway_slugs      text[] not null default '{}',
  module_slug        text,
  diagnostic         boolean not null default false,
  time_limit_ms      integer not null default 4000,
  is_published       boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index problems_difficulty_idx on public.problems (difficulty);
create index problems_kind_idx on public.problems (kind);
create index problems_tags_idx on public.problems using gin (tags);
create index problems_topic_slugs_idx on public.problems using gin (topic_slugs);
create index problems_pathway_slugs_idx on public.problems using gin (pathway_slugs);
create index problems_module_slug_idx on public.problems (module_slug);

create table public.speaking_prompts (
  id           uuid primary key default gen_random_uuid(),
  kind         public.speaking_kind not null,
  title        text not null,
  prompt_md    text not null,
  tips         text[] not null default '{}',
  sort         integer not null default 0,
  is_published boolean not null default false
);

-- ---------------------------------------------------------------------------
-- User tables (owner-only)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  college         text,
  grad_year       integer,
  preferred_langs text[] not null default '{}',
  format_pref     public.format_pref,
  pathway_slug    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.submissions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  language   text not null,
  code       text not null,
  verdict    public.submission_verdict not null,
  passed     integer not null default 0,
  total      integer not null default 0,
  runtime_ms integer,
  created_at timestamptz not null default now()
);
create index submissions_user_id_idx on public.submissions (user_id, created_at desc);
create index submissions_problem_id_idx on public.submissions (problem_id);

create table public.topic_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  topic_id     uuid not null references public.topics(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create table public.daily_activity (
  user_id           uuid not null references auth.users(id) on delete cascade,
  day               date not null,
  problems_solved   integer not null default 0,
  topics_completed  integer not null default 0,
  speaking_sessions integer not null default 0,
  primary key (user_id, day)
);

create table public.speaking_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  prompt_id    uuid references public.speaking_prompts(id) on delete set null,
  mode         text,
  duration_s   integer,
  wpm          numeric,
  filler_count integer,
  fillers      jsonb,
  accuracy_pct numeric,
  transcript   text,  -- opt-in only; audio itself is never stored anywhere
  created_at   timestamptz not null default now()
);
create index speaking_sessions_user_id_idx on public.speaking_sessions (user_id, created_at desc);

create table public.user_plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  pathway_slug    text not null,
  goal_note       text,
  company_type    public.company_type,
  target_date     date,
  hours_per_week  integer,
  track           public.plan_track not null default 'full',
  pace_factor     numeric not null default 1.0,
  skipped_modules text[] not null default '{}',
  updated_at      timestamptz not null default now(),
  unique (user_id, pathway_slug)
);

create table public.diagnostic_results (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  pathway_slug text not null,
  module_slug  text not null,
  score_pct    numeric not null,
  taken_at     timestamptz not null default now()
);
create index diagnostic_results_user_id_idx on public.diagnostic_results (user_id);

-- ---------------------------------------------------------------------------
-- Trigger: auto-create a profile row on signup
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.pathways           enable row level security;
alter table public.modules            enable row level security;
alter table public.topics             enable row level security;
alter table public.resources          enable row level security;
alter table public.problems           enable row level security;
alter table public.speaking_prompts   enable row level security;
alter table public.profiles           enable row level security;
alter table public.submissions        enable row level security;
alter table public.topic_progress     enable row level security;
alter table public.daily_activity     enable row level security;
alter table public.speaking_sessions  enable row level security;
alter table public.user_plans         enable row level security;
alter table public.diagnostic_results enable row level security;

-- Published content = public read
create policy "Published pathways are readable by everyone"
  on public.pathways for select
  using (is_published);

create policy "Modules of published pathways are readable by everyone"
  on public.modules for select
  using (exists (
    select 1 from public.pathways p
    where p.id = modules.pathway_id and p.is_published
  ));

create policy "Topics of published pathways are readable by everyone"
  on public.topics for select
  using (exists (
    select 1 from public.modules m
    join public.pathways p on p.id = m.pathway_id
    where m.id = topics.module_id and p.is_published
  ));

create policy "Resources of published pathways are readable by everyone"
  on public.resources for select
  using (exists (
    select 1 from public.topics t
    join public.modules m on m.id = t.module_id
    join public.pathways p on p.id = m.pathway_id
    where t.id = resources.topic_id and p.is_published
  ));

create policy "Published speaking prompts are readable by everyone"
  on public.speaking_prompts for select
  using (is_published);

-- problems: NO select policy for anon/authenticated on purpose — and the
-- grant itself is revoked below. The browser reads problems_public only.

-- Owner-only user data
create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can read their own submissions"
  on public.submissions for select using (auth.uid() = user_id);
create policy "Users can insert their own submissions"
  on public.submissions for insert with check (auth.uid() = user_id);

create policy "Users can read their own topic progress"
  on public.topic_progress for select using (auth.uid() = user_id);
create policy "Users can insert their own topic progress"
  on public.topic_progress for insert with check (auth.uid() = user_id);
create policy "Users can delete their own topic progress"
  on public.topic_progress for delete using (auth.uid() = user_id);

create policy "Users can read their own daily activity"
  on public.daily_activity for select using (auth.uid() = user_id);
create policy "Users can insert their own daily activity"
  on public.daily_activity for insert with check (auth.uid() = user_id);
create policy "Users can update their own daily activity"
  on public.daily_activity for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can read their own speaking sessions"
  on public.speaking_sessions for select using (auth.uid() = user_id);
create policy "Users can insert their own speaking sessions"
  on public.speaking_sessions for insert with check (auth.uid() = user_id);
create policy "Users can delete their own speaking sessions"
  on public.speaking_sessions for delete using (auth.uid() = user_id);

create policy "Users can read their own plans"
  on public.user_plans for select using (auth.uid() = user_id);
create policy "Users can insert their own plans"
  on public.user_plans for insert with check (auth.uid() = user_id);
create policy "Users can update their own plans"
  on public.user_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own plans"
  on public.user_plans for delete using (auth.uid() = user_id);

create policy "Users can read their own diagnostic results"
  on public.diagnostic_results for select using (auth.uid() = user_id);
create policy "Users can insert their own diagnostic results"
  on public.diagnostic_results for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- problems_public view — the ONLY way the browser reads problems.
-- Excludes hidden_tests and reference_solution. The view intentionally runs
-- with owner (definer) rights so it can read past the revoked table grant;
-- it exposes only safe columns of published problems.
-- ---------------------------------------------------------------------------
revoke all on table public.problems from anon, authenticated;

create view public.problems_public as
  select
    id, slug, title, difficulty, kind,
    statement_md, input_format_md, output_format_md, constraints_md,
    sample_tests, starter_code, mcq,
    hints, tags, topic_slugs, pathway_slugs, module_slug,
    diagnostic, time_limit_ms, created_at
  from public.problems
  where is_published;

grant select on public.problems_public to anon, authenticated;
