import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPathways } from "@/lib/content";
import { ProfileEditor } from "@/components/profile/profile-editor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your account details and plan settings.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const [{ data: profile }, { data: planRow }, pathways] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("user_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getPathways(),
  ]);

  const identity: [string, string][] = [
    ["Name", (profile?.full_name as string) || "—"],
    ["Email", user.email ?? "—"],
    ["College", (profile?.college as string) || "—"],
    ["Graduation year", profile?.grad_year ? String(profile.grad_year) : "—"],
    [
      "Backup languages",
      (profile?.preferred_langs as string[] | null)?.join(", ") || "english",
    ],
  ];

  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="margin-rule pl-8 sm:pl-12">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your details and the inputs behind your plan.
          </p>
        </header>

        <dl className="mt-8 divide-y divide-rule rounded-lg border border-rule bg-card">
          {identity.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 px-4 py-3">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="truncate text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6">
          {planRow ? (
            <ProfileEditor
              pathwaySlug={planRow.pathway_slug}
              pathways={pathways.map((p) => ({ slug: p.slug, title: p.title }))}
              initial={{
                hoursPerWeek: planRow.hours_per_week ?? 6,
                targetDate:
                  planRow.target_date ?? new Date().toISOString().slice(0, 10),
                track: (planRow.track ?? "full") as "full" | "core",
                formatPref: (profile?.format_pref ?? "mixed") as
                  | "video_first"
                  | "reading_first"
                  | "mixed",
              }}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-rule p-4 text-sm text-muted-foreground">
              No plan yet.{" "}
              <Link href="/onboarding" className="text-primary underline-offset-4 hover:underline">
                Set one up →
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
