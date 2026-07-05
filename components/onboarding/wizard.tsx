"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { generatePlan } from "@/lib/plan/generate-plan";
import type { CompanyType, PlanInput, Track } from "@/lib/plan/types";
import type { DiagnosticMcq, PathwayDetail } from "@/lib/content";

type Props = {
  pathways: PathwayDetail[];
  diagnostics: Record<string, DiagnosticMcq[]>;
};

type FormatPref = "video_first" | "reading_first" | "mixed";

const STEPS = ["Path", "Goal", "About you", "What you know", "Your plan"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function plusWeeks(weeks: number) {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function OnboardingWizard({ pathways, diagnostics }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // step 1
  const [pathwaySlug, setPathwaySlug] = useState<string>("");
  // step 2
  const [goalNote, setGoalNote] = useState("");
  const [companyType, setCompanyType] = useState<CompanyType>("service");
  const [targetDate, setTargetDate] = useState(plusWeeks(16));
  const [hoursPerWeek, setHoursPerWeek] = useState(6);
  const [formatPref, setFormatPref] = useState<FormatPref>("mixed");
  // step 3
  const [langs, setLangs] = useState<string[]>(["english"]);
  const [college, setCollege] = useState("");
  const [gradYear, setGradYear] = useState<number | "">("");
  // step 4
  const [diagMode, setDiagMode] = useState<"undecided" | "quiz" | "zero">(
    "undecided"
  );
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizModuleIndex, setQuizModuleIndex] = useState(0);
  const [confirmedSkips, setConfirmedSkips] = useState<string[]>([]);
  // step 5
  const [track, setTrack] = useState<Track>("full");

  const pathway = pathways.find((p) => p.slug === pathwaySlug);

  // Diagnostic questions grouped by module, in pathway order.
  const quizModules = useMemo(() => {
    if (!pathway) return [];
    const byModule = new Map<string, DiagnosticMcq[]>();
    for (const q of diagnostics[pathway.slug] ?? []) {
      byModule.set(q.module_slug, [
        ...(byModule.get(q.module_slug) ?? []),
        q,
      ]);
    }
    return pathway.modules
      .filter((m) => byModule.has(m.slug))
      .map((m) => ({ module: m, questions: byModule.get(m.slug)! }));
  }, [pathway, diagnostics]);

  const moduleScores = useMemo(() => {
    const scores: Record<string, number> = {};
    for (const { module: mod, questions } of quizModules) {
      const answered = questions.filter((q) => answers[q.slug] !== undefined);
      if (answered.length < questions.length) continue;
      const correct = questions.filter(
        (q) => answers[q.slug] === q.mcq.correct_index
      ).length;
      scores[mod.slug] = Math.round((correct / questions.length) * 100);
    }
    return scores;
  }, [quizModules, answers]);

  const suggestedSkips = useMemo(
    () =>
      quizModules
        .filter(({ module: mod }) => (moduleScores[mod.slug] ?? 0) >= 80)
        .map(({ module: mod }) => mod.slug),
    [quizModules, moduleScores]
  );

  const plan = useMemo(() => {
    if (!pathway) return null;
    const input: PlanInput = {
      pathway: {
        slug: pathway.slug,
        title: pathway.title,
        modules: pathway.modules.map((m) => ({
          slug: m.slug,
          title: m.title,
          topics: m.topics.map((t) => ({
            slug: t.slug,
            title: t.title,
            estMinutes: t.est_minutes,
            isCore: t.is_core,
          })),
        })),
      },
      goalNote,
      companyType,
      targetDate,
      hoursPerWeek,
      track,
      paceFactor: 1,
      skippedModules: confirmedSkips,
      completedTopicSlugs: [],
      diagnosticScores: moduleScores,
      today: todayIso(),
    };
    return generatePlan(input);
  }, [
    pathway,
    goalNote,
    companyType,
    targetDate,
    hoursPerWeek,
    track,
    confirmedSkips,
    moduleScores,
  ]);

  const canContinue =
    (step === 0 && !!pathwaySlug) ||
    (step === 1 && !!targetDate && hoursPerWeek >= 1) ||
    step === 2 ||
    (step === 3 && diagMode !== "undecided") ||
    step === 4;

  async function finish() {
    if (!pathway || !plan) return;
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?next=/onboarding");
      return;
    }

    const profileUpdate = await supabase
      .from("profiles")
      .update({
        college: college || null,
        grad_year: gradYear === "" ? null : gradYear,
        preferred_langs: langs,
        format_pref: formatPref,
        pathway_slug: pathway.slug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (profileUpdate.error) {
      setSaving(false);
      setSaveError("Couldn't save your profile. Try Finish again.");
      return;
    }

    const planUpsert = await supabase.from("user_plans").upsert(
      {
        user_id: user.id,
        pathway_slug: pathway.slug,
        goal_note: goalNote || null,
        company_type: companyType,
        target_date: targetDate,
        hours_per_week: hoursPerWeek,
        track,
        pace_factor: 1.0,
        skipped_modules: confirmedSkips,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,pathway_slug" }
    );
    if (planUpsert.error) {
      setSaving(false);
      setSaveError("Couldn't save your plan. Try Finish again.");
      return;
    }

    if (Object.keys(moduleScores).length > 0) {
      await supabase.from("diagnostic_results").insert(
        Object.entries(moduleScores).map(([moduleSlug, score]) => ({
          user_id: user.id,
          pathway_slug: pathway.slug,
          module_slug: moduleSlug,
          score_pct: score,
        }))
      );
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      {/* progress */}
      <ol className="flex items-center gap-2" aria-label="Setup progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex size-6 items-center justify-center rounded-full border font-mono text-[11px]",
                i < step
                  ? "border-verdict bg-verdict/10 text-verdict"
                  : i === step
                    ? "border-ballpoint text-ballpoint"
                    : "border-rule text-muted-foreground"
              )}
            >
              {i < step ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-xs sm:block",
                i === step ? "font-medium" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className="h-px w-4 bg-rule sm:w-6" />
            )}
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-lg border border-rule bg-card p-6 shadow-sm sm:p-8">
        {/* ── Step 1: pathway ─────────────────────────────────────── */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Pick your path
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              One goal at a time. You can add another path later.
            </p>
            <div className="mt-5 grid gap-3">
              {pathways.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setPathwaySlug(p.slug)}
                  aria-pressed={pathwaySlug === p.slug}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    pathwaySlug === p.slug
                      ? "border-ballpoint bg-accent"
                      : "border-rule hover:border-ballpoint/50"
                  )}
                >
                  <span className="block font-semibold">{p.title}</span>
                  {p.tagline && (
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {p.tagline}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: the goal ────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">The goal</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Honest numbers make an honest plan.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal">What are you aiming for? (optional)</Label>
              <textarea
                id="goal"
                value={goalNote}
                onChange={(e) => setGoalNote(e.target.value)}
                rows={2}
                placeholder="e.g. Java backend role by next June — off-campus."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <fieldset>
              <legend className="text-sm font-medium">Target company type</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["service", "Service (TCS, Infosys, Wipro…)", "Aptitude + basics + communication."],
                    ["product", "Product (Zoho, startups, FAANG…)", "Heavier DSA — plan leans into mediums."],
                  ] as const
                ).map(([value, label, hint]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCompanyType(value)}
                    aria-pressed={companyType === value}
                    className={cn(
                      "rounded-lg border p-3 text-left text-sm transition-colors",
                      companyType === value
                        ? "border-ballpoint bg-accent"
                        : "border-rule hover:border-ballpoint/50"
                    )}
                  >
                    <span className="block font-medium">{label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {hint}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="target-date">Target date</Label>
                <Input
                  id="target-date"
                  type="date"
                  min={plusWeeks(2)}
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hours">Hours per week, honestly</Label>
                <Input
                  id="hours"
                  type="number"
                  min={1}
                  max={40}
                  value={hoursPerWeek}
                  onChange={(e) =>
                    setHoursPerWeek(Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </div>
            </div>
            <fieldset>
              <legend className="text-sm font-medium">How do you learn best?</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["video_first", "Videos first"],
                    ["reading_first", "Reading first"],
                    ["mixed", "Mix of both"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormatPref(value)}
                    aria-pressed={formatPref === value}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      formatPref === value
                        ? "border-ballpoint bg-accent text-accent-foreground"
                        : "border-rule text-muted-foreground hover:border-ballpoint/50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {/* ── Step 3: about you ───────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">About you</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                All optional — it helps tune your resources.
              </p>
            </div>
            <fieldset>
              <legend className="text-sm font-medium">
                Backup resources in your mother tongue?
              </legend>
              <p className="mt-1 text-xs text-muted-foreground">
                Everything leads with English — it&apos;s what the interview
                panel speaks. Tick a language for get-unstuck backups.
              </p>
              <div className="mt-2 flex flex-wrap gap-4">
                {(
                  [
                    ["english", "English"],
                    ["tamil", "தமிழ்"],
                    ["hindi", "हिन्दी"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={langs.includes(value)}
                      disabled={value === "english"}
                      onCheckedChange={(checked) =>
                        setLangs((prev) =>
                          checked
                            ? [...prev, value]
                            : prev.filter((l) => l !== value)
                        )
                      }
                    />
                    {label}
                    {value === "english" && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        always on
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="college">College (optional)</Label>
                <Input
                  id="college"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="Your college name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grad-year">Graduation year (optional)</Label>
                <select
                  id="grad-year"
                  value={gradYear}
                  onChange={(e) =>
                    setGradYear(e.target.value ? Number(e.target.value) : "")
                  }
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Pick a year</option>
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: diagnostic ──────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              What do you already know?
            </h1>
            {diagMode === "undecided" && (
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => setDiagMode("quiz")}
                  className="rounded-lg border border-rule p-4 text-left transition-colors hover:border-ballpoint/50"
                >
                  <span className="block font-semibold">
                    Check what I already know
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {quizModules.reduce((n, m) => n + m.questions.length, 0)}{" "}
                    quick questions. Score 80%+ in a module and we&apos;ll
                    suggest skipping it — your call, always.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiagMode("zero");
                    setConfirmedSkips([]);
                  }}
                  className="rounded-lg border border-rule p-4 text-left transition-colors hover:border-ballpoint/50"
                >
                  <span className="block font-semibold">
                    I&apos;m starting from zero
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    No shame in it — the map starts at page one.
                  </span>
                </button>
              </div>
            )}

            {diagMode === "zero" && (
              <p className="mt-5 rounded-md border border-verdict/40 bg-verdict/5 p-4 text-sm">
                Starting from page one — every module stays on your plan.
                Continue when ready.
              </p>
            )}

            {diagMode === "quiz" && quizModuleIndex < quizModules.length && (
              <QuizModule
                key={quizModules[quizModuleIndex].module.slug}
                moduleTitle={quizModules[quizModuleIndex].module.title}
                index={quizModuleIndex}
                total={quizModules.length}
                questions={quizModules[quizModuleIndex].questions}
                answers={answers}
                onAnswer={(slug, choice) =>
                  setAnswers((a) => ({ ...a, [slug]: choice }))
                }
                onNext={() => setQuizModuleIndex((i) => i + 1)}
              />
            )}

            {diagMode === "quiz" && quizModuleIndex >= quizModules.length && (
              <div className="mt-5 space-y-3">
                <p className="text-sm font-medium">
                  Results — confirm any skips:
                </p>
                {quizModules.map(({ module: mod }) => {
                  const score = moduleScores[mod.slug] ?? 0;
                  const suggested = suggestedSkips.includes(mod.slug);
                  const checked = confirmedSkips.includes(mod.slug);
                  return (
                    <div
                      key={mod.slug}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-md border p-3",
                        suggested ? "border-verdict/40" : "border-rule"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {mod.title}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {score}%{" "}
                          {suggested
                            ? "— looks like you know this"
                            : "— worth keeping on the plan"}
                        </p>
                      </div>
                      {suggested && (
                        <label className="flex shrink-0 items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) =>
                              setConfirmedSkips((prev) =>
                                c
                                  ? [...prev, mod.slug]
                                  : prev.filter((s) => s !== mod.slug)
                              )
                            }
                          />
                          Skip it
                        </label>
                      )}
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  Skipped modules appear pen-struck on your roadmap with the
                  score that earned it.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 5: plan preview ────────────────────────────────── */}
        {step === 4 && plan && pathway && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your plan</h1>
            <ul className="mt-4 space-y-2">
              {plan.summaryReasons.map((reason) => (
                <li key={reason} className="flex gap-2 text-sm">
                  <span aria-hidden="true" className="text-ballpoint">
                    —
                  </span>
                  {reason}
                </li>
              ))}
            </ul>

            {!plan.fit.fits && (
              <div className="mt-4 space-y-2 rounded-md border border-margin/40 bg-margin/5 p-4">
                <p className="text-sm font-medium">Pick a fix:</p>
                {plan.fit.options.map((option) => (
                  <button
                    key={option.kind}
                    type="button"
                    onClick={() => {
                      if (option.kind === "switch_core") setTrack("core");
                      if (option.kind === "add_hours") {
                        const m = option.detail.match(/Give (\d+) hrs/);
                        if (m) setHoursPerWeek(Number(m[1]));
                      }
                      if (option.kind === "move_date") {
                        const m = option.detail.match(/(\d{4}-\d{2}-\d{2})/);
                        if (m) setTargetDate(m[1]);
                      }
                    }}
                    className="block w-full rounded-md border border-rule bg-card p-2.5 text-left text-sm transition-colors hover:border-ballpoint/50"
                  >
                    {option.detail}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-3">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                First weeks
              </p>
              {plan.weeks.slice(0, 3).map((week) => (
                <div key={week.index} className="rounded-md border border-rule p-3">
                  <p className="text-sm font-medium">
                    Week {week.index}
                    <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
                      {week.reason}
                    </span>
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {week.items.map((item, i) => (
                      <li key={i}>
                        {item.kind === "topic"
                          ? `📖 ${item.title} (~${item.estMinutes}m)`
                          : item.kind === "practice"
                            ? `⌨ ${item.count} ${item.difficulty} problem${item.count > 1 ? "s" : ""}`
                            : `🎙 ${item.count} speaking sessions`}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {plan.totalWeeks > 3 && (
                <p className="text-sm text-muted-foreground">
                  …and {plan.totalWeeks - 3} more weeks, recomputed every time
                  you make progress.
                </p>
              )}
            </div>
            {saveError && (
              <p role="alert" className="mt-4 text-sm text-margin">
                {saveError}
              </p>
            )}
          </div>
        )}

        {/* ── Nav ─────────────────────────────────────────────────── */}
        <div className="mt-8 flex items-center justify-between border-t border-rule pt-5">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
              Continue
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={saving || !plan}>
              {saving ? "Saving…" : "Start walking"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuizModule({
  moduleTitle,
  index,
  total,
  questions,
  answers,
  onAnswer,
  onNext,
}: {
  moduleTitle: string;
  index: number;
  total: number;
  questions: DiagnosticMcq[];
  answers: Record<string, number>;
  onAnswer: (slug: string, choice: number) => void;
  onNext: () => void;
}) {
  const allAnswered = questions.every((q) => answers[q.slug] !== undefined);
  return (
    <div className="mt-5">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Module {index + 1} of {total}
      </p>
      <h2 className="mt-1 text-lg font-semibold">{moduleTitle}</h2>
      <div className="mt-4 space-y-5">
        {questions.map((q) => (
          <fieldset key={q.slug}>
            <legend className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
              {q.mcq.question_md.replace(/```[a-z]*\n?/g, "").trim()}
            </legend>
            <div className="mt-2 grid gap-1.5">
              {q.mcq.options.map((option, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onAnswer(q.slug, i)}
                  aria-pressed={answers[q.slug] === i}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    answers[q.slug] === i
                      ? "border-ballpoint bg-accent"
                      : "border-rule hover:border-ballpoint/50"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <Button className="mt-5" onClick={onNext} disabled={!allAnswered}>
        {index + 1 < total ? "Next module" : "See results"}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
