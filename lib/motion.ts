import type { Variants, Transition } from "framer-motion";

/**
 * Shared motion system (PLAN.md §2A):
 * - 150–400ms, ease-out, transform/opacity only, stagger 40–70ms
 * - scroll-reveals fire once
 * - every animated component must respect prefers-reduced-motion —
 *   use framer-motion's useReducedMotion() and fall back to a plain fade
 *   (or nothing); the global CSS media query is the safety net.
 */

export const easeOut: Transition = { duration: 0.3, ease: "easeOut" };

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: easeOut },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: easeOut },
};

export const staggerChildren: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/** Props for one-shot scroll reveals: fire once, small margin. */
export const revealOnce = {
  initial: "hidden",
  whileInView: "visible",
  viewport: { once: true, margin: "-40px" },
} as const;
