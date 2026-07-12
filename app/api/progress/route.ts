import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Toggle a topic's completion for the signed-in user. Owner-only via RLS.
 * On complete: also bump today's daily_activity.topics_completed.
 */
const bodySchema = z.object({
  topicId: z.string().uuid(),
  done: z.boolean(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Sign in to track progress." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const { topicId, done } = parsed.data;

  if (done) {
    const { error } = await supabase
      .from("topic_progress")
      .upsert(
        { user_id: user.id, topic_id: topicId },
        { onConflict: "user_id,topic_id" }
      );
    if (error)
      return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });

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
        topics_completed: (activity?.topics_completed ?? 0) + 1,
        speaking_sessions: activity?.speaking_sessions ?? 0,
      },
      { onConflict: "user_id,day" }
    );
  } else {
    const { error } = await supabase
      .from("topic_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("topic_id", topicId);
    if (error)
      return NextResponse.json({ error: "Couldn't undo that." }, { status: 500 });
    // We don't decrement daily_activity — the heatmap records that you
    // showed up that day, and unchecking later shouldn't erase the day.
  }

  return NextResponse.json({ ok: true, done });
}
