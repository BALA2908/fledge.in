-- Phase 6: speaking_prompts needs a stable slug for /speak/[slug] routing
-- and for idempotent seeding keyed on slug. Safe to run on a fresh or
-- existing DB (no prompts are seeded until after this migration).

alter table public.speaking_prompts
  add column if not exists slug text;

-- No rows exist yet, so we can enforce not-null + unique straight away.
update public.speaking_prompts set slug = id::text where slug is null;
alter table public.speaking_prompts alter column slug set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'speaking_prompts_slug_key'
  ) then
    alter table public.speaking_prompts
      add constraint speaking_prompts_slug_key unique (slug);
  end if;
end $$;
