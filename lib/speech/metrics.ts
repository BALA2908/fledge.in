/**
 * Speaking-practice metrics (PLAN.md §6) — pure functions, no browser APIs,
 * so they unit-test cleanly. The recorder component feeds them the final
 * transcript, a word/time series, and (for read-aloud) the target passage.
 */

/** Filler words/phrases we count and highlight. Order matters: multi-word
 * phrases first so "you know" isn't split into "you" + "know". */
export const FILLERS = [
  "you know",
  "i mean",
  "kind of",
  "sort of",
  "um",
  "uh",
  "erm",
  "hmm",
  "like",
  "basically",
  "actually",
  "literally",
] as const;

export type FillerCount = { filler: string; count: number };

const WORD_RE = /[a-z0-9']+/gi;

export function wordCount(text: string): number {
  return (text.match(WORD_RE) ?? []).length;
}

/** Words per minute. Returns 0 for empty/zero-duration input. */
export function computeWpm(text: string, durationSeconds: number): number {
  const words = wordCount(text);
  if (durationSeconds <= 0 || words === 0) return 0;
  return Math.round((words / durationSeconds) * 60);
}

/** WPM band guidance (PLAN.md §6: 110–150 is the target). */
export function wpmVerdict(wpm: number): "slow" | "good" | "fast" {
  if (wpm < 110) return "slow";
  if (wpm > 150) return "fast";
  return "good";
}

/**
 * Count filler words/phrases in the transcript. Case-insensitive, whole
 * word/phrase only. "so" is only a filler when it STARTS a sentence, so it
 * is handled separately from the list above.
 */
export function detectFillers(text: string): {
  counts: FillerCount[];
  total: number;
} {
  const lower = ` ${text.toLowerCase().replace(/[.,!?;:]/g, " ")} `;
  const counts: FillerCount[] = [];
  let total = 0;

  for (const filler of FILLERS) {
    // Whole-word/phrase match with spaces around it.
    const re = new RegExp(`(?<=\\s)${filler.replace(/ /g, "\\s+")}(?=\\s)`, "g");
    const n = (lower.match(re) ?? []).length;
    if (n > 0) {
      counts.push({ filler, count: n });
      total += n;
    }
  }

  // Sentence-initial "so" — start of transcript or after . ! ?
  const soRe = /(^|[.!?])\s*so\s+/gi;
  const soCount = (text.match(soRe) ?? []).length;
  if (soCount > 0) {
    counts.push({ filler: "so", count: soCount });
    total += soCount;
  }

  counts.sort((a, b) => b.count - a.count);
  return { counts, total };
}

/**
 * Longest pause (seconds) from the gaps between recognition results.
 * `resultTimes` are timestamps (ms) at which each interim/final result
 * arrived, in order. Empty or single-entry input ⇒ 0.
 */
export function longestPause(resultTimes: number[]): number {
  if (resultTimes.length < 2) return 0;
  let max = 0;
  for (let i = 1; i < resultTimes.length; i++) {
    max = Math.max(max, resultTimes[i] - resultTimes[i - 1]);
  }
  return Math.round((max / 1000) * 10) / 10;
}

function normalizeTokens(text: string): string[] {
  return (text.toLowerCase().match(WORD_RE) ?? []).map((w) => w.replace(/'/g, ""));
}

export type DiffToken = {
  word: string;
  status: "match" | "wrong" | "missing" | "extra";
};

/**
 * Read-aloud accuracy: normalized token diff of what was spoken against the
 * target passage (LCS-based). Returns an accuracy % (matched target tokens
 * ÷ target tokens) plus a token-by-token diff for highlighting.
 */
export function diffAccuracy(
  target: string,
  spoken: string
): { accuracyPct: number; diff: DiffToken[] } {
  const a = normalizeTokens(target);
  const b = normalizeTokens(spoken);
  if (a.length === 0) return { accuracyPct: 0, diff: [] };

  // LCS table over target (a) × spoken (b).
  const m = a.length;
  const n = b.length;
  const lcs: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      lcs[i][j] =
        a[i] === b[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);

  const diff: DiffToken[] = [];
  let i = 0;
  let j = 0;
  let matched = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      diff.push({ word: a[i], status: "match" });
      matched++;
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      // target token not spoken (skipped/mispronounced)
      diff.push({ word: a[i], status: "wrong" });
      i++;
    } else {
      // spoken an extra token not in target
      diff.push({ word: b[j], status: "extra" });
      j++;
    }
  }
  while (i < m) diff.push({ word: a[i++], status: "missing" });
  while (j < n) diff.push({ word: b[j++], status: "extra" });

  return { accuracyPct: Math.round((matched / a.length) * 100), diff };
}
