import { describe, expect, it } from "vitest";
import { derivePaceFactor, paceReason, updatePaceFactor, weekStatus } from "./adapt";

describe("updatePaceFactor", () => {
  it("speeds up when the student beats the plan", () => {
    // did 150% of plan; EMA nudges pace above 1.0
    expect(updatePaceFactor(1.0, 900, 600)).toBeGreaterThan(1.0);
  });

  it("slows down when the student falls short", () => {
    expect(updatePaceFactor(1.0, 300, 600)).toBeLessThan(1.0);
  });

  it("clamps to the 0.5–1.5 band", () => {
    // wildly over — never exceeds 1.5
    expect(updatePaceFactor(1.5, 6000, 600)).toBeLessThanOrEqual(1.5);
    // did nothing for several weeks — never below 0.5
    let pace = 1.0;
    for (let i = 0; i < 20; i++) pace = updatePaceFactor(pace, 0, 600);
    expect(pace).toBeGreaterThanOrEqual(0.5);
  });

  it("holds steady when actual equals planned", () => {
    expect(updatePaceFactor(1.0, 600, 600)).toBe(1.0);
  });

  it("ignores a zero-planned week (no data)", () => {
    expect(updatePaceFactor(1.2, 0, 0)).toBe(1.2);
  });

  it("converges toward a sustained pace over several weeks", () => {
    let pace = 1.0;
    for (let i = 0; i < 8; i++) pace = updatePaceFactor(pace, 420, 600); // 70%
    expect(pace).toBeGreaterThan(0.69);
    expect(pace).toBeLessThan(0.78);
  });
});

describe("derivePaceFactor", () => {
  it("returns 1.0 before a full week has elapsed (no signal)", () => {
    expect(derivePaceFactor(300, 300, 0)).toBe(1.0);
  });
  it("reads below 1.0 when the student is behind expected work", () => {
    // 2 weeks in, 300/wk expected = 600; only did 300 → 0.5
    expect(derivePaceFactor(300, 300, 2)).toBeLessThan(1.0);
  });
  it("reads above 1.0 when ahead, clamped to 1.5", () => {
    expect(derivePaceFactor(3000, 300, 2)).toBe(1.5);
  });
  it("~1.0 when actual tracks expected", () => {
    expect(derivePaceFactor(600, 300, 2)).toBe(1.0);
  });
});

describe("weekStatus", () => {
  it("flags behind under 85% of plan", () => {
    expect(weekStatus(400, 600)).toBe("behind");
  });
  it("flags ahead over 115% of plan", () => {
    expect(weekStatus(800, 600)).toBe("ahead");
  });
  it("on track within the tolerance band", () => {
    expect(weekStatus(560, 600)).toBe("on_track");
    expect(weekStatus(660, 600)).toBe("on_track");
  });
});

describe("paceReason", () => {
  it("gives an honest, forward-looking sentence per status", () => {
    expect(paceReason("behind", 0.8)).toMatch(/lighter/i);
    expect(paceReason("ahead", 1.2)).toMatch(/forward/i);
    expect(paceReason("on_track", 1.0)).toMatch(/rhythm/i);
  });
});
