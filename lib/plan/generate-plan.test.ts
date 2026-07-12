import { describe, expect, it } from "vitest";
import { generatePlan } from "./generate-plan";
import type { PlanInput, PlanPathway } from "./types";

const pathway: PlanPathway = {
  slug: "test-path",
  title: "Test Path",
  modules: [
    {
      slug: "mod-a",
      title: "Module A",
      topics: [
        { slug: "a1", title: "A1", estMinutes: 60, isCore: true },
        { slug: "a2", title: "A2", estMinutes: 60, isCore: true },
        { slug: "a3-deep", title: "A3 deep", estMinutes: 90, isCore: false },
      ],
    },
    {
      slug: "mod-b",
      title: "Module B",
      topics: [
        { slug: "b1", title: "B1", estMinutes: 120, isCore: true },
        { slug: "b2", title: "B2", estMinutes: 60, isCore: true },
      ],
    },
  ],
};

const base: PlanInput = {
  pathway,
  companyType: "service",
  targetDate: "2026-10-01",
  hoursPerWeek: 6,
  track: "full",
  paceFactor: 1,
  skippedModules: [],
  completedTopicSlugs: [],
  today: "2026-07-06",
};

describe("generatePlan", () => {
  it("is deterministic for identical inputs", () => {
    expect(generatePlan(base)).toEqual(generatePlan(base));
  });

  it("drops skipped modules and explains with the diagnostic score", () => {
    const plan = generatePlan({
      ...base,
      skippedModules: ["mod-a"],
      diagnosticScores: { "mod-a": 85 },
    });
    const slugs = plan.weeks.flatMap((w) =>
      w.items.filter((i) => i.kind === "topic").map((i) => i.slug)
    );
    expect(slugs).toEqual(["b1", "b2"]);
    expect(plan.skipped[0].reason).toBe("tested out · 85%");
    expect(plan.summaryReasons.join(" ")).toContain("Skipped Module A");
  });

  it("core track drops deep-dive topics", () => {
    const plan = generatePlan({ ...base, track: "core" });
    const slugs = plan.weeks.flatMap((w) =>
      w.items.filter((i) => i.kind === "topic").map((i) => i.slug)
    );
    expect(slugs).not.toContain("a3-deep");
    expect(plan.summaryReasons.join(" ")).toContain("deep-dive");
  });

  it("excludes completed topics", () => {
    const plan = generatePlan({ ...base, completedTopicSlugs: ["a1", "a2"] });
    const slugs = plan.weeks.flatMap((w) =>
      w.items.filter((i) => i.kind === "topic").map((i) => i.slug)
    );
    expect(slugs).toEqual(["a3-deep", "b1", "b2"]);
  });

  it("applies the ~15% buffer and pace factor to capacity", () => {
    const plan = generatePlan(base);
    expect(plan.capacityMinutesPerWeek).toBe(Math.round(6 * 60 * 1 * 0.85));
    const fast = generatePlan({ ...base, paceFactor: 1.5 });
    expect(fast.capacityMinutesPerWeek).toBe(Math.round(6 * 60 * 1.5 * 0.85));
  });

  it("clamps pace factor to 0.5–1.5", () => {
    const plan = generatePlan({ ...base, paceFactor: 99 });
    expect(plan.capacityMinutesPerWeek).toBe(Math.round(6 * 60 * 1.5 * 0.85));
  });

  it("never overfills a week beyond capacity (unless a single topic exceeds it)", () => {
    const plan = generatePlan(base);
    for (const week of plan.weeks) {
      const topicItems = week.items.filter((i) => i.kind === "topic");
      if (topicItems.length > 1)
        expect(week.plannedMinutes).toBeLessThanOrEqual(
          plan.capacityMinutesPerWeek
        );
    }
  });

  it("tells the truth when the date doesn't fit and offers three fixes", () => {
    const plan = generatePlan({
      ...base,
      targetDate: "2026-07-13", // one week away, ~6.5 hrs of work
      hoursPerWeek: 2,
    });
    expect(plan.fit.fits).toBe(false);
    if (!plan.fit.fits) {
      expect(plan.fit.options.map((o) => o.kind)).toEqual([
        "add_hours",
        "move_date",
        "switch_core",
      ]);
      for (const option of plan.fit.options)
        expect(option.detail.length).toBeGreaterThan(10);
    }
  });

  it("product-company goals add medium practice volume", () => {
    const service = generatePlan(base);
    const product = generatePlan({ ...base, companyType: "product" });
    const mediums = (p: typeof service) =>
      p.weeks[0].items.find(
        (i) => i.kind === "practice" && i.difficulty === "medium"
      );
    const s = mediums(service);
    const p = mediums(product);
    const sCount = s?.kind === "practice" ? s.count : 0;
    const pCount = p?.kind === "practice" ? p.count : 0;
    expect(pCount).toBeGreaterThan(sCount);
  });

  it("every week and every item carries a non-empty reason", () => {
    const plan = generatePlan(base);
    for (const week of plan.weeks) {
      expect(week.reason.length).toBeGreaterThan(5);
      for (const item of week.items)
        expect(item.reason.length).toBeGreaterThan(5);
    }
  });

  it("injects a revise item after a topic scored under 60%", () => {
    const plan = generatePlan({ ...base, topicQuizScores: { a1: 45 } });
    const revise = plan.weeks
      .flatMap((w) => w.items)
      .find((i) => i.kind === "revise");
    expect(revise).toBeDefined();
    if (revise?.kind === "revise") {
      expect(revise.topicSlug).toBe("a1");
      expect(revise.reason).toMatch(/60%/);
    }
  });

  it("does NOT inject a revise item when the quiz score is 60% or above", () => {
    const plan = generatePlan({ ...base, topicQuizScores: { a1: 75 } });
    const revise = plan.weeks
      .flatMap((w) => w.items)
      .find((i) => i.kind === "revise");
    expect(revise).toBeUndefined();
  });
});
