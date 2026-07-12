/**
 * Weekly adaptation (PLAN.md §2C) — pure functions, no I/O.
 *
 * pace_factor is an EMA of (actual completed minutes ÷ planned minutes)
 * per week, clamped 0.5–1.5, persisted on user_plans. It reshapes every
 * future week's capacity. The schedule itself is always re-derived, never
 * stored — so this only ever produces the new pace number + a status.
 */

export type PlanStatus = "on_track" | "behind" | "ahead";

const CLAMP_LO = 0.5;
const CLAMP_HI = 1.5;
const ALPHA = 0.4; // EMA weight on the most recent week

function clamp(n: number, lo = CLAMP_LO, hi = CLAMP_HI) {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Fold one week's result into the running pace factor.
 * ratio = actual / planned (how much of the plan actually got done).
 */
export function updatePaceFactor(
  previous: number,
  actualMinutes: number,
  plannedMinutes: number
): number {
  if (plannedMinutes <= 0) return clamp(previous);
  const ratio = actualMinutes / plannedMinutes;
  const next = ALPHA * ratio + (1 - ALPHA) * previous;
  return clamp(Math.round(next * 100) / 100);
}

/**
 * Status for the current week: did the student keep up with the planned
 * load? Tolerance band of ±15% around "exactly on plan".
 */
export function weekStatus(
  actualMinutes: number,
  plannedMinutes: number
): PlanStatus {
  if (plannedMinutes <= 0) return "on_track";
  const ratio = actualMinutes / plannedMinutes;
  if (ratio < 0.85) return "behind";
  if (ratio > 1.15) return "ahead";
  return "on_track";
}

/**
 * Derive pace factor from cumulative work vs what a pace-1.0 student would
 * have done by now — fully derived (§2C: never stored). Used on dashboard
 * load so "behind for a week" automatically lightens future weeks.
 *   baselineCapacity = the pace-1.0 usable minutes/week (hours*60*0.85).
 * Before a full week has elapsed there's no signal, so we return 1.0.
 */
export function derivePaceFactor(
  actualMinutesAllTime: number,
  baselineCapacityPerWeek: number,
  weeksElapsed: number
): number {
  if (weeksElapsed < 1 || baselineCapacityPerWeek <= 0) return 1.0;
  const expected = baselineCapacityPerWeek * weeksElapsed;
  return clamp(Math.round((actualMinutesAllTime / expected) * 100) / 100);
}

/** One plain sentence describing what the pace change means. */
export function paceReason(
  status: PlanStatus,
  paceFactor: number
): string {
  const pct = Math.round(paceFactor * 100);
  switch (status) {
    case "behind":
      return `Last week ran short, so next week is lighter (pace ${pct}%). Better to finish a smaller week than skip a bigger one.`;
    case "ahead":
      return `You beat the plan — next week pulls a bit more forward (pace ${pct}%).`;
    default:
      return `Right on plan (pace ${pct}%). Keep the rhythm.`;
  }
}
