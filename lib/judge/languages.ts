/**
 * Judge language registry — the four supported languages mapped to Piston
 * runtimes. Versions are PINNED to our self-hosted instance (confirmed live
 * 2026-07-06) so a Piston upgrade never silently changes behaviour.
 */

export const LANGUAGES = {
  python: {
    label: "Python",
    piston: "python",
    version: "3.12.0",
    file: "main.py",
    monaco: "python",
    judge0: 71, // Python 3.8.1 (Judge0 CE)
  },
  java: {
    label: "Java",
    piston: "java",
    version: "15.0.2",
    // Piston runs the file as-is; our starter code uses `public class Main`.
    file: "Main.java",
    monaco: "java",
    judge0: 62, // OpenJDK 13 (Judge0 CE) — also expects `public class Main`
  },
  cpp: {
    label: "C++",
    piston: "c++",
    version: "10.2.0",
    file: "main.cpp",
    monaco: "cpp",
    judge0: 54, // GCC 9.2 (Judge0 CE), C++17-capable
  },
  javascript: {
    label: "JavaScript",
    piston: "javascript",
    version: "20.11.1",
    file: "main.js",
    monaco: "javascript",
    judge0: 63, // Node.js 12 (Judge0 CE)
  },
} as const;

/**
 * Which execution backend to use. Auto-picks judge0 when a RapidAPI key is
 * present, else piston. Override explicitly with JUDGE_BACKEND.
 */
export type JudgeBackend = "piston" | "judge0";
export const JUDGE_BACKEND: JudgeBackend =
  (process.env.JUDGE_BACKEND as JudgeBackend | undefined) ??
  (process.env.JUDGE0_KEY ? "judge0" : "piston");

// Judge0 (RapidAPI CE by default). Language IDs can be overridden per
// language via env if your instance ships newer runtimes.
export const JUDGE0_URL =
  process.env.JUDGE0_URL?.replace(/\/$/, "") ?? "https://judge0-ce.p.rapidapi.com";
export const JUDGE0_KEY = process.env.JUDGE0_KEY ?? "";
export const JUDGE0_HOST = process.env.JUDGE0_HOST ?? "judge0-ce.p.rapidapi.com";

export type LanguageKey = keyof typeof LANGUAGES;

export function isLanguageKey(value: string): value is LanguageKey {
  return value in LANGUAGES;
}

/**
 * Piston base URL. The public emkc.org instance went whitelist-only on
 * 2026-02-15 (returns 401), so this MUST point at our own Piston instance
 * (self-hosted) or an approved endpoint. Set PISTON_URL in the server env
 * to the base, e.g. https://piston.fledge.internal/api/v2/piston.
 */
const PISTON_BASE =
  process.env.PISTON_URL?.replace(/\/$/, "") ??
  "https://emkc.org/api/v2/piston";
export const PISTON_EXECUTE_URL = `${PISTON_BASE}/execute`;

/** Code size cap (PLAN.md §3): reject anything bigger before it leaves the browser. */
export const MAX_CODE_BYTES = 64 * 1024;

/**
 * Piston enforces a max run_timeout (our instance: 3000ms). A problem's
 * declared time_limit_ms is clamped to this. Safe: every reference solution
 * runs in well under 200ms, and the brute-force cases that SHOULD time out
 * blow past 3s as surely as they blow past 4–5s. Raise the container's
 * limit AND this env together if you ever need longer runs.
 */
export const PISTON_MAX_RUN_MS = Number(process.env.PISTON_MAX_RUN_MS ?? 3000);
