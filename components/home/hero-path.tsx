"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Signature moment §2A #1: a ballpoint-blue path draws itself down a ruled
 * page — from a "Day 1" tick to a stapled OFFER chit — pen-circling three
 * milestones on the way. Plays once (~2s), skippable by scroll; reduced
 * motion sees the finished path.
 */

const DRAW_SECONDS = 2;

// Milestones with their position and the moment (0..1 of path progress)
// the pen passes them.
const MILESTONES = [
  { label: "first program", x: 240, y: 128, at: 0.28 },
  { label: "first project", x: 78, y: 268, at: 0.55 },
  { label: "first interview", x: 252, y: 388, at: 0.8 },
] as const;

export function HeroPath() {
  const reduced = useReducedMotion();

  const appearAt = (at: number) =>
    reduced
      ? { duration: 0 }
      : { delay: at * DRAW_SECONDS, duration: 0.3, ease: "easeOut" as const };

  return (
    <div className="relative overflow-hidden rounded-lg border border-rule bg-card bg-ruled shadow-sm">
      <svg
        viewBox="0 0 400 520"
        role="img"
        aria-label="A hand-drawn path from Day 1, through first program, first project and first interview, ending at an offer letter."
        className="block h-auto w-full"
      >
        {/* Day 1 tick */}
        <motion.g
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <path
            d="M52 54 l7 8 l13 -16"
            fill="none"
            stroke="var(--verdict)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="84"
            y="64"
            className="fill-current font-hand"
            fontSize="21"
            style={{ fill: "var(--muted-foreground)" }}
          >
            Day 1
          </text>
        </motion.g>

        {/* The ballpoint path */}
        <motion.path
          d="M60 74
             C 90 110, 180 96, 228 122
             S 300 178, 250 208
             S 120 224, 88 254
             S 82 320, 140 340
             S 236 348, 258 376
             S 296 428, 300 452"
          fill="none"
          stroke="var(--ballpoint)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: DRAW_SECONDS, ease: [0.45, 0, 0.35, 1] }
          }
        />

        {/* Pen-circled milestones */}
        {MILESTONES.map((m) => (
          <motion.g
            key={m.label}
            initial={reduced ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={appearAt(m.at)}
            style={{ transformOrigin: `${m.x}px ${m.y}px` }}
          >
            <path
              d={`M${m.x - 4} ${m.y - 13}
                  c 26 -3, 44 3, 43 12
                  c -1 10, -19 15, -40 14
                  c -21 -1, -36 -6, -35 -14
                  c 1 -8, 15 -11, 36 -12`}
              fill="none"
              stroke="var(--ballpoint)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.85"
            />
            <text
              x={m.x}
              y={m.y + 4}
              textAnchor="middle"
              className="font-hand"
              fontSize="19"
              style={{ fill: "var(--foreground)" }}
            >
              {m.label}
            </text>
          </motion.g>
        ))}

        {/* The stapled OFFER chit */}
        <motion.g
          initial={reduced ? false : { opacity: 0, scale: 0.9, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: -3 }}
          transition={appearAt(0.97)}
          style={{ transformOrigin: "300px 476px" }}
        >
          <rect
            x="252"
            y="456"
            width="96"
            height="44"
            rx="3"
            fill="var(--card)"
            stroke="var(--rule)"
            strokeWidth="1.5"
            style={{
              filter: "drop-shadow(0 2px 3px rgb(0 0 0 / 0.12))",
            }}
          />
          {/* staple */}
          <path
            d="M262 460 l10 -8 M265 462.5 l10 -8"
            stroke="var(--muted-foreground)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <text
            x="300"
            y="484"
            textAnchor="middle"
            fontSize="17"
            fontWeight="700"
            letterSpacing="3"
            className="font-heading"
            style={{ fill: "var(--verdict)" }}
          >
            OFFER
          </text>
        </motion.g>
      </svg>
    </div>
  );
}
