import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Progress read helpers — server-side, authed client (RLS owner-only).
 * These power the dashboard and the signed-in roadmap. Pure aggregation
 * over the user's own submissions / topic_progress / daily_activity.
 */

export type Difficulty = "easy" | "medium" | "hard";

export type DashboardStats = {
  solvedByDifficulty: Record<Difficulty, number>;
  solvedTotal: number;
  attemptedTotal: number;
  acceptancePct: number | null;
  currentStreak: number;
  bestStreak: number;
  /** last 26 weeks (182 days) of activity for the heatmap, oldest → newest */
  heatmap: { day: string; count: number }[];
  recent: {
    problemSlug: string;
    problemTitle: string;
    verdict: string;
    language: string;
    createdAt: string;
  }[];
};

export async function getCompletedTopicSlugs(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("topic_progress")
    .select("topics(slug)")
    .eq("user_id", userId);
  return (data ?? [])
    .flatMap((r) => {
      // Supabase types the embedded relation as array | object depending
      // on the FK shape; normalise both.
      const t = (r as { topics: unknown }).topics;
      const rows = Array.isArray(t) ? t : t ? [t] : [];
      return rows as { slug: string }[];
    })
    .map((t) => t.slug)
    .filter((s): s is string => !!s);
}

function computeStreaks(activeDays: Set<string>): {
  current: number;
  best: number;
} {
  if (activeDays.size === 0) return { current: 0, best: 0 };
  const sorted = [...activeDays].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const cur = new Date(sorted[i]);
    const gapDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    run = gapDays === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  // Current streak: consecutive days ending today or yesterday.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let current = 0;
  const cursor = new Date(today);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (!activeDays.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (activeDays.has(iso(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, best };
}

export async function getDashboardStats(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardStats> {
  const [submissionsRes, activityRes] = await Promise.all([
    supabase
      .from("submissions")
      .select("problem_id, verdict, language, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(400),
    supabase
      .from("daily_activity")
      .select("day, problems_solved, topics_completed, speaking_sessions")
      .eq("user_id", userId),
  ]);

  type SubRow = {
    problem_id: string;
    verdict: string;
    language: string;
    created_at: string;
  };
  const rawSubs = (submissionsRes.data ?? []) as SubRow[];

  // Problem metadata comes from the public view (submissions can't embed a
  // view via FK). One extra query keyed on the referenced ids.
  const problemIds = [...new Set(rawSubs.map((s) => s.problem_id))];
  const problemMeta = new Map<
    string,
    { slug: string; title: string; difficulty: Difficulty }
  >();
  if (problemIds.length > 0) {
    const { data: probs } = await supabase
      .from("problems_public")
      .select("id, slug, title, difficulty")
      .in("id", problemIds);
    for (const p of probs ?? [])
      problemMeta.set(p.id, { slug: p.slug, title: p.title, difficulty: p.difficulty });
  }

  const submissions = rawSubs.map((s) => ({
    ...s,
    problems_public: problemMeta.get(s.problem_id) ?? null,
  }));

  const solvedByDifficulty: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  const solvedProblemIds = new Set<string>();
  const attemptedProblemIds = new Set<string>();
  for (const s of submissions) {
    attemptedProblemIds.add(s.problem_id);
    if (s.verdict === "accepted" && !solvedProblemIds.has(s.problem_id)) {
      solvedProblemIds.add(s.problem_id);
      const diff = s.problems_public?.difficulty;
      if (diff) solvedByDifficulty[diff]++;
    }
  }

  const acceptedCount = submissions.filter((s) => s.verdict === "accepted").length;
  const acceptancePct =
    submissions.length > 0
      ? Math.round((acceptedCount / submissions.length) * 100)
      : null;

  const activity = activityRes.data ?? [];
  const activeDays = new Set(
    activity
      .filter(
        (a) =>
          (a.problems_solved ?? 0) > 0 ||
          (a.topics_completed ?? 0) > 0 ||
          (a.speaking_sessions ?? 0) > 0
      )
      .map((a) => a.day as string)
  );
  const { current, best } = computeStreaks(activeDays);

  const countByDay = new Map<string, number>();
  for (const a of activity)
    countByDay.set(
      a.day as string,
      (a.problems_solved ?? 0) + (a.topics_completed ?? 0) + (a.speaking_sessions ?? 0)
    );
  const heatmap: { day: string; count: number }[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 181);
  for (let i = 0; i < 182; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    heatmap.push({ day: key, count: countByDay.get(key) ?? 0 });
  }

  const recent = submissions.slice(0, 10).map((s) => ({
    problemSlug: s.problems_public?.slug ?? "",
    problemTitle: s.problems_public?.title ?? "(problem)",
    verdict: s.verdict,
    language: s.language,
    createdAt: s.created_at,
  }));

  return {
    solvedByDifficulty,
    solvedTotal: solvedProblemIds.size,
    attemptedTotal: attemptedProblemIds.size,
    acceptancePct,
    currentStreak: current,
    bestStreak: best,
    heatmap,
    recent,
  };
}
