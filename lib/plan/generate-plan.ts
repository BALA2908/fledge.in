import type {
  GeneratedPlan,
  PlanFit,
  PlanInput,
  PlanItem,
  PlanWeek,
  SkippedModule,
} from "./types";

/**
 * Pure plan generator (PLAN.md §2C) — deterministic, explainable, no I/O.
 * Phase 3 version: honest capacity math + sequential week filling.
 * Phase 5 adds measured-pace adaptation and revise items behind the same
 * signature. Every decision carries a plain-sentence reason by design.
 */

const BUFFER = 0.85; // ~15% of stated hours never really exists
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function generatePlan(input: PlanInput): GeneratedPlan {
  const paceFactor = clamp(input.paceFactor, 0.5, 1.5);
  const capacityMinutesPerWeek = Math.round(
    input.hoursPerWeek * 60 * paceFactor * BUFFER
  );

  // 1. Remaining topics = pathway order − skipped modules − completed −
  //    (core track: deep-dives).
  const skipped: SkippedModule[] = [];
  const droppedDeepDives: string[] = [];
  const remaining: {
    slug: string;
    title: string;
    moduleSlug: string;
    estMinutes: number;
  }[] = [];

  for (const mod of input.pathway.modules) {
    if (input.skippedModules.includes(mod.slug)) {
      const score = input.diagnosticScores?.[mod.slug];
      skipped.push({
        moduleSlug: mod.slug,
        moduleTitle: mod.title,
        reason:
          score !== undefined
            ? `tested out · ${Math.round(score)}%`
            : "you chose to skip it",
      });
      continue;
    }
    for (const topic of mod.topics) {
      if (input.completedTopicSlugs.includes(topic.slug)) continue;
      if (input.track === "core" && !topic.isCore) {
        droppedDeepDives.push(topic.title);
        continue;
      }
      remaining.push({
        slug: topic.slug,
        title: topic.title,
        moduleSlug: mod.slug,
        estMinutes: topic.estMinutes,
      });
    }
  }

  const totalMinutes = remaining.reduce((n, t) => n + t.estMinutes, 0);

  // 2. Fit check with real numbers — never pretend.
  const weeksNeeded = Math.max(
    1,
    Math.ceil(totalMinutes / Math.max(capacityMinutesPerWeek, 1))
  );
  const weeksAvailable = Math.max(
    1,
    Math.floor(
      (new Date(input.targetDate).getTime() - new Date(input.today).getTime()) /
        MS_PER_WEEK
    )
  );

  let fit: PlanFit;
  if (weeksNeeded <= weeksAvailable) {
    fit = { fits: true };
  } else {
    const hoursNeeded = Math.ceil(
      totalMinutes / 60 / (weeksAvailable * paceFactor * BUFFER)
    );
    const dateNeeded = addWeeks(input.today, weeksNeeded);
    const coreMinutes = input.pathway.modules
      .filter((m) => !input.skippedModules.includes(m.slug))
      .flatMap((m) => m.topics)
      .filter(
        (t) => t.isCore && !input.completedTopicSlugs.includes(t.slug)
      )
      .reduce((n, t) => n + t.estMinutes, 0);
    const coreWeeks = Math.ceil(
      coreMinutes / Math.max(capacityMinutesPerWeek, 1)
    );
    fit = {
      fits: false,
      weeksNeeded,
      weeksAvailable,
      options: [
        {
          kind: "add_hours",
          detail: `Give ${hoursNeeded} hrs/week instead of ${input.hoursPerWeek} and the date holds.`,
        },
        {
          kind: "move_date",
          detail: `Keep ${input.hoursPerWeek} hrs/week and move the date to ${dateNeeded}.`,
        },
        ...(input.track === "full"
          ? [
              {
                kind: "switch_core" as const,
                detail: `Switch to the Core track (${coreWeeks} weeks) — deep-dives wait until after the offer.`,
              },
            ]
          : []),
      ],
    };
  }

  // 3. Fill weeks sequentially; practice ramps easy → medium and leans
  //    heavier for product-company goals; 2 speaking sessions a week.
  const weeks: PlanWeek[] = [];
  let cursor = 0;
  let weekIndex = 1;
  while (cursor < remaining.length) {
    const items: PlanItem[] = [];
    let planned = 0;
    while (cursor < remaining.length) {
      const topic = remaining[cursor];
      if (items.length > 0 && planned + topic.estMinutes > capacityMinutesPerWeek)
        break;
      items.push({
        kind: "topic",
        slug: topic.slug,
        title: topic.title,
        moduleSlug: topic.moduleSlug,
        estMinutes: topic.estMinutes,
        reason: `Next in the ${input.pathway.title} order.`,
      });
      planned += topic.estMinutes;
      cursor++;
    }

    const topicCount = items.length;
    const ramp = Math.min(weekIndex, 4);
    const easyCount = Math.max(1, 3 - Math.floor(ramp / 2));
    const mediumCount =
      Math.floor(ramp / 2) + (input.companyType === "product" ? 1 : 0);
    items.push({
      kind: "practice",
      difficulty: "easy",
      count: easyCount,
      reason:
        weekIndex === 1
          ? "Start easy — the first verdicts build the habit."
          : "Keeps the basics warm while difficulty ramps.",
    });
    if (mediumCount > 0)
      items.push({
        kind: "practice",
        difficulty: "medium",
        count: mediumCount,
        reason:
          input.companyType === "product"
            ? "Product-company rounds lean on mediums — extra volume on purpose."
            : "Mediums are where interviews actually live.",
      });
    items.push({
      kind: "speaking",
      count: 2,
      reason: "Two short speaking sessions — the HR round is also a round.",
    });

    weeks.push({
      index: weekIndex,
      startDate: addWeeks(input.today, weekIndex - 1),
      items,
      plannedMinutes: planned,
      reason: `${topicCount} topic${topicCount === 1 ? "" : "s"} this week because you gave ${input.hoursPerWeek} hrs.`,
    });
    weekIndex++;
  }

  // 4. Top-level plain sentences.
  const summaryReasons: string[] = [
    `${remaining.length} topics remain — about ${Math.round(totalMinutes / 60)} hrs of work.`,
    `You gave ${input.hoursPerWeek} hrs/week; after a real-life buffer that's ~${Math.round(capacityMinutesPerWeek / 60)} usable hrs.`,
  ];
  for (const s of skipped)
    summaryReasons.push(`Skipped ${s.moduleTitle} — ${s.reason}.`);
  if (input.track === "core" && droppedDeepDives.length > 0)
    summaryReasons.push(
      `Core track drops ${droppedDeepDives.length} deep-dive topics — they wait until after the offer.`
    );
  if (input.companyType === "product")
    summaryReasons.push(
      "Product-company goal — practice volume leans heavier on DSA mediums."
    );
  summaryReasons.push(
    fit.fits
      ? `${weeksNeeded} weeks of work against ${weeksAvailable} available — the date holds.`
      : `Honestly: ${weeksNeeded} weeks of work but only ${weeksAvailable} until your date. Pick a fix below.`
  );

  return {
    weeks,
    totalWeeks: weeks.length,
    totalMinutes,
    capacityMinutesPerWeek,
    fit,
    skipped,
    summaryReasons,
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function addWeeks(isoDate: string, weeks: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}
