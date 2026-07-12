import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Persist a speaking session's METRICS (audio never leaves the browser).
 * Transcript is saved only when the client sends it (opt-in toggle).
 * First session of the day bumps daily_activity.speaking_sessions.
 */
const bodySchema = z.object({
  promptId: z.string().uuid(),
  mode: z.enum(["hr_question", "reading_passage"]),
  durationS: z.number().int().nonnegative(),
  wpm: z.number().nonnegative(),
  fillerCount: z.number().int().nonnegative(),
  fillers: z.array(z.object({ filler: z.string(), count: z.number().int() })),
  accuracyPct: z.number().min(0).max(100).nullable(),
  transcript: z.string().nullable(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Sign in to save sessions." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const b = parsed.data;

  const { error } = await supabase.from("speaking_sessions").insert({
    user_id: user.id,
    prompt_id: b.promptId,
    mode: b.mode,
    duration_s: b.durationS,
    wpm: b.wpm,
    filler_count: b.fillerCount,
    fillers: b.fillers,
    accuracy_pct: b.accuracyPct,
    transcript: b.transcript, // null unless the student opted in
  });
  if (error)
    return NextResponse.json({ error: "Couldn't save the session." }, { status: 500 });

  // Bump today's activity (count a day once, like topic/problem activity).
  const day = new Date().toISOString().slice(0, 10);
  const { data: activity } = await supabase
    .from("daily_activity")
    .select("problems_solved, topics_completed, speaking_sessions")
    .eq("user_id", user.id)
    .eq("day", day)
    .maybeSingle();
  await supabase.from("daily_activity").upsert(
    {
      user_id: user.id,
      day,
      problems_solved: activity?.problems_solved ?? 0,
      topics_completed: activity?.topics_completed ?? 0,
      speaking_sessions: (activity?.speaking_sessions ?? 0) + 1,
    },
    { onConflict: "user_id,day" }
  );

  return NextResponse.json({ ok: true });
}
