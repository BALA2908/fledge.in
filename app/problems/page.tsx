import type { Metadata } from "next";
import { ProblemsExplorer } from "@/components/problems/problems-explorer";
import { getCodingProblems, getPathways } from "@/lib/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Problems",
  description:
    "Original coding problems with a real judge — arrays, strings, DP and more, from easy to hard. Multi-language starter code.",
};

export default async function ProblemsPage() {
  const [problems, pathways] = await Promise.all([
    getCodingProblems(),
    getPathways(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <header className="margin-rule pl-8 sm:pl-12">
        <p aria-hidden="true" className="mb-2 -rotate-2 font-hand text-xl text-margin/80">
          rough work encouraged —
        </p>
        <h1 className="text-4xl font-bold tracking-tight">Problems</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Original problems, campus stories, real hidden tests. Start easy,
          earn the hard ones.
        </p>
      </header>

      <div className="mt-10">
        <ProblemsExplorer
          problems={problems}
          pathways={pathways.map((p) => ({ slug: p.slug, title: p.title }))}
        />
      </div>
    </div>
  );
}
