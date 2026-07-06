/**
 * Pure output comparison for the multi-test judge (PLAN.md §3).
 *
 * A submission is judged with ONE Piston call: the individual test files
 * (each "T\n<cases>") are merged into a single stdin, and the combined
 * stdout is compared back against each test file's expected line block.
 */

export type TestCase = { input: string; output: string };

export type MergedTests = {
  stdin: string;
  /** expected output lines, grouped per original test file */
  expectedGroups: string[][];
};

/** Normalise: CRLF → LF, trim trailing whitespace per line, drop trailing blank lines. */
export function toLines(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").map((l) => l.replace(/[ \t\r]+$/, ""));
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/**
 * Merge multiple T-prefixed test files into one stdin whose first line is
 * the total case count, preserving file order. Throws if a file doesn't
 * start with an integer T.
 */
export function mergeTests(tests: TestCase[]): MergedTests {
  let totalT = 0;
  const bodies: string[] = [];
  const expectedGroups: string[][] = [];

  for (const test of tests) {
    const lines = test.input.replace(/\r\n/g, "\n").split("\n");
    const t = Number.parseInt(lines[0], 10);
    if (!Number.isFinite(t) || t < 0)
      throw new Error(`test input does not start with T: ${JSON.stringify(lines[0])}`);
    totalT += t;
    const body = lines.slice(1).join("\n");
    bodies.push(body.endsWith("\n") || body === "" ? body : body + "\n");
    expectedGroups.push(toLines(test.output));
  }

  return {
    stdin: `${totalT}\n${bodies.join("")}`,
    expectedGroups,
  };
}

export type CaseResult = {
  pass: boolean;
  /** first mismatching line within this test (0-based), if any */
  mismatchLine?: number;
  expected?: string;
  got?: string;
};

export type CompareResult = {
  passed: number;
  total: number;
  cases: CaseResult[];
};

/**
 * Compare combined actual output against the per-test expected groups.
 * Consumes actual lines group by group, so per-query outputs work too —
 * each group knows exactly how many lines it owns.
 */
export function compareOutputs(
  expectedGroups: string[][],
  actual: string
): CompareResult {
  const actualLines = toLines(actual);
  const cases: CaseResult[] = [];
  let offset = 0;
  let passed = 0;

  for (const expected of expectedGroups) {
    let result: CaseResult = { pass: true };
    for (let i = 0; i < expected.length; i++) {
      const got = actualLines[offset + i];
      if (got === undefined) {
        result = {
          pass: false,
          mismatchLine: i,
          expected: expected[i],
          got: "(no output)",
        };
        break;
      }
      if (got !== expected[i]) {
        result = { pass: false, mismatchLine: i, expected: expected[i], got };
        break;
      }
    }
    if (result.pass) passed++;
    cases.push(result);
    offset += expected.length;
  }

  return { passed, total: expectedGroups.length, cases };
}
