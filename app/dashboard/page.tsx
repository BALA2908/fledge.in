import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPathway } from "@/lib/content";
import { generatePlan } from "@/lib/plan/generate-plan";
import type { CompanyType, Track } from "@/lib/plan/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your week's plan, progress, and streak.",
};

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

  const pathway = await getPathway(planRow.pathway_slug);
  const firstName =
    (profile?.full_name as string | null)?.split(/\s+/)[0] ?? "there";

  // The schedule is derived, never stored (§2C) — recompute on every load.
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
        paceFactor: Number(planRow.pace_factor ?? 1),
        skippedModules: planRow.skipped_modules ?? [],
        completedTopicSlugs: [], // Phase 5 wires topic_progress in
        today: new Date().toISOString().slice(0, 10),
      })
    : null;

  const thisWeek = plan?.weeks[0];

  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 py-10">
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

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          {/* this week */}
          <section className="rounded-lg border border-rule bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Week 1 of {plan?.totalWeeks ?? "—"}</h2>
            {thisWeek ? (
              <>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {thisWeek.reason}
                </p>
                <ul className="mt-4 space-y-2">
                  {thisWeek.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start justify-between gap-3 rounded-md border border-rule p-3 text-sm"
                    >
                      <span className="min-w-0">
                        {item.kind === "topic" ? (
                          <Link
                            href={`/pathways/${planRow.pathway_slug}/${item.slug}`}
                            className="font-medium hover:text-primary"
                          >
                            {item.title}
                          </Link>
                        ) : item.kind === "practice" ? (
                          <Link href="/problems" className="font-medium hover:text-primary">
                            {item.count} {item.difficulty} problem
                            {item.count > 1 ? "s" : ""}
                          </Link>
                        ) : (
                          <span className="font-medium">
                            {item.count} speaking sessions
                          </span>
                        )}
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.reason}
                        </span>
                      </span>
                      {item.kind === "topic" && (
                        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                          ~{item.estMinutes}m
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Plan loading hit a snag — refresh, or rebuild it in{" "}
                <Link href="/onboarding" className="text-primary underline-offset-4 hover:underline">
                  onboarding
                </Link>
                .
              </p>
            )}
          </section>

          {/* the inputs + placeholder stats */}
          <div className="space-y-5">
            <section className="rounded-lg border border-rule bg-card p-5">
              <h2 className="text-sm font-semibold">Your plan inputs</h2>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Path</dt>
                  <dd className="font-medium">{pathway?.title ?? planRow.pathway_slug}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Target date</dt>
                  <dd className="font-mono text-xs">{planRow.target_date}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Hours / week</dt>
                  <dd className="font-mono text-xs">{planRow.hours_per_week}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Track</dt>
                  <dd className="font-mono text-xs">{planRow.track}</dd>
                </div>
                {(planRow.skipped_modules ?? []).length > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Tested out of</dt>
                    <dd className="font-mono text-xs">
                      {(planRow.skipped_modules ?? []).length} modules
                    </dd>
                  </div>
                )}
              </dl>
              <Link
                href="/onboarding"
                className="mt-3 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Adjust the plan →
              </Link>
            </section>

            <section className="rounded-lg border border-rule bg-card p-5">
              <h2 className="text-sm font-semibold">Progress</h2>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  ["0", "topics done"],
                  ["0", "solved"],
                  ["0", "day streak"],
                ].map(([n, label]) => (
                  <div key={label} className="rounded-md border border-rule p-2">
                    <p className="font-mono text-xl font-semibold">{n}</p>
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 font-hand text-lg text-muted-foreground">
                zeros are just day one —
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
