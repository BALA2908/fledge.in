import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLanguageKey, MAX_CODE_BYTES } from "@/lib/judge/languages";
import { runJudge } from "@/lib/judge/run-judge";
import { throttle } from "@/lib/judge/throttle";
import type { TestCase } from "@/lib/judge/compare";

/**
 * Full judging (auth required): sample + hidden tests fetched with the
 * ADMIN client server-side only, one Piston call, verdict persisted.
 * Hidden test contents never appear in any response.
 */

const bodySchema = z.object({
  slug: z.string().min(1),
  language: z.string(),
  code: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to submit — runs work without an account." },
      { status: 401 }
    );

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const { slug, language, code } = parsed.data;

  if (!isLanguageKey(language))
    return NextResponse.json({ error: "Unknown language." }, { status: 400 });
  if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES)
    return NextResponse.json(
      { error: "Code is over 64KB — trim it down." },
      { status: 413 }
    );

  const gate = throttle(`submit:${user.id}`);
  if (!gate.allowed)
    return NextResponse.json(
      { error: `Easy — wait ${gate.retryAfterS}s between submits.` },
      { status: 429 }
    );

  const admin = createAdminClient();

  // Second throttle gate that survives serverless instances: last row.
  const { data: lastSubmission } = await admin
    .from("submissions")
    .select("created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (
    lastSubmission &&
    Date.now() - new Date(lastSubmission.created_at).getTime() < 5000
  )
    return NextResponse.json(
      { error: "Easy — wait 5s between submits." },
      { status: 429 }
    );

  const { data: problem } = await admin
    .from("problems")
    .select("id, slug, kind, sample_tests, hidden_tests, time_limit_ms")
    .eq("slug", slug)
    .maybeSingle();
  if (!problem || problem.kind !== "coding")
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });

  const samples = (problem.sample_tests ?? []) as TestCase[];
  const hidden = (problem.hidden_tests ?? []) as TestCase[];
  const tests = [...samples, ...hidden];
  if (tests.length === 0)
    return NextResponse.json({ error: "No tests." }, { status: 422 });

  const result = await runJudge({
    language,
    code,
    tests,
    timeLimitMs: problem.time_limit_ms ?? 4000,
  });
  if (!result.ok)
    return NextResponse.json({ error: result.message }, { status: result.status });

  const passed = result.compare?.passed ?? 0;
  const total = result.compare?.total ?? tests.length;

  // Was this the user's first AC on this problem — or first ever?
  let firstAcForProblem = false;
  let firstAcEver = false;
  if (result.verdict === "accepted") {
    const { count: acOnProblem } = await admin
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("problem_id", problem.id)
      .eq("verdict", "accepted");
    firstAcForProblem = (acOnProblem ?? 0) === 0;
    if (firstAcForProblem) {
      const { count: acAnywhere } = await admin
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("verdict", "accepted");
      firstAcEver = (acAnywhere ?? 0) === 0;
    }
  }

  await admin.from("submissions").insert({
    user_id: user.id,
    problem_id: problem.id,
    language,
    code,
    verdict: result.verdict,
    passed,
    total,
    runtime_ms: result.runtimeMs,
  });

  if (firstAcForProblem) {
    const day = new Date().toISOString().slice(0, 10);
    const { data: activity } = await admin
      .from("daily_activity")
      .select("problems_solved, topics_completed, speaking_sessions")
      .eq("user_id", user.id)
      .eq("day", day)
      .maybeSingle();
    await admin.from("daily_activity").upsert(
      {
        user_id: user.id,
        day,
        problems_solved: (activity?.problems_solved ?? 0) + 1,
        topics_completed: activity?.topics_completed ?? 0,
        speaking_sessions: activity?.speaking_sessions ?? 0,
      },
      { onConflict: "user_id,day" }
    );
  }

  // Never leak hidden contents. For WA, only reveal a diff when the first
  // failure is within the PUBLIC sample prefix of the merged test order.
  const cases = result.compare?.cases ?? [];
  const firstFailIndex = cases.findIndex((c) => !c.pass);
  const failInSamples = firstFailIndex > -1 && firstFailIndex < samples.length;

  return NextResponse.json({
    verdict: result.verdict,
    passed,
    total,
    runtimeMs: result.runtimeMs,
    firstAcForProblem,
    firstAcEver,
    detail: result.detail ?? null,
    failedCase: failInSamples
      ? {
          index: firstFailIndex,
          input: samples[firstFailIndex].input,
          expected: samples[firstFailIndex].output,
          gotLine: cases[firstFailIndex].got ?? null,
          expectedLine: cases[firstFailIndex].expected ?? null,
        }
      : firstFailIndex > -1
        ? { index: firstFailIndex, hidden: true as const }
        : null,
  });
}
