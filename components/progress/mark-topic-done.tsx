"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useUser } from "@/components/auth/use-user";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * "Mark this topic done" bar for the topic page. Reads its own done-state
 * for the signed-in user; guests get a gentle nudge to sign in.
 */
export function MarkTopicDone({
  topicId,
  topicTitle,
}: {
  topicId: string;
  topicTitle: string;
}) {
  const { user, ready } = useUser();
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("topic_progress")
      .select("topic_id")
      .eq("topic_id", topicId)
      .maybeSingle()
      .then(({ data }) => setDone(!!data));
  }, [user, topicId]);

  if (!ready) return null;

  if (!user)
    return (
      <div className="rounded-lg border border-dashed border-rule p-4 text-sm text-muted-foreground">
        <Link href="/login?next=/pathways" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>{" "}
        to tick topics off and watch the path fill in.
      </div>
    );

  async function toggle() {
    const next = !done;
    setDone(next);
    setPending(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, done: next }),
      });
      if (!res.ok) setDone(!next);
    } catch {
      setDone(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={done}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border p-4 text-left transition-colors",
        done
          ? "border-verdict/50 bg-verdict/5"
          : "border-rule hover:border-ballpoint/50",
        pending && "opacity-60"
      )}
    >
      <span>
        <span className="block font-medium">
          {done ? "Done — nice." : `Finished "${topicTitle}"?`}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {done
            ? "It counts toward your plan and streak. Tap to undo."
            : "Mark it done — your plan and streak update instantly."}
        </span>
      </span>
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
          done ? "border-verdict text-verdict" : "border-input text-transparent"
        )}
      >
        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
      </span>
    </button>
  );
}
