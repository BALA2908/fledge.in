import {
  JUDGE_BACKEND,
  LANGUAGES,
  PISTON_EXECUTE_URL,
  PISTON_MAX_RUN_MS,
  PISTON_SECRET,
  type LanguageKey,
} from "./languages";
import { mergeTests, type TestCase } from "./compare";
import { judgeOutcome, type JudgeOutcome, type PistonResponse } from "./verdict";

/**
 * Executes a submission against a set of multi-test files with exactly ONE
 * backend call (PLAN.md §3). Server-side only. Dispatches to the configured
 * backend (Piston or Judge0); both share the merge/compare/verdict pipeline.
 */

export type RunJudgeArgs = {
  language: LanguageKey;
  code: string;
  tests: TestCase[];
  timeLimitMs: number;
};

export type RunJudgeResult =
  | ({ ok: true; runtimeMs: number | null } & JudgeOutcome)
  | { ok: false; status: number; message: string };

export async function runJudge(args: RunJudgeArgs): Promise<RunJudgeResult> {
  if (JUDGE_BACKEND === "judge0") {
    // Imported lazily so the Piston path has zero dependency on it.
    const { runJudge0 } = await import("./judge0");
    return runJudge0(args);
  }
  return runPiston(args);
}

async function runPiston({
  language,
  code,
  tests,
  timeLimitMs,
}: RunJudgeArgs): Promise<RunJudgeResult> {
  const config = LANGUAGES[language];
  const { stdin, expectedGroups } = mergeTests(tests);
  const runTimeout = Math.min(timeLimitMs, PISTON_MAX_RUN_MS);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (PISTON_SECRET) headers.Authorization = `Bearer ${PISTON_SECRET}`;

  let response: Response;
  try {
    response = await fetch(PISTON_EXECUTE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        language: config.piston,
        version: config.version,
        files: [{ name: config.file, content: code }],
        stdin,
        run_timeout: runTimeout,
        // Piston caps compile_timeout at 10s; stay at the ceiling.
        compile_timeout: 10000,
      }),
      // The judge call itself should never hang a serverless function.
      signal: AbortSignal.timeout(runTimeout + 25000),
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
  const compiled = language === "java" || language === "cpp";
  const outcome = judgeOutcome(piston, expectedGroups, { compiled });
  const runtimeMs =
    typeof piston.run?.wall_time === "number"
      ? Math.round(piston.run.wall_time)
      : typeof piston.run?.cpu_time === "number"
        ? Math.round(piston.run.cpu_time)
        : null;

  return { ok: true, runtimeMs, ...outcome };
}
