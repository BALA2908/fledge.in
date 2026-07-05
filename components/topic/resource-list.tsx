"use client";

import { useState } from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  GraduationCap,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopicResource } from "@/lib/content";

const LANGS = [
  { value: "all", label: "All" },
  { value: "english", label: "English" },
  { value: "tamil", label: "தமிழ்" },
  { value: "hindi", label: "हिन्दी" },
] as const;

const TYPE_ICONS = {
  video: PlayCircle,
  doc: FileText,
  article: BookOpen,
  course: GraduationCap,
} as const;

export function ResourceList({ resources }: { resources: TopicResource[] }) {
  const [lang, setLang] = useState<(typeof LANGS)[number]["value"]>("all");

  const visible =
    lang === "all" ? resources : resources.filter((r) => r.language === lang);

  return (
    <div>
      <div
        role="group"
        aria-label="Filter resources by language"
        className="flex flex-wrap gap-2"
      >
        {LANGS.map((l) => {
          const active = lang === l.value;
          const count =
            l.value === "all"
              ? resources.length
              : resources.filter((r) => r.language === l.value).length;
          if (l.value !== "all" && count === 0) return null;
          return (
            <button
              key={l.value}
              type="button"
              onClick={() => setLang(l.value)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                active
                  ? "border-ballpoint bg-accent text-accent-foreground"
                  : "border-rule text-muted-foreground hover:border-ballpoint/50 hover:text-foreground"
              )}
            >
              {l.label}
              <span className="ml-1.5 font-mono text-[11px] opacity-70">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Nothing in this language for this topic yet — switch back to All for
          now.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {visible.map((r) => {
            const Icon = TYPE_ICONS[r.type];
            const linked = r.url !== "TODO";
            const inner = (
              <>
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 size-5 shrink-0",
                    linked ? "text-ballpoint" : "text-muted-foreground"
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-medium leading-snug",
                      linked && "group-hover:text-primary"
                    )}
                  >
                    {r.title}
                    {linked && (
                      <ExternalLink
                        aria-hidden="true"
                        className="ml-1.5 inline size-3.5 align-[-2px] text-muted-foreground"
                      />
                    )}
                  </span>
                  <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                    {r.source && <>{r.source} · </>}
                    {r.language}
                    {r.minutes ? <> · {r.minutes} min</> : null}
                    {r.depth === "deep" && <> · deep dive</>}
                    {!linked && (
                      <span className="text-margin"> · link on its way</span>
                    )}
                  </span>
                </span>
              </>
            );

            return (
              <li key={r.id}>
                {linked ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-md border border-rule bg-card p-3 transition-colors hover:border-ballpoint/50"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="flex items-start gap-3 rounded-md border border-dashed border-rule p-3 opacity-80">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
