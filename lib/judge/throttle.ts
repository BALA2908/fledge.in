/**
 * In-memory per-key throttle (PLAN.md §3: 5s between runs/submits).
 * Serverless note: this map is per-instance — it's the cheap first gate;
 * /api/submit additionally checks the user's last submissions row.
 */

const lastHit = new Map<string, number>();
const WINDOW_MS = 5000;

export function throttle(key: string): { allowed: boolean; retryAfterS: number } {
  const now = Date.now();
  const last = lastHit.get(key) ?? 0;
  if (now - last < WINDOW_MS) {
    return { allowed: false, retryAfterS: Math.ceil((WINDOW_MS - (now - last)) / 1000) };
  }
  lastHit.set(key, now);
  // Opportunistic cleanup so the map never grows unbounded.
  if (lastHit.size > 5000) {
    for (const [k, t] of lastHit) if (now - t > WINDOW_MS) lastHit.delete(k);
  }
  return { allowed: true, retryAfterS: 0 };
}
