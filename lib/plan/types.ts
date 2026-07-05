/**
 * The plan engine contract (PLAN.md §2C). Phase 3 ships a simple honest
 * implementation behind this interface; Phase 5 upgrades the internals
 * (measured pace EMA, revise items, weekly adaptation) WITHOUT changing
 * these types — everything that consumes a plan builds against this file.
 */

export type CompanyType = "service" | "product";
export type Track = "full" | "core";

export type PlanPathwayTopic = {
  slug: string;
  title: string;
  estMinutes: number;
  isCore: boolean;
};

export type PlanPathwayModule = {
  slug: string;
  title: string;
  topics: PlanPathwayTopic[];
};

export type PlanPathway = {
  slug: string;
  title: string;
  modules: PlanPathwayModule[];
};

export type PlanInput = {
  pathway: PlanPathway;
  goalNote?: string;
  companyType: CompanyType;
  /** ISO date (yyyy-mm-dd) the student wants to be ready by */
  targetDate: string;
  hoursPerWeek: number;
  track: Track;
  /** measured learning speed multiplier, clamped 0.5–1.5; 1.0 until measured */
  paceFactor: number;
  /** module slugs the student tested out of (confirmed skips) */
  skippedModules: string[];
  /** topic slugs already completed */
  completedTopicSlugs: string[];
  /** diagnostic score per module slug (0–100), for reasons like "tested out · 85%" */
  diagnosticScores?: Record<string, number>;
  /** ISO date used as "now" — injectable so tests are deterministic */
  today: string;
};

export type PlanItem =
  | {
      kind: "topic";
      slug: string;
      title: string;
      moduleSlug: string;
      estMinutes: number;
      reason: string;
    }
  | {
      kind: "practice";
      difficulty: "easy" | "medium" | "hard";
      count: number;
      reason: string;
    }
  | { kind: "speaking"; count: number; reason: string };

export type PlanWeek = {
  /** 1-based week number */
  index: number;
  /** ISO date the week starts */
  startDate: string;
  items: PlanItem[];
  plannedMinutes: number;
  /** one plain sentence explaining this week's load */
  reason: string;
};

export type PlanFitOption = {
  kind: "add_hours" | "move_date" | "switch_core";
  /** plain-sentence description with real numbers */
  detail: string;
};

export type PlanFit =
  | { fits: true }
  | { fits: false; weeksNeeded: number; weeksAvailable: number; options: PlanFitOption[] };

export type SkippedModule = {
  moduleSlug: string;
  moduleTitle: string;
  /** e.g. "tested out · 85%" */
  reason: string;
};

export type GeneratedPlan = {
  weeks: PlanWeek[];
  totalWeeks: number;
  totalMinutes: number;
  /** usable minutes per week after pace factor and ~15% buffer */
  capacityMinutesPerWeek: number;
  fit: PlanFit;
  skipped: SkippedModule[];
  /** top-level plain sentences shown on the plan preview */
  summaryReasons: string[];
};
