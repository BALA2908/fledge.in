import { cn } from "@/lib/utils";

/**
 * The fledge wordmark (PLAN.md §2A): lowercase "fledge" in Bricolage
 * Grotesque SemiBold, ink color, with a tiny pen-drawn paper plane lifting
 * off along a dotted ballpoint trail after the final "e". The trail draws
 * itself once on first paint (CSS, ~600ms); static under reduced-motion.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-heading font-semibold lowercase tracking-tight text-foreground",
        className,
      )}
    >
      fledge
      <svg
        viewBox="0 0 44 28"
        aria-hidden="true"
        className="ml-1 h-[0.9em] w-auto self-center overflow-visible"
      >
        {/* dotted ballpoint trail, rising left → right with a hand wobble */}
        <path
          d="M1 24 C 9 25, 14 20, 19 16 S 27 9, 31 8"
          fill="none"
          stroke="var(--ballpoint)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="0.5 4.5"
          className="wordmark-trail"
        />
        {/* one-pen-stroke paper plane doodle, slight wobble, never solid */}
        <g
          className="wordmark-plane"
          stroke="var(--ballpoint)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <path d="M32.5 9.5 L43 1.5 L38.2 12.8 L34.8 9.9 Z" />
          <path d="M38.2 12.8 L37.4 15.5 L35.6 10.6" />
        </g>
      </svg>
    </span>
  );
}
