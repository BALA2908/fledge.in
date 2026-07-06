"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { AnimatePresence } from "framer-motion";
import { Loader2, Lock, Play, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/components/auth/use-user";
import { createClient } from "@/lib/supabase/client";
import { LANGUAGES, type LanguageKey } from "@/lib/judge/languages";
import type { Verdict } from "@/lib/judge/verdict";
import { AcceptedStamp } from "./accepted-stamp";
import { VerdictBadge } from "./verdict-badge";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-code-surface font-mono text-xs text-[#9aa1b5]">
      loading the editor…
    </div>
  ),
});

type RunCase = {
  index: number;
  pass: boolean;
  input: string;
  expected: string;
  mismatchLine: number | null;
  got: string | null;
  expectedLine: string | null;
};

type RunResponse = {
  verdict: Verdict;
  detail: string | null;
  cases: RunCase[];
  error?: string;
};

type SubmitResponse = {
  verdict: Verdict;
  passed: number;
  total: number;
  firstAcForProblem: boolean;
  firstAcEver: boolean;
  detail: string | null;
  failedCase:
    | { index: number; hidden: true }
    | {
        index: number;
        input: string;
        expected: string;
        gotLine: string | null;
        expectedLine: string | null;
      }
    | null;
  error?: string;
};

type SubmissionRow = {
  id: string;
  language: string;
  verdict: Verdict;
  passed: number;
  total: number;
  created_at: string;
};

// Drafts survive tab switches within the session (PLAN.md: in memory).
const drafts = new Map<string, string>();

