import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { getDiagnosticMcqs, getPathway, getPathways } from "@/lib/content";
import type { DiagnosticMcq, PathwayDetail } from "@/lib/content";

// Protected by middleware; session-dependent saves happen client-side.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set up your plan",
  description: "Five quick steps to a plan that knows your target date.",
};

export default async function OnboardingPage() {
  const cards = await getPathways();
  const details: PathwayDetail[] = [];
  const diagnostics: Record<string, DiagnosticMcq[]> = {};

  for (const card of cards) {
    const detail = await getPathway(card.slug);
    if (!detail) continue;
    details.push(detail);
    diagnostics[card.slug] = await getDiagnosticMcqs(card.slug);
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <OnboardingWizard pathways={details} diagnostics={diagnostics} />
      </div>
    </div>
  );
}
