"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A topic completion checkbox with optimistic UI + rollback on failure.
 * Renders a hand-drawn tick when done (pen motif). Guests get a disabled
 * box with a tooltip handled by the caller.
 */
export function TopicCheckbox({
  topicId,
  initialDone,
  label,
}: {
  topicId: string;
  initialDone: boolean;
  label: string;
}) {
  const [done, setDone] = useState(initialDone);
  const [pending, setPending] = useState(false);

  async function toggle() {
    const next = !done;
    setDone(next); // optimistic
    setPending(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, done: next }),
      });
      if (!res.ok) setDone(!next); // rollback
    } catch {
      setDone(!next); // rollback
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={`Mark "${label}" ${done ? "not done" : "done"}`}
      disabled={pending}
      onClick={toggle}
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
        done
          ? "border-verdict bg-verdict/10 text-verdict"
          : "border-input hover:border-ballpoint",
        pending && "opacity-60"
      )}
    >
      {done && <Check className="size-3" strokeWidth={3} aria-hidden="true" />}
    </button>
  );
}
