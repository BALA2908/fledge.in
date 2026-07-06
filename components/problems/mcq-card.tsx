"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/notebook/markdown";
import { useUser } from "@/components/auth/use-user";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * MCQ problems: pick, check, learn — instant verdict + explanation.
 * Attempts are stored as submissions rows (verdict AC/WA) when signed in.
 */
export function McqCard({
  problem,
}: {
  problem: {
    id: string;
    title: string;
    mcq: {
      question_md: string;
      options: string[];
      correct_index: number;
      explanation_md: string;
    };
  };
}) {
  const { user } = useUser();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const correct = checked && choice === problem.mcq.correct_index;

  async function check() {
    if (choice === null) return;
    setChecked(true);
    if (user) {
      const supabase = createClient();
      await supabase.from("submissions").insert({
        user_id: user.id,
        problem_id: problem.id,
        language: "mcq",
        code: `option ${choice + 1}`,
        verdict: choice === problem.mcq.correct_index ? "accepted" : "wrong_answer",
        passed: choice === problem.mcq.correct_index ? 1 : 0,
        total: 1,
      });
    }
  }

  return (
    <div className="rounded-lg border border-rule bg-card p-5 sm:p-6">
      <Markdown>{problem.mcq.question_md}</Markdown>
      <div className="mt-4 grid gap-2">
        {problem.mcq.options.map((option, i) => {
          const isCorrect = checked && i === problem.mcq.correct_index;
          const isWrongPick =
            checked && choice === i && i !== problem.mcq.correct_index;
          return (
            <button
              key={i}
              type="button"
              disabled={checked}
              onClick={() => setChoice(i)}
              aria-pressed={choice === i}
              className={cn(
                "rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                isCorrect
                  ? "border-verdict bg-verdict/10"
                  : isWrongPick
                    ? "border-margin bg-margin/10"
                    : choice === i
                      ? "border-ballpoint bg-accent"
                      : "border-rule hover:border-ballpoint/50",
                checked && "cursor-default"
              )}
            >
              <span className="mr-2 font-mono text-xs text-muted-foreground">
                {String.fromCharCode(65 + i)}.
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {!checked ? (
        <Button className="mt-4" disabled={choice === null} onClick={check}>
          Check my answer
        </Button>
      ) : (
        <div
          className={cn(
            "mt-4 rounded-md border p-4",
            correct ? "border-verdict/50 bg-verdict/5" : "border-margin/50 bg-margin/5"
          )}
        >
          <p className={cn("font-hand text-2xl", correct ? "text-verdict" : "text-margin")}>
            {correct ? "correct —" : "not this time —"}
          </p>
          <Markdown className="mt-2 text-sm">{problem.mcq.explanation_md}</Markdown>
          {!user && (
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">
              sign in and attempts count toward your progress
            </p>
          )}
        </div>
      )}
    </div>
  );
}
