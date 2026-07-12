import { describe, expect, it } from "vitest";
import { mapJudge0Result, type Judge0Result } from "./judge0";
import { judgeOutcome } from "./verdict";

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");

function result(partial: Partial<Judge0Result> & { status: { id: number } }): Judge0Result {
  return {
    stdout: null,
    stderr: null,
    compile_output: null,
    message: null,
    exit_code: null,
    time: "0.05",
    ...partial,
  };
}

describe("mapJudge0Result", () => {
  it("id 3 (ran) → clean run stage, decoded stdout", () => {
    const m = mapJudge0Result(result({ status: { id: 3 }, stdout: b64("YES\nNO\n") }));
    expect(m?.piston.run?.code).toBe(0);
    expect(m?.piston.run?.stdout).toBe("YES\nNO\n");
  });

  it("id 6 → compile stage → judgeOutcome CE", () => {
    const m = mapJudge0Result(
      result({ status: { id: 6 }, compile_output: b64("error: ';' expected") })
    );
    expect(m).not.toBeNull();
    const o = judgeOutcome(m!.piston, [["YES"]], { compiled: true });
    expect(o.verdict).toBe("compile_error");
  });

  it("id 5 → TLE via SIGKILL", () => {
    const m = mapJudge0Result(result({ status: { id: 5 } }));
    const o = judgeOutcome(m!.piston, [["YES"]]);
    expect(o.verdict).toBe("time_limit_exceeded");
  });

  it("id 11 (runtime error) → RE, forces nonzero code even if exit_code 0", () => {
    const m = mapJudge0Result(
      result({ status: { id: 11 }, stderr: b64("Traceback..."), exit_code: 0 })
    );
    expect(m?.piston.run?.code).not.toBe(0);
    const o = judgeOutcome(m!.piston, [["YES"]]);
    expect(o.verdict).toBe("runtime_error");
  });

  it("clean run → AC/WA decided by compareOutputs", () => {
    const ac = mapJudge0Result(result({ status: { id: 3 }, stdout: b64("YES\n") }));
    expect(judgeOutcome(ac!.piston, [["YES"]]).verdict).toBe("accepted");
    const wa = mapJudge0Result(result({ status: { id: 3 }, stdout: b64("NO\n") }));
    expect(judgeOutcome(wa!.piston, [["YES"]]).verdict).toBe("wrong_answer");
  });

  it("still-processing (id 2) and internal (id 13) → null (hiccup)", () => {
    expect(mapJudge0Result(result({ status: { id: 2 } }))).toBeNull();
    expect(mapJudge0Result(result({ status: { id: 13 } }))).toBeNull();
  });

  it("converts Judge0 seconds to ms", () => {
    const m = mapJudge0Result(result({ status: { id: 3 }, stdout: b64("x"), time: "0.234" }));
    expect(m?.runtimeMs).toBe(234);
  });
});
