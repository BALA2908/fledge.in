"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RoadmapModule } from "@/lib/content";

/**
 * Signature moment §2A #2: the roadmap IS the drawn path — a vertical
 * ballpoint spine down a ruled page connecting module nodes, each segment
 * drawing in (scaleY) as it scrolls into view, once. Modules expand to
 * topic lists with disabled checkboxes ("Sign in to track").
 */
export function Roadmap({
  pathwaySlug,
  modules,
  milestones = {},
}: {
  pathwaySlug: string;
  modules: RoadmapModule[];
  /** module slug → handwritten capability note shown once you pass it */
  milestones?: Record<string, string>;
}) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<string | null>(modules[0]?.slug ?? null);

  return (
    <TooltipProvider delayDuration={150}>
      <ol className="relative">
        {modules.map((module, i) => {
          const isOpen = open === module.slug;
          const isLast = i === modules.length - 1;
          return (
            <li key={module.slug} className="relative flex gap-4 sm:gap-6">
              {/* spine column */}
              <div className="relative flex w-6 shrink-0 flex-col items-center sm:w-8">
                {/* node */}
                <motion.span
                  aria-hidden="true"
                  className="z-10 mt-1.5 flex size-6 items-center justify-center rounded-full border-2 border-ballpoint bg-background font-mono text-[10px] font-semibold text-ballpoint sm:size-7 sm:text-[11px]"
                  initial={reduced ? false : { scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {i + 1}
                </motion.span>
                {/* segment to the next node — draws downward on scroll */}
                {!isLast && (
                  <motion.span
                    aria-hidden="true"
                    className="w-0.5 flex-1 origin-top rounded bg-ballpoint/70"
                    initial={reduced ? false : { scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                  />
                )}
              </div>

              {/* module card */}
              <div className={cn("min-w-0 flex-1", !isLast && "pb-8")}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : module.slug)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-start justify-between gap-3 rounded-md text-left"
                >
                  <div>
                    <h3 className="text-lg font-semibold leading-snug group-hover:text-primary sm:text-xl">
                      {module.title}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {module.topics.length} topics
                      {module.est_hours ? ` · ~${module.est_hours} hrs` : ""}
                    </p>
                  </div>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {module.description && (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {module.description}
                  </p>
                )}

                {milestones[module.slug] && (
                  <motion.p
                    initial={reduced ? false : { opacity: 0, x: -6 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.3, ease: "easeOut", delay: 0.35 }}
                    className="mt-3 flex items-center gap-2 font-hand text-lg text-verdict [transform:rotate(-1deg)]"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className="size-4 shrink-0"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 11 l5 5 l9 -12"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>
                      <span className="sr-only">Milestone: </span>
                      {milestones[module.slug]}
                    </span>
                  </motion.p>
                )}

                {isOpen && (
                  <ul className="mt-4 space-y-1 border-l border-rule pl-4">
                    {module.topics.map((topic) => (
                      <li key={topic.slug}>
                        <div className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex" tabIndex={0}>
                                <input
                                  type="checkbox"
                                  disabled
                                  aria-label={`Mark "${topic.title}" done (sign in to track)`}
                                  className="size-4 cursor-not-allowed rounded-sm border-rule accent-[var(--ballpoint)]"
                                />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              Sign in to track
                            </TooltipContent>
                          </Tooltip>
                          <Link
                            href={`/pathways/${pathwaySlug}/${topic.slug}`}
                            className="flex min-w-0 flex-1 items-baseline justify-between gap-3"
                          >
                            <span className="truncate text-sm font-medium group-hover:text-primary">
                              {topic.title}
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              {!topic.is_core && (
                                <Badge
                                  variant="outline"
                                  className="border-rule font-hand text-xs text-muted-foreground"
                                >
                                  deep dive
                                </Badge>
                              )}
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {topic.est_minutes}m
                              </span>
                            </span>
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}

        {/* end of the path */}
        <li className="flex gap-4 sm:gap-6" aria-hidden="true">
          <div className="flex w-6 justify-center sm:w-8">
            <span className="-rotate-3 font-hand text-lg text-verdict">✓</span>
          </div>
          <p className="font-hand text-lg text-muted-foreground">
            interview-ready.
          </p>
        </li>
      </ol>
    </TooltipProvider>
  );
}