export function ProblemWorkspace({
  problem,
  description,
}: {
  problem: {
    id: string;
    slug: string;
    title: string;
    starter_code: Record<string, string> | null;
    hints: string[];
    time_limit_ms: number;
  };
  description: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const { user } = useUser();

  const [language, setLanguage] = useState<LanguageKey>("python");
  const [code, setCode] = useState(
    () =>
      drafts.get(`${problem.slug}:python`) ??
      problem.starter_code?.python ??
      ""
  );
  const [pending, setPending] = useState<"run" | "submit" | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStamp, setShowStamp] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);
  const [submissions, setSubmissions] = useState<SubmissionRow[] | null>(null);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function switchLanguage(next: LanguageKey) {
    drafts.set(`${problem.slug}:${language}`, code);
    setLanguage(next);
    setCode(
      drafts.get(`${problem.slug}:${next}`) ??
        problem.starter_code?.[next] ??
        ""
    );
  }

  function startCooldown() {
    setCooldown(5);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1 && cooldownTimer.current) clearInterval(cooldownTimer.current);
        return Math.max(0, s - 1);
      });
    }, 1000);
  }
  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  async function call(kind: "run" | "submit") {
    setPending(kind);
    setError(null);
    if (kind === "run") setRunResult(null);
    else setSubmitResult(null);
    try {
      const res = await fetch(`/api/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: problem.slug, language, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went sideways. Try again.");
        return;
      }
      if (kind === "run") setRunResult(data as RunResponse);
      else {
        const submit = data as SubmitResponse;
        setSubmitResult(submit);
        setSubmissions(null); // refetch on next tab open
        if (submit.firstAcEver) setShowStamp(true);
      }
    } catch {
      setError("Network hiccup — check your connection and retry.");
    } finally {
      setPending(null);
      startCooldown();
    }
  }

  async function loadSubmissions() {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("submissions")
      .select("id, language, verdict, passed, total, created_at")
      .eq("problem_id", problem.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setSubmissions((data ?? []) as SubmissionRow[]);
  }

  const busy = pending !== null;
  const blocked = busy || cooldown > 0;

  return (
    <div className="grid gap-4 lg:h-[calc(100dvh-8.5rem)] lg:grid-cols-2">
      <AnimatePresence>
        {showStamp && <AcceptedStamp onDone={() => setShowStamp(false)} />}
      </AnimatePresence>

      {/* ── Left: description / submissions / hints ─────────────────── */}
      <Tabs
        defaultValue="description"
        className="min-h-0 rounded-lg border border-rule bg-card lg:overflow-hidden"
      >
        <TabsList className="w-full justify-start rounded-none border-b border-rule bg-transparent px-2">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="submissions" onClick={loadSubmissions}>
            Submissions
          </TabsTrigger>
          <TabsTrigger value="hints">Hints</TabsTrigger>
        </TabsList>

        <TabsContent
          value="description"
          className="max-h-[50dvh] overflow-y-auto p-4 sm:p-5 lg:max-h-none lg:h-[calc(100%-2.75rem)]"
        >
          {description}
        </TabsContent>

        <TabsContent
          value="submissions"
          className="max-h-[50dvh] overflow-y-auto p-4 sm:p-5 lg:max-h-none lg:h-[calc(100%-2.75rem)]"
        >
          {!user ? (
            <p className="text-sm text-muted-foreground">
              Sign in to keep a record of your attempts.
            </p>
          ) : submissions === null ? (
            <p className="font-mono text-xs text-muted-foreground">loading…</p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No attempts yet. First one counts double — it breaks the ice.
            </p>
          ) : (
            <ul className="space-y-2">
              {submissions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-rule p-2.5 text-sm"
                >
                  <VerdictBadge verdict={s.verdict} />
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.passed}/{s.total} · {LANGUAGES[s.language as LanguageKey]?.label ?? s.language} ·{" "}
                    {new Date(s.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent
          value="hints"
          className="max-h-[50dvh] overflow-y-auto p-4 sm:p-5 lg:max-h-none lg:h-[calc(100%-2.75rem)]"
        >
          {problem.hints.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hints on this one — trust the constraints.
            </p>
          ) : (
            <div className="space-y-3">
              {problem.hints.slice(0, revealedHints).map((hint, i) => (
                <div key={i} className="rounded-md border border-rule p-3">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    hint {i + 1}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{hint}</p>
                </div>
              ))}
              {revealedHints < problem.hints.length && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRevealedHints((n) => n + 1)}
                >
                  {revealedHints === 0
                    ? "Reveal a hint — no shame in it"
                    : "Reveal the next hint"}
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Right: editor + actions + results ───────────────────────── */}
      <div className="flex min-h-[70dvh] flex-col gap-3 lg:min-h-0">
        <div className="flex items-center justify-between gap-2">
          <select
            value={language}
            onChange={(e) => switchLanguage(e.target.value as LanguageKey)}
            aria-label="Language"
            className="h-8 rounded-md border border-rule bg-background px-2 font-mono text-xs"
          >
            {Object.entries(LANGUAGES).map(([key, l]) => (
              <option key={key} value={key}>
                {l.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={blocked}
              onClick={() => call("run")}
            >
              {pending === "run" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="size-4" aria-hidden="true" />
              )}
              Run samples{cooldown > 0 && !busy ? ` (${cooldown})` : ""}
            </Button>
            <Button size="sm" disabled={blocked || !user} onClick={() => call("submit")}>
              {pending === "submit" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : !user ? (
                <Lock className="size-4" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
              Submit{cooldown > 0 && !busy ? ` (${cooldown})` : ""}
            </Button>
          </div>
        </div>
        {!user && (
          <p className="-mt-1 text-right font-mono text-[11px] text-muted-foreground">
            runs work as a guest · sign in to submit
          </p>
        )}

        <div className="min-h-[38dvh] flex-1 overflow-hidden rounded-lg border border-rule">
          <MonacoEditor
            language={LANGUAGES[language].monaco}
            value={code}
            onChange={(v) => {
              setCode(v ?? "");
              drafts.set(`${problem.slug}:${language}`, v ?? "");
            }}
            theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
            options={{
              fontSize: 13,
              fontFamily: "var(--font-jetbrains), monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              tabSize: 4,
              automaticLayout: true,
            }}
          />
        </div>

        {/* results */}
        <div aria-live="polite">
          {error && (
            <p className="rounded-md border border-margin/40 bg-margin/5 p-3 text-sm text-margin">
              {error}
            </p>
          )}

          {submitResult && !error && (
            <div className="rounded-lg border border-rule bg-card p-3">
              <div className="flex flex-wrap items-center gap-3">
                <VerdictBadge verdict={submitResult.verdict} />
                <span className="font-mono text-xs text-muted-foreground">
                  {submitResult.passed}/{submitResult.total} tests
                </span>
                {submitResult.verdict === "accepted" &&
                  submitResult.firstAcForProblem &&
                  !submitResult.firstAcEver && (
                    <span className="font-hand text-lg text-verdict">
                      one more off the list —
                    </span>
                  )}
              </div>
              {submitResult.detail && (
                <pre className="mt-2 overflow-x-auto rounded bg-code-surface p-2.5 font-mono text-[11px] leading-relaxed text-[#ff9b9b]">
                  {submitResult.detail}
                </pre>
              )}
              {submitResult.failedCase && "hidden" in submitResult.failedCase && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Samples passed, hidden test #
                  {submitResult.failedCase.index + 1} didn&apos;t — think about
                  edge cases and the max constraints.
                </p>
              )}
              {submitResult.failedCase &&
                !("hidden" in submitResult.failedCase) && (
                  <CaseDiff
                    label={`sample ${submitResult.failedCase.index + 1}`}
                    input={submitResult.failedCase.input}
                    expectedLine={submitResult.failedCase.expectedLine}
                    gotLine={submitResult.failedCase.gotLine}
                  />
                )}
            </div>
          )}

          {runResult && !submitResult && !error && (
            <div className="rounded-lg border border-rule bg-card p-3">
              <div className="flex flex-wrap items-center gap-2">
                <VerdictBadge verdict={runResult.verdict} />
                <span className="font-mono text-xs text-muted-foreground">
                  sample tests only — submit runs the real ones
                </span>
              </div>
              {runResult.detail && (
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-code-surface p-2.5 font-mono text-[11px] leading-relaxed text-[#ff9b9b]">
                  {runResult.detail}
                </pre>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {runResult.cases.map((c) => (
                  <span
                    key={c.index}
                    className={cn(
                      "rounded border px-2 py-0.5 font-mono text-[11px]",
                      c.pass
                        ? "border-verdict/50 text-verdict"
                        : "border-margin/50 text-margin"
                    )}
                  >
                    #{c.index + 1} {c.pass ? "✓" : "✗"}
                  </span>
                ))}
              </div>
              {runResult.cases
                .filter((c) => !c.pass && c.expectedLine !== null)
                .slice(0, 1)
                .map((c) => (
                  <CaseDiff
                    key={c.index}
                    label={`sample ${c.index + 1}`}
                    input={c.input}
                    expectedLine={c.expectedLine}
                    gotLine={c.got}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CaseDiff({
  label,
  input,
  expectedLine,
  gotLine,
}: {
  label: string;
  input: string;
  expectedLine: string | null;
  gotLine: string | null;
}) {
  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-3">
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label} input
        </p>
        <pre className="max-h-28 overflow-auto rounded bg-code-surface p-2 font-mono text-[11px] text-[#e8eaf2]">
          {input}
        </pre>
      </div>
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          expected
        </p>
        <pre className="max-h-28 overflow-auto rounded bg-code-surface p-2 font-mono text-[11px] text-[#7dde9c]">
          {expectedLine ?? ""}
        </pre>
      </div>
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          your output
        </p>
        <pre className="max-h-28 overflow-auto rounded bg-code-surface p-2 font-mono text-[11px] text-[#ff9b9b]">
          {gotLine ?? "(nothing)"}
        </pre>
      </div>
    </div>
  );
}
