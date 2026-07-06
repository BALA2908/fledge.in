import { compareOutputs, type CompareResult } from "./compare";

/**
 * Verdict mapping (PLAN.md Phase 4): Piston execute response →
 * CE / TLE / RE / WA / AC. Pure — takes the raw Piston payload shape.
 */

export type Verdict =
  | "accepted"
  | "wrong_answer"
  | "time_limit_exceeded"
  | "runtime_error"
  | "compile_error";

export type PistonStage = {
  stdout?: string;
  stderr?: string;
  output?: string;
  code?: number | null;
  signal?: string | null;
};

export type PistonResponse = {
  compile?: PistonStage;
  run?: PistonStage;
};

export type JudgeOutcome = {
  verdict: Verdict;
  compare: CompareResult | null;
  /** short student-safe detail: compile errors / runtime stderr excerpt */
  detail?: string;
};

const DETAIL_LIMIT = 2000;

export function judgeOutcome(
  piston: PistonResponse,
  expectedGroups: string[][]
): JudgeOutcome {
  const emptyCompare: CompareResult = {
    passed: 0,
    total: expectedGroups.length,
    cases: expectedGroups.map(() => ({ pass: false })),
  };

  // Compile stage failed → CE.
  if (piston.compile && (piston.compile.code ?? 0) !== 0) {
    return {
      verdict: "compile_error",
      compare: emptyCompare,
      detail: (piston.compile.stderr || piston.compile.output || "").slice(0, DETAIL_LIMIT),
    };
  }

  const run = piston.run;
  if (!run) {
    return {
      verdict: "runtime_error",
      compare: emptyCompare,
      detail: "The judge returned no run result. Try again.",
    };
  }

  // Killed by signal → the sandbox stopped it: treat as time limit
  // (Piston SIGKILLs on run_timeout and memory caps).
  if (run.signal) {
    return {
      verdict: "time_limit_exceeded",
      compare: emptyCompare,
      detail: `Killed (${run.signal}) — usually an infinite loop or an approach that's too slow.`,
    };
  }

  if ((run.code ?? 0) !== 0) {
    return {
      verdict: "runtime_error",
      compare: emptyCompare,
      detail: (run.stderr || "").slice(0, DETAIL_LIMIT),
    };
  }

  const compare = compareOutputs(expectedGroups, run.stdout ?? "");
  return {
    verdict: compare.passed === compare.total ? "accepted" : "wrong_answer",
    compare,
  };
}
