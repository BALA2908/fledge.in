import {
  JUDGE0_HOST,
  JUDGE0_KEY,
  JUDGE0_URL,
  LANGUAGES,
  type LanguageKey,
} from "./languages";
import { mergeTests, type TestCase } from "./compare";
import { judgeOutcome, type PistonResponse } from "./verdict";
import type { RunJudgeResult } from "./run-judge";

/**
 * Judge0 (RapidAPI CE) backend. Same contract as the Piston backend — one
 * API call per run/submit over the merged multi-test stdin. Judge0's result
 * is normalised into the Piston-shaped response so the existing, unit-tested
 * judgeOutcome/compare pipeline is reused unchanged.
 */

// Judge0 status ids: 1 queue · 2 processing · 3 accepted(ran) · 4 wrong
// (unused — we compare ourselves) · 5 TLE · 6 compile error ·
// 7-12 runtime errors · 13 internal · 14 exec-format.
export type Judge0Result = {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  exit_code: number | null;
  time: string | null; // seconds, e.g. "0.012"
  status: { id: number; description?: string };
};

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const unb64 = (s: string | null | undefined) =>
  s ? Buffer.from(s, "base64").toString("utf8") : "";

/**
 * Pure: Judge0 result → the Piston-shaped response judgeOutcome expects,
 * plus runtime in ms. Returns null for a still-processing / internal state
 * so the caller can treat it as a backend hiccup.
 */
export function mapJudge0Result(
  r: Judge0Result
): { piston: PistonResponse; runtimeMs: number | null } | null {
  const id = r.status.id;
  const runtimeMs = r.time ? Math.round(parseFloat(r.time) * 1000) : null;

  if (id === 1 || id === 2) return null; // never finished
  if (id === 13 || id === 14) return null; // internal / exec-format → hiccup

  if (id === 6) {
    return {
      piston: { compile: { code: 1, stderr: unb64(r.compile_output) } },
      runtimeMs,
    };
  }
  if (id === 5) {
    return {
      piston: { run: { code: null, signal: "SIGKILL", stdout: unb64(r.stdout) } },
      runtimeMs,
    };
  }
  if (id >= 7) {
    // Runtime error family. Force a nonzero code so judgeOutcome → RE.
    return {
      piston: {
        run: {
          code: r.exit_code && r.exit_code !== 0 ? r.exit_code : 1,
          stderr: unb64(r.stderr) || unb64(r.message),
          stdout: unb64(r.stdout),
        },
      },
      runtimeMs,
    };
  }
  // id === 3: it ran cleanly. Let compareOutputs decide AC vs WA.
  return {
    piston: { run: { code: 0, stdout: unb64(r.stdout) } },
    runtimeMs,
  };
}

const FINISHED = (id: number) => id > 2;

export async function runJudge0({
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
  if (!JUDGE0_KEY)
    return { ok: false, status: 500, message: "The judge isn't configured. Set JUDGE0_KEY." };

  const config = LANGUAGES[language];
  const { stdin, expectedGroups } = mergeTests(tests);
  const cpuLimit = Math.min(timeLimitMs / 1000, 10);

  const headers = {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": JUDGE0_KEY,
    "X-RapidAPI-Host": JUDGE0_HOST,
  };
  const payload = {
    language_id: config.judge0,
    source_code: b64(code),
    stdin: b64(stdin),
    cpu_time_limit: cpuLimit,
    wall_time_limit: Math.min(cpuLimit + 5, 20),
    redirect_stderr_to_stdout: false,
  };

  let result: Judge0Result | null = null;
  try {
    // wait=true returns the finished result in one call on most CE
    // deployments — cheapest against the free quota.
    const res = await fetch(
      `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (res.status === 429)
      return {
        ok: false,
        status: 429,
        message: "The judge's daily free quota is used up — try again later.",
      };
    if (res.status === 401 || res.status === 403)
      return { ok: false, status: 502, message: "The judge rejected our key. Check JUDGE0_KEY." };
    if (!res.ok)
      return { ok: false, status: 502, message: "The judge hiccuped. Run it again." };

    const body = (await res.json()) as Judge0Result & { token?: string };

    if (body.status && FINISHED(body.status.id)) {
      result = body;
    } else if (body.token) {
      // Fell back to async — poll the token a few times.
      result = await pollToken(body.token, headers);
    }
  } catch {
    return { ok: false, status: 504, message: "The judge took too long. Try again in a moment." };
  }

  if (!result)
    return { ok: false, status: 504, message: "The judge didn't finish in time. Try again." };

  const mapped = mapJudge0Result(result);
  if (!mapped)
    return { ok: false, status: 502, message: "The judge returned an unexpected result. Retry." };

  const compiled = language === "java" || language === "cpp";
  const outcome = judgeOutcome(mapped.piston, expectedGroups, { compiled });
  return { ok: true, runtimeMs: mapped.runtimeMs, ...outcome };
}

async function pollToken(
  token: string,
  headers: Record<string, string>
): Promise<Judge0Result | null> {
  const fields = "stdout,stderr,compile_output,message,status,time,exit_code";
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 700));
    const res = await fetch(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=true&fields=${fields}`,
      { headers, signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) continue;
    const body = (await res.json()) as Judge0Result;
    if (body.status && FINISHED(body.status.id)) return body;
  }
  return null;
}
