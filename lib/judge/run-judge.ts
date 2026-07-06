import { LANGUAGES, PISTON_EXECUTE_URL, type LanguageKey } from "./languages";
import { mergeTests, type TestCase } from "./compare";
import { judgeOutcome, type JudgeOutcome, type PistonResponse } from "./verdict";

/**
 * Executes a submission against a set of multi-test files with exactly ONE
 * Piston call (PLAN.md §3). Server-side only.
 */

export type RunJudgeResult =
  | ({ ok: true; runtimeMs: number | null } & JudgeOutcome)
  | { ok: false; status: number; message: string };

export async function runJudge({
  language,
  code,
  tests,
  timeLimitMs,
}: {
  language: LanguageKey;
  code: string;
  tests: TestCase[];
  timeLimitMs: number;
}): Promise<RunJudgeResult> {
  const config = LANGUAGES[language];
  const { stdin, expectedGroups } = mergeTests(tests);

  let response: Response;
  try {
    response = await fetch(PISTON_EXECUTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: config.piston,
        version: config.version,
        files: [{ name: config.file, content: code }],
        stdin,
        run_timeout: timeLimitMs,
        compile_timeout: 15000,
      }),
      // The judge call itself should never hang a serverless function.
      signal: AbortSignal.timeout(timeLimitMs + 25000),
    });
  } catch {
    return {
      ok: false,
      status: 504,
      message: "The judge took too long to respond. Try again in a moment.",
    };
  }

  if (response.status === 429) {
    return {
      ok: false,
      status: 429,
      message: "The judge is busy right now — wait a few seconds and retry.",
    };
  }
  if (!response.ok) {
    return {
      ok: false,
      status: 502,
      message: "The judge hiccuped. Run it again.",
    };
  }

  const piston = (await response.json()) as PistonResponse & {
    run?: { wall_time?: number; cpu_time?: number };
  };
  const outcome = judgeOutcome(piston, expectedGroups);
  const runtimeMs =
    typeof piston.run?.wall_time === "number"
      ? Math.round(piston.run.wall_time)
      : typeof piston.run?.cpu_time === "number"
        ? Math.round(piston.run.cpu_time)
        : null;

  return { ok: true, runtimeMs, ...outcome };
}
