"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { PlanFitOption } from "@/lib/plan/types";
import type { PlanStatus } from "@/lib/plan/adapt";

/**
 * Behind / ahead banner (§2C weekly adaptation). Each one-tap fix says
 * exactly what it will do before you apply it; applying writes the new
 * input to user_plans and the plan regenerates on the next load.
 */
export function AdjustPlanBanner({
  status,
  reason,
  pathwaySlug,
  options,
}: {
  status: PlanStatus;
  reason: string;
  pathwaySlug: string;
  options: PlanFitOption[];
}) {
  const router = useRouter();
  const [applying, setApplying] = useState<string | null>(null);

  if (status === "on_track" && options.length === 0) return null;

  async function apply(option: PlanFitOption) {
    setApplying(option.kind);
    const supabase = createClient();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (option.kind === "add_hours") {
      const m = option.detail.match(/Give (\d+) hrs/);
      if (m) patch.hours_per_week = Number(m[1]);
    } else if (option.kind === "move_date") {
      const m = option.detail.match(/(\d{4}-\d{2}-\d{2})/);
      if (m) patch.target_date = m[1];
    } else if (option.kind === "switch_core") {
      patch.track = "core";
    }
    await supabase.from("user_plans").update(patch).eq("pathway_slug", pathwaySlug);
    router.refresh();
  }

  const tone =
    status === "behind"
      ? "border-margin/40 bg-margin/5"
      : status === "ahead"
        ? "border-verdict/40 bg-verdict/5"
        : "border-rule";

  return (
    <section className={cn("rounded-lg border p-4", tone)}>
      <p className="text-sm font-medium">{reason}</p>
      {options.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {options.map((option) => (
            <button
              key={option.kind}
              type="button"
              disabled={applying !== null}
              onClick={() => apply(option)}
              className="rounded-md border border-rule bg-card p-2.5 text-left text-xs transition-colors hover:border-ballpoint/50 disabled:opacity-60"
            >
              {applying === option.kind ? "Applying…" : option.detail}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
