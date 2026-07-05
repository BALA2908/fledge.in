import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your account details.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const rows: [string, string][] = [
    ["Name", (profile?.full_name as string) || "—"],
    ["Email", user.email ?? "—"],
    ["College", (profile?.college as string) || "—"],
    ["Graduation year", profile?.grad_year ? String(profile.grad_year) : "—"],
    [
      "Backup languages",
      (profile?.preferred_langs as string[] | null)?.join(", ") || "english",
    ],
    ["Learning format", (profile?.format_pref as string) || "—"],
    ["Current path", (profile?.pathway_slug as string) || "—"],
  ];

  return (
    <div>
      <div className="mx-auto max-w-xl px-4 py-10">
        <header className="margin-rule pl-8 sm:pl-12">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Editing lands with the full dashboard. For now, rerun{" "}
            <Link href="/onboarding" className="text-primary underline-offset-4 hover:underline">
              onboarding
            </Link>{" "}
            to change anything.
          </p>
        </header>
        <dl className="mt-8 divide-y divide-rule rounded-lg border border-rule bg-card">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 px-4 py-3">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="truncate text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
