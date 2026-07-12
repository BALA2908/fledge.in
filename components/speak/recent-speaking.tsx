"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/auth/use-user";
import { createClient } from "@/lib/supabase/client";

type Session = {
  id: string;
  mode: string;
  wpm: number | null;
  filler_count: number | null;
  accuracy_pct: number | null;
  created_at: string;
};

/** The signed-in user's recent speaking sessions (metrics only). */
export function RecentSpeaking() {
  const { user, ready } = useUser();
  const [sessions, setSessions] = useState<Session[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("speaking_sessions")
      .select("id, mode, wpm, filler_count, accuracy_pct, created_at")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setSessions((data ?? []) as Session[]));
  }, [user]);

  if (!ready || !user || !sessions || sessions.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Your recent sessions</h2>
      <ul className="mt-3 divide-y divide-rule rounded-lg border border-rule bg-card">
        {sessions.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <span className="font-mono text-xs text-muted-foreground">
              {new Date(s.created_at).toLocaleDateString()} ·{" "}
              {s.mode === "reading_passage" ? "read aloud" : "interview"}
            </span>
            <span className="flex shrink-0 gap-3 font-mono text-xs">
              {s.wpm != null && <span>{s.wpm} wpm</span>}
              {s.accuracy_pct != null && (
                <span className="text-verdict">{s.accuracy_pct}% read</span>
              )}
              {s.filler_count != null && (
                <span className="text-muted-foreground">{s.filler_count} fillers</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
