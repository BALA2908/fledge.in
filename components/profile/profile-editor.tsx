"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type FormatPref = "video_first" | "reading_first" | "mixed";
type Track = "full" | "core";

/**
 * Edit the plan inputs that reshape the weekly schedule. Saving asks for
 * confirmation (it re-derives every future week) and lands on the dashboard
 * where the new plan shows. Switching pathway keeps topic progress.
 */
export function ProfileEditor({
  pathwaySlug,
  pathways,
  initial,
}: {
  pathwaySlug: string;
  pathways: { slug: string; title: string }[];
  initial: {
    hoursPerWeek: number;
    targetDate: string;
    track: Track;
    formatPref: FormatPref;
  };
}) {
  const router = useRouter();
  const [hoursPerWeek, setHoursPerWeek] = useState(initial.hoursPerWeek);
  const [targetDate, setTargetDate] = useState(initial.targetDate);
  const [track, setTrack] = useState<Track>(initial.track);
  const [formatPref, setFormatPref] = useState<FormatPref>(initial.formatPref);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [switchTo, setSwitchTo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty =
    hoursPerWeek !== initial.hoursPerWeek ||
    targetDate !== initial.targetDate ||
    track !== initial.track ||
    formatPref !== initial.formatPref;

  async function saveInputs() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login?next=/profile");
    await Promise.all([
      supabase
        .from("user_plans")
        .update({
          hours_per_week: hoursPerWeek,
          target_date: targetDate,
          track,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("pathway_slug", pathwaySlug),
      supabase.from("profiles").update({ format_pref: formatPref }).eq("id", user.id),
    ]);
    router.push("/dashboard");
    router.refresh();
  }

  async function switchPathway() {
    if (!switchTo) return;
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login?next=/profile");
    await supabase.from("profiles").update({ pathway_slug: switchTo }).eq("id", user.id);
    await supabase.from("user_plans").upsert(
      {
        user_id: user.id,
        pathway_slug: switchTo,
        company_type: "service",
        target_date: targetDate,
        hours_per_week: hoursPerWeek,
        track,
        pace_factor: 1.0,
        skipped_modules: [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,pathway_slug" }
    );
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-rule bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Your plan inputs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Change these and your weekly plan re-shapes itself — honestly, with
          the numbers shown.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hours">Hours per week</Label>
            <Input
              id="hours"
              type="number"
              min={1}
              max={40}
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="target">Target date</Label>
            <Input
              id="target"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        </div>
        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Track</legend>
          <div className="mt-2 flex gap-2">
            {(
              [
                ["full", "Full — everything"],
                ["core", "Core — skip deep-dives"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTrack(value)}
                aria-pressed={track === value}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  track === value
                    ? "border-ballpoint bg-accent text-accent-foreground"
                    : "border-rule text-muted-foreground hover:border-ballpoint/50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Resource preference</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["video_first", "Videos first"],
                ["reading_first", "Reading first"],
                ["mixed", "Mixed"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormatPref(value)}
                aria-pressed={formatPref === value}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  formatPref === value
                    ? "border-ballpoint bg-accent text-accent-foreground"
                    : "border-rule text-muted-foreground hover:border-ballpoint/50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <Button
          className="mt-5"
          disabled={!dirty || saving}
          onClick={() => setConfirmOpen(true)}
        >
          {saving ? "Saving…" : "Save & re-plan"}
        </Button>
      </section>

      {pathways.length > 1 && (
        <section className="rounded-lg border border-rule bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Switch path</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your topic progress stays — the plan just re-scopes to the new
            path.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pathways
              .filter((p) => p.slug !== pathwaySlug)
              .map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setSwitchTo(p.slug)}
                  className="rounded-md border border-rule px-3 py-2 text-sm transition-colors hover:border-ballpoint/50"
                >
                  Switch to {p.title}
                </button>
              ))}
          </div>
        </section>
      )}

      {/* confirm: save inputs */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-plan with these numbers?</DialogTitle>
            <DialogDescription>
              {hoursPerWeek} hrs/week · target {targetDate} · {track} track.
              Your weekly schedule re-derives from here — nothing you&apos;ve
              completed is lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveInputs} disabled={saving}>
              {saving ? "Saving…" : "Yes, re-plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* confirm: switch pathway */}
      <Dialog open={!!switchTo} onOpenChange={(o) => !o && setSwitchTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch your path?</DialogTitle>
            <DialogDescription>
              You&apos;ll land on the new path&apos;s plan. Progress on topics
              you&apos;ve finished is kept. You can switch back any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSwitchTo(null)}>
              Cancel
            </Button>
            <Button onClick={switchPathway} disabled={saving}>
              {saving ? "Switching…" : "Switch path"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
