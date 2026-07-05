import { cn } from "@/lib/utils";

const styles = {
  easy: "text-verdict border-verdict/40",
  medium: "text-ballpoint border-ballpoint/40",
  hard: "text-margin border-margin/40",
} as const;

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: "easy" | "medium" | "hard";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[11px] font-medium lowercase",
        styles[difficulty],
        className
      )}
    >
      {difficulty}
    </span>
  );
}
