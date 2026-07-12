import { describe, expect, it } from "vitest";
import { compareOutputs, mergeTests, toLines } from "./compare";
import { judgeOutcome } from "./verdict";

describe("toLines", () => {
  it("normalises CRLF and trims trailing whitespace per line", () => {
    expect(toLines("YES \r\nNO\t\r\n")).toEqual(["YES", "NO"]);
  });
  it("drops trailing blank lines but keeps interior ones", () => {
    expect(toLines("a\n\nb\n\n\n")).toEqual(["a", "", "b"]);
  });
});

describe("mergeTests", () => {
  it("sums T and concatenates bodies", () => {
    const merged = mergeTests([
      { input: "2\n1 2\n3 4\n", output: "3\n7\n" },
      { input: "1\n5 5\n", output: "10\n" },
    ]);
    expect(merged.stdin).toBe("3\n1 2\n3 4\n5 5\n");
    expect(merged.expectedGroups).toEqual([["3", "7"], ["10"]]);
  });

  it("handles inputs missing the final newline", () => {
    const merged = mergeTests([{ input: "1\n9", output: "9" }]);
    expect(merged.stdin).toBe("1\n9\n");
  });

  it("throws when an input does not start with T", () => {
    expect(() => mergeTests([{ input: "abc\n", output: "" }])).toThrow();
  });
});

describe("compareOutputs", () => {
  const groups = [["YES", "NO"], ["42"]];

  it("passes on exact match", () => {
    const r = compareOutputs(groups, "YES\nNO\n42\n");
    expect(r.passed).toBe(2);
    expect(r.cases.every((c) => c.pass)).toBe(true);
  });

  it("tolerates CRLF and trailing whitespace", () => {
    const r = compareOutputs(groups, "YES \r\nNO\r\n42  \r\n");
    expect(r.passed).toBe(2);
  });

  it("flags the first mismatching line with expected vs got", () => {
    const r = compareOutputs(groups, "YES\nMAYBE\n42\n");
    expect(r.passed).toBe(1);
    expect(r.cases[0]).toEqual({
      pass: false,
      mismatchLine: 1,
      expected: "NO",
      got: "MAYBE",
    });
    // the second group still reads its own slice of lines
    expect(r.cases[1].pass).toBe(true);
  });

  it("treats partial output as failure with '(no output)'", () => {
    const r = compareOutputs(groups, "YES\n");
    expect(r.passed).toBe(0);
    expect(r.cases[0].got).toBe("(no output)");
    expect(r.cases[1].got).toBe("(no output)");
  });

  it("multi-line-per-case groups own their exact line count", () => {
    const r = compareOutputs([["1", "2", "3"], ["9"]], "1\n2\n3\n9\n");
    expect(r.passed).toBe(2);
  });
});

describe("judgeOutcome", () => {
  const groups = [["YES"]];

  it("maps compile failure to CE with stderr detail", () => {
    const o = judgeOutcome(
      { compile: { code: 1, stderr: "Main.java:3: error: ';' expected" } },
      groups
    );
    expect(o.verdict).toBe("compile_error");
    expect(o.detail).toContain("';' expected");
  });

  it("maps SIGKILL to TLE", () => {
    const o = judgeOutcome(
      { run: { code: null, signal: "SIGKILL", stdout: "" } },
      groups
    );
    expect(o.verdict).toBe("time_limit_exceeded");
  });

  it("maps nonzero exit to RE", () => {
    const o = judgeOutcome(
      { run: { code: 1, stderr: "Traceback (most recent call last): ..." } },
      groups
    );
    expect(o.verdict).toBe("runtime_error");
  });

  it("maps output mismatch to WA and match to AC", () => {
    expect(
      judgeOutcome({ run: { code: 0, stdout: "NO\n" } }, groups).verdict
    ).toBe("wrong_answer");
    expect(
      judgeOutcome({ run: { code: 0, stdout: "YES\n" } }, groups).verdict
    ).toBe("accepted");
  });

  it("java compile success stage (code 0) does not trigger CE", () => {
    const o = judgeOutcome(
      { compile: { code: 0, stderr: "" }, run: { code: 0, stdout: "YES\n" } },
      groups
    );
    expect(o.verdict).toBe("accepted");
  });

  it("maps a compile failure surfaced in the RUN stage to CE for compiled langs", () => {
    // Our Piston build reports javac errors under run (no compile stage).
    const o = judgeOutcome(
      {
        run: {
          code: 1,
          stdout: "",
          stderr: "Main.java:1: error: <identifier> expected\n1 error\nerror: compilation failed\n",
        },
      },
      groups,
      { compiled: true }
    );
    expect(o.verdict).toBe("compile_error");
  });

  it("a genuine runtime crash (no compiler signature) stays RE for compiled langs", () => {
    const o = judgeOutcome(
      { run: { code: 1, stdout: "", stderr: "Exception in thread \"main\" java.lang.NullPointerException" } },
      groups,
      { compiled: true }
    );
    expect(o.verdict).toBe("runtime_error");
  });

  it("interpreted-language errors stay RE (no compiled flag)", () => {
    const o = judgeOutcome(
      { run: { code: 1, stdout: "", stderr: "Traceback ... error: bad" } },
      groups
    );
    expect(o.verdict).toBe("runtime_error");
  });
});
