"use client";

import Link from "next/link";
import { BookOpen, Code2, Mic, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PlanWeek } from "@/lib/plan/types";
import { cn } from "@/lib/utils";

/**
 * "This week for you" — the derived week[0] as a checklist. Each item
 * links where the work happens and carries its reason on hover/tap. A
 * progress ring shows how much of this week's learning is ticked off.
 */
export function WeekChecklist({
  week,
  pathwaySlug,
  completedTopicSlugs,
}: {
  week: PlanWeek;
  pathwaySlug: string;
  completedTopicSlugs: string[];
}) {
  const done = new Set(completedTopicSlugs);
  const topicItems = week.items.filter((i) => i.kind === "topic");
  const doneCount = topicItems.filter(
    (i) => i.kind === "topic" && done.has(i.slug)
  ).length;
  const ringPct =
    topicItems.length > 0 ? Math.round((doneCount / topicItems.length) * 100) : 0;

  return (
    <TooltipProvider delayDuration={150}>
      <section className="rounded-lg border border-rule bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">This week for you</h2>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {week.reason}
            </p>
          </div>
          <ProgressRing pct={ringPct} label={`${doneCount}/${topicItems.length}`} />
        </div>

        <ul className="mt-4 space-y-2">
          {week.items.map((item, i) => {
            const isDoneTopic = item.kind === "topic" && done.has(item.slug);
            return (
              <li key={i}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-md border border-rule p-3 text-sm",
                        isDoneTopic && "opacity-60"
                      )}
                    >
                      <ItemIcon kind={item.kind} />
                      <span className="min-w-0 flex-1">
                        <ItemBody item={item} pathwaySlug={pathwaySlug} isDone={isDoneTopic} />
                      </span>
                      {item.kind === "topic" && (
                        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                          ~{item.estMinutes}m
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    {item.reason}
                  </TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </section>
    </TooltipProvider>
  );
}

function ItemIcon({ kind }: { kind: string }) {
  const cls = "size-4 shrink-0 text-ballpoint";
  if (kind === "practice") return <Code2 className={cls} aria-hidden="true" />;
  if (kind === "speaking") return <Mic className={cls} aria-hidden="true" />;
  if (kind === "revise") return <RefreshCw className={cls} aria-hidden="true" />;
  return <BookOpen className={cls} aria-hidden="true" />;
}

function ItemBody({
  item,
  pathwaySlug,
  isDone,
}: {
  item: PlanWeek["items"][number];
  pathwaySlug: string;
  isDone: boolean;
}) {
  if (item.kind === "topic")
    return (
      <Link
        href={`/pathways/${pathwaySlug}/${item.slug}`}
        className={cn("font-medium hover:text-primary", isDone && "line-through")}
      >
        {item.title}
      </Link>
    );
  if (item.kind === "revise")
    return (
      <Link
        href={`/pathways/${pathwaySlug}/${item.topicSlug}`}
        className="font-medium text-margin hover:underline"
      >
        Revise {item.topicTitle}
      </Link>
    );
  if (item.kind === "practice")
    return (
      <Link href="/problems" className="font-medium hover:text-primary">
        {item.count} {item.difficulty} problem{item.count > 1 ? "s" : ""}
      </Link>
    );
  return (
    <Link href="/speak" className="font-medium hover:text-primary">
      {item.count} speaking sessions
    </Link>
  );
}

function ProgressRing({ pct, label }: { pct: number; label: string }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--rule)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="var(--verdict)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-semibold">
        {label}
      </span>
    </div>
  );
}
