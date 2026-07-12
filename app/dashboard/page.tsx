import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPathway } from "@/lib/content";
import { getCompletedTopicSlugs, getDashboardStats } from "@/lib/progress";
import { generatePlan } from "@/lib/plan/generate-plan";
import { derivePaceFactor, paceReason, weekStatus } from "@/lib/plan/adapt";
import type { CompanyType, Track } from "@/lib/plan/types";
import { WeekChecklist } from "@/components/dashboard/week-checklist";
import { AdjustPlanBanner } from "@/components/dashboard/adjust-plan-banner";
import { SolvedDonut, ActivityHeatmap } from "@/components/dashboard/stat-charts";
import { VerdictBadge } from "@/components/workspace/verdict-badge";
import type { Verdict } from "@/lib/judge/verdict";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your week's plan, progress, and streak.",
};

const BUFFER = 0.85;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [{ data: profile }, { data: planRow }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("user_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!planRow) redirect("/onboarding");

  const [pathway, completedTopicSlugs, stats] = await Promise.all([
    getPathway(planRow.pathway_slug),
    getCompletedTopicSlugs(supabase, user.id),
    getDashboardStats(supabase, user.id),
  ]);
  const firstName =
    (profile?.full_name as string | null)?.split(/\s+/)[0] ?? "there";

  // Minutes of learning done, all-time and this week, from completed topics.
  const topicMinutes = new Map<string, number>();
  for (const m of pathway?.modules ?? [])
    for (const t of m.topics) topicMinutes.set(t.slug, t.est_minutes);
  const doneMinutesAllTime = completedTopicSlugs.reduce(
    (n, slug) => n + (topicMinutes.get(slug) ?? 0),
    0
  );

  // Derived pace (§2C: never stored) — behind for a week ⇒ lighter weeks.
  const planStart = new Date(planRow.updated_at ?? Date.now());
  const weeksElapsed = Math.floor(
    (Date.now() - planStart.getTime()) / (7 * 86_400_000)
  );
  const baselineCap = (planRow.hours_per_week ?? 6) * 60 * BUFFER;
  const paceFactor = derivePaceFactor(doneMinutesAllTime, baselineCap, weeksElapsed);

  const plan = pathway
    ? generatePlan({
        pathway: {
          slug: pathway.slug,
          title: pathway.title,
          modules: pathway.modules.map((m) => ({
            slug: m.slug,
            title: m.title,
            topics: m.topics.map((t) => ({
              slug: t.slug,
              title: t.title,
              estMinutes: t.est_minutes,
              isCore: t.is_core,
            })),
          })),
        },
        goalNote: planRow.goal_note ?? undefined,
        companyType: (planRow.company_type ?? "service") as CompanyType,
        targetDate: planRow.target_date ?? new Date().toISOString().slice(0, 10),
        hoursPerWeek: planRow.hours_per_week ?? 6,
        track: (planRow.track ?? "full") as Track,
        paceFactor,
        skippedModules: planRow.skipped_modules ?? [],
        completedTopicSlugs,
        today: new Date().toISOString().slice(0, 10),
      })
    : null;

  const thisWeek = plan?.weeks[0];

  // This week's status from learning minutes done since the week started.
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const status = thisWeek
    ? weekStatus(
        // Approximation: minutes of topics completed in the last 7 days.
        // (We don't store per-topic completion time yet, so use all-time
        // done vs planned when weeksElapsed is 0, else the pace signal.)
        weeksElapsed === 0 ? doneMinutesAllTime : paceFactor * thisWeek.plannedMinutes,
        thisWeek.plannedMinutes
      )
    : "on_track";

  const pathwayProgressPct =
    pathway && pathway.modules.length > 0
      ? Math.round(
          (completedTopicSlugs.length /
            Math.max(
              1,
              pathway.modules.reduce((n, m) => n + m.topics.length, 0)
            )) *
            100
        )
      : 0;

  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="margin-rule pl-8 sm:pl-12">
          <p aria-hidden="true" className="mb-1 -rotate-2 font-hand text-xl text-margin/80">
            this week —
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Keep walking, {firstName}.
          </h1>
          {planRow.goal_note && (
            <p className="mt-2 text-sm text-muted-foreground">
              The goal: {planRow.goal_note}
            </p>
          )}
        </header>

        <div className="mt-8 space-y-5">
          {plan && status !== "on_track" && (
            <AdjustPlanBanner
              status={status}
              reason={paceReason(status, paceFactor)}
              pathwaySlug={planRow.pathway_slug}
              options={!plan.fit.fits ? plan.fit.options : []}
            />
          )}

          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            {thisWeek ? (
              <WeekChecklist
                week={thisWeek}
                pathwaySlug={planRow.pathway_slug}
                completedTopicSlugs={completedTopicSlugs}
              />
            ) : (
              <section className="rounded-lg border border-verdict/40 bg-verdict/5 p-6">
                <p className="font-hand text-2xl text-verdict">
                  path complete —
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You&apos;ve cleared every topic on this plan. Pick another
                  path or keep grinding problems.
                </p>
              </section>
            )}

            <div className="space-y-5">
              {/* pathway progress */}
              <section className="rounded-lg border border-rule bg-card p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">
                    {pathway?.title ?? planRow.pathway_slug}
                  </h2>
                  <span className="font-mono text-xs text-muted-foreground">
                    {pathwayProgressPct}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-verdict transition-all"
                    style={{ width: `${pathwayProgressPct}%` }}
                  />
                </div>
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  {completedTopicSlugs.length} topics done · target{" "}
                  {planRow.target_date}
                </p>
                <Link
                  href={`/pathways/${planRow.pathway_slug}`}
                  className="mt-3 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open the roadmap →
                </Link>
              </section>

              {/* solved donut */}
              <section className="rounded-lg border border-rule bg-card p-5">
                <h2 className="text-sm font-semibold">Problems solved</h2>
                <SolvedDonut solved={stats.solvedByDifficulty} />
                <p className="text-center font-mono text-[11px] text-muted-foreground">
                  {stats.acceptancePct === null
                    ? "no submissions yet"
                    : `${stats.acceptancePct}% acceptance · ${stats.attemptedTotal} attempted`}
                </p>
              </section>
            </div>
          </div>

          {/* streak + heatmap */}
          <section className="rounded-lg border border-rule bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Your last 26 weeks</h2>
              <div className="flex gap-4 font-mono text-xs">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true">🔥</span>
                  <span className="font-semibold">{stats.currentStreak}</span>
                  <span className="text-muted-foreground">day streak</span>
                </span>
                <span className="text-muted-foreground">
                  best {stats.bestStreak}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <ActivityHeatmap heatmap={stats.heatmap} />
            </div>
          </section>

          {/* recent submissions */}
          <section className="rounded-lg border border-rule bg-card p-5">
            <h2 className="text-sm font-semibold">Recent submissions</h2>
            {stats.recent.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nothing yet.{" "}
                <Link href="/problems/canteen-token-pairs" className="text-primary underline-offset-4 hover:underline">
                  Solve your first problem →
                </Link>
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-rule">
                {stats.recent.map((s, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2">
                    <Link
                      href={`/problems/${s.problemSlug}`}
                      className="min-w-0 truncate text-sm font-medium hover:text-primary"
                    >
                      {s.problemTitle}
                    </Link>
                    <span className="flex shrink-0 items-center gap-2">
                      <VerdictBadge verdict={s.verdict as Verdict} />
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
