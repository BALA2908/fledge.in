"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { DashboardStats } from "@/lib/progress";

const DIFF_COLORS: Record<string, string> = {
  easy: "var(--verdict)",
  medium: "var(--ballpoint)",
  hard: "var(--margin)",
};

/** Solved-by-difficulty donut. Empty state handled by the caller. */
export function SolvedDonut({
  solved,
}: {
  solved: DashboardStats["solvedByDifficulty"];
}) {
  const data = (["easy", "medium", "hard"] as const)
    .map((d) => ({ name: d, value: solved[d] }))
    .filter((d) => d.value > 0);
  const total = data.reduce((n, d) => n + d.value, 0);

  if (total === 0)
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="font-hand text-xl text-muted-foreground">
          your first solve draws this in —
        </p>
      </div>
    );

  return (
    <div className="relative h-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={48}
            outerRadius={68}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={DIFF_COLORS[d.name]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold">{total}</span>
        <span className="text-[11px] text-muted-foreground">solved</span>
      </div>
    </div>
  );
}

/** 26-week contribution heatmap (7 rows × 26 cols), oldest → newest. */
export function ActivityHeatmap({
  heatmap,
}: {
  heatmap: DashboardStats["heatmap"];
}) {
  const max = Math.max(1, ...heatmap.map((d) => d.count));
  const level = (c: number) => {
    if (c === 0) return 0;
    const r = c / max;
    if (r > 0.66) return 3;
    if (r > 0.33) return 2;
    return 1;
  };
  const shades = [
    "bg-secondary",
    "bg-verdict/30",
    "bg-verdict/60",
    "bg-verdict",
  ];

  // Chunk into weeks (columns of 7).
  const weeks: { day: string; count: number }[][] = [];
  for (let i = 0; i < heatmap.length; i += 7) weeks.push(heatmap.slice(i, i + 7));

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((d) => (
              <div
                key={d.day}
                title={`${d.day}: ${d.count} action${d.count === 1 ? "" : "s"}`}
                className={`size-[10px] rounded-[2px] ${shades[level(d.count)]}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
