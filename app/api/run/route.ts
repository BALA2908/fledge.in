import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isLanguageKey, MAX_CODE_BYTES } from "@/lib/judge/languages";
import { runJudge } from "@/lib/judge/run-judge";
import { throttle } from "@/lib/judge/throttle";
import type { TestCase } from "@/lib/judge/compare";

/**
 * Run against SAMPLE tests only (safe to reveal) — one Piston call.
 * Open to guests; throttled per user or IP.
 */

const bodySchema = z.object({
  slug: z.string().min(1),
  language: z.string(),
  code: z.string().min(1),
});

export async function POST(request: Request) {
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const gate = throttle(`run:${user?.id ?? ip}`);
  if (!gate.allowed)
    return NextResponse.json(
      { error: `Easy — wait ${gate.retryAfterS}s between runs.` },
      { status: 429 }
    );

  const { data: problem } = await supabase
    .from("problems_public")
    .select("slug, sample_tests, time_limit_ms, kind")
    .eq("slug", slug)
    .maybeSingle();
  if (!problem || problem.kind !== "coding")
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });

  const tests = (problem.sample_tests ?? []) as TestCase[];
  if (tests.length === 0)
    return NextResponse.json({ error: "No sample tests." }, { status: 422 });

  const result = await runJudge({
    language,
    code,
    tests,
    timeLimitMs: problem.time_limit_ms ?? 4000,
  });
  if (!result.ok)
    return NextResponse.json({ error: result.message }, { status: result.status });

  return NextResponse.json({
    verdict: result.verdict,
    detail: result.detail ?? null,
    runtimeMs: result.runtimeMs,
    // Sample tests are public — full diff context is fine here.
    cases: (result.compare?.cases ?? []).map((c, i) => ({
      index: i,
      pass: c.pass,
      input: tests[i]?.input ?? "",
      expected: tests[i]?.output ?? "",
      mismatchLine: c.mismatchLine ?? null,
      got: c.got ?? null,
      expectedLine: c.expected ?? null,
    })),
  });
}
