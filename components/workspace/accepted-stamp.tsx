"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Signature moment §2A #3 — the FIRST-EVER accepted verdict: a red-ink
 * ACCEPTED stamp thuds onto the page. "First of many." Never repeats
 * (the server tells us when it's the first).
 */
export function AcceptedStamp({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      role="status"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
    >
      <div className="text-center">
        <motion.div
          initial={reduced ? false : { scale: 2.4, opacity: 0, rotate: -14 }}
          animate={{ scale: 1, opacity: 1, rotate: -8 }}
          transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.15 }}
          className="inline-block rounded border-[3px] border-margin px-8 py-3"
        >
          <span className="font-heading text-4xl font-extrabold uppercase tracking-[0.2em] text-margin sm:text-5xl">
            Accepted
          </span>
        </motion.div>
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.7, duration: 0.3 }}
          className="mt-5 font-hand text-3xl text-foreground"
        >
          First of many.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0 : 1.2 }}
          className="mt-3 font-mono text-xs text-muted-foreground"
        >
          tap anywhere to keep going
        </motion.p>
      </div>
    </motion.div>
  );
}
