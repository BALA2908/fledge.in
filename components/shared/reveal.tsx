"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, revealOnce } from "@/lib/motion";

/** One-shot scroll reveal (fade+lift). Reduced motion ⇒ no movement. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      {...revealOnce}
      transition={{ duration: 0.3, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
