import { cn } from "@/lib/utils";

/**
 * A handwritten margin note (§2A #4): Caveat face, hand-drawn underline.
 * Use sparingly — max one cluster per screen.
 */
export function MarginNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-hand text-lg leading-snug text-muted-foreground [transform:rotate(-1.2deg)] inline-block",
        className
      )}
    >
      {children}
    </span>
  );
}

/** A wobbly single-stroke pen underline, like someone underlined by hand. */
export function PenUnderline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 8"
      className={cn("h-2 w-full text-ballpoint", className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 5.5 C 20 3, 38 6.5, 58 4.5 S 100 6, 118 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A small hand-drawn circle, for pen-circled milestones. */
export function PenCircle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 28"
      className={cn("text-ballpoint", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M24 3 C 38 2, 46 7, 45 14 C 44 21, 33 26, 22 25 C 11 24, 2 20, 3 13 C 4 6, 14 3.5, 27 3.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
