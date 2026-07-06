import { cn } from "@/lib/utils";
import type { Verdict } from "@/lib/judge/verdict";

export const VERDICT_META: Record<
  Verdict,
  { label: string; className: string }
> = {
  accepted: { label: "Accepted", className: "text-verdict border-verdict/50 bg-verdict/10" },
  wrong_answer: { label: "Wrong answer", className: "text-margin border-margin/50 bg-margin/10" },
  time_limit_exceeded: { label: "Time limit", className: "text-margin border-margin/50 bg-margin/10" },
  runtime_error: { label: "Runtime error", className: "text-margin border-margin/50 bg-margin/10" },
  compile_error: { label: "Compile error", className: "text-margin border-margin/50 bg-margin/10" },
};

export function VerdictBadge({
  verdict,
  className,
}: {
  verdict: Verdict;
  className?: string;
}) {
  const meta = VERDICT_META[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold",
        meta.className,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
