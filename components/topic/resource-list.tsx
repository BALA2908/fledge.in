"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  GraduationCap,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopicResource } from "@/lib/content";

const TYPE_ICONS = {
  video: PlayCircle,
  doc: FileText,
  article: BookOpen,
  course: GraduationCap,
} as const;

const BRIDGE_LANGS = [
  { value: "tamil", label: "தமிழ்" },
  { value: "hindi", label: "हिन्दी" },
] as const;

/**
 * English-first (July 2026 decision): English resources lead and are the
 * default. Tamil/Hindi links stay as a quiet fallback behind a
 * "prefer your mother tongue?" toggle — demoted, never deleted.
 */
export function ResourceList({ resources }: { resources: TopicResource[] }) {
  const english = useMemo(
    () => resources.filter((r) => r.language === "english"),
    [resources]
  );
  const bridge = useMemo(
    () => resources.filter((r) => r.language !== "english"),
    [resources]
  );

  // If a topic has no English resource yet, don't hide everything.
  const [showBridge, setShowBridge] = useState(english.length === 0);
  const [bridgeLang, setBridgeLang] = useState<"all" | "tamil" | "hindi">("all");

  const visibleBridge =
    bridgeLang === "all" ? bridge : bridge.filter((r) => r.language === bridgeLang);

  return (
    <div>
      {english.length > 0 ? (
        <ResourceItems resources={english} />
      ) : (
        <p className="text-sm text-muted-foreground">
          English resources for this topic are on their way.
        </p>
      )}

      {bridge.length > 0 && (
        <div className="mt-5">
          {!showBridge ? (
            <button
              type="button"
              onClick={() => setShowBridge(true)}
              className="font-hand text-lg text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              prefer your mother tongue? →
            </button>
          ) : (
            <div className="rounded-md border border-dashed border-rule p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="mr-1 text-xs text-muted-foreground">
                  Use these to get unstuck — then come back to the English one.
                  The interview will be in English.
                </p>
                {BRIDGE_LANGS.map((l) => {
                  const count = bridge.filter((r) => r.language === l.value).length;
                  if (count === 0) return null;
                  const active = bridgeLang === l.value;
                  return (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() =>
                        setBridgeLang(active ? "all" : l.value)
                      }
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
              <div className="mt-3">
                <ResourceItems resources={visibleBridge} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResourceItems({ resources }: { resources: TopicResource[] }) {
  return (
    <ul className="space-y-3">
      {resources.map((r) => {
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
  );
}
