"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleDashed, CircleDot, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { useUser } from "@/components/auth/use-user";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ProblemListItem } from "@/lib/content";

const DIFFICULTIES = ["all", "easy", "medium", "hard"] as const;

type Status = "solved" | "attempted";

export function ProblemsExplorer({
  problems,
  pathways,
}: {
  problems: ProblemListItem[];
  pathways: { slug: string; title: string }[];
}) {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] =
    useState<(typeof DIFFICULTIES)[number]>("all");
  const [pathway, setPathway] = useState<string>("all");
  const [tag, setTag] = useState<string>("all");
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  // Real solved/attempted status once signed in (RLS: own rows only).
  useEffect(() => {
    if (!user) {
      setStatuses({});
      return;
    }
    const supabase = createClient();
    supabase
      .from("submissions")
      .select("problem_id, verdict")
      .then(({ data }) => {
        const next: Record<string, Status> = {};
        for (const row of data ?? []) {
          if (row.verdict === "accepted") next[row.problem_id] = "solved";
          else if (!next[row.problem_id]) next[row.problem_id] = "attempted";
        }
        setStatuses(next);
      });
  }, [user]);

  const allTags = useMemo(
    () => [...new Set(problems.flatMap((p) => p.tags))].sort(),
    [problems]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems.filter((p) => {
      if (difficulty !== "all" && p.difficulty !== difficulty) return false;
      if (pathway !== "all" && !p.pathway_slugs.includes(pathway)) return false;
      if (tag !== "all" && !p.tags.includes(tag)) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.tags.some((t) => t.includes(q)))
        return false;
      return true;
    });
  }, [problems, query, difficulty, pathway, tag]);

  const filtersActive =
    query.trim() !== "" || difficulty !== "all" || pathway !== "all" || tag !== "all";

  function resetFilters() {
    setQuery("");
    setDifficulty("all");
    setPathway("all");
    setTag("all");
  }

  return (
    <div>
      {/* controls */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or tag…"
            aria-label="Search problems"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Filter by difficulty" className="flex gap-1.5">
            {DIFFICULTIES.map((d) => {
              const count =
                d === "all"
                  ? problems.length
                  : problems.filter((p) => p.difficulty === d).length;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  aria-pressed={difficulty === d}
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-xs transition-colors",
                    difficulty === d
                      ? "border-ballpoint bg-accent text-accent-foreground"
                      : "border-rule text-muted-foreground hover:border-ballpoint/50"
                  )}
                >
                  {d} <span className="opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
          <select
            value={pathway}
            onChange={(e) => setPathway(e.target.value)}
            aria-label="Filter by pathway"
            className="h-8 rounded-md border border-rule bg-background px-2 text-xs"
          >
            <option value="all">All pathways</option>
            {pathways.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            aria-label="Filter by tag"
            className="h-8 rounded-md border border-rule bg-background px-2 text-xs"
          >
            <option value="all">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full px-3 py-1 font-mono text-xs text-margin underline-offset-4 transition-colors hover:underline"
            >
              ✕ reset filters
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 font-mono text-xs text-muted-foreground" aria-live="polite">
        {visible.length} of {problems.length} problems
      </p>

      {/* list */}
      {visible.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-rule p-10 text-center">
          <p className="font-hand text-2xl text-muted-foreground">
            nothing matches that —
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            The problem you want is in here somewhere.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-md border border-ballpoint/40 px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-ballpoint hover:bg-accent"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-rule rounded-lg border border-rule bg-card">
          {visible.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/problems/${p.slug}`}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
              >
                {statuses[p.id] === "solved" ? (
                  <CheckCircle2
                    aria-label="Solved"
                    className="size-4 shrink-0 text-verdict"
                  />
                ) : statuses[p.id] === "attempted" ? (
                  <CircleDot
                    aria-label="Attempted"
                    className="size-4 shrink-0 text-ballpoint"
                  />
                ) : (
                  <CircleDashed
                    aria-hidden="true"
                    className="size-4 shrink-0 text-rule"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium group-hover:text-primary">
                    {p.title}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">
                    {p.tags.join(" · ")}
                  </span>
                </span>
                <DifficultyBadge difficulty={p.difficulty} className="shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
