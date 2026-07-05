import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Roadmap } from "@/components/pathway/roadmap";
import { MarginNote } from "@/components/notebook/margin-note";
import { getPathway, getPathways } from "@/lib/content";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const pathways = await getPathways();
  return pathways.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pathway = await getPathway(slug);
  if (!pathway) return { title: "Pathway not found" };
  return {
    title: pathway.title,
    description:
      pathway.tagline ??
      `The ${pathway.title} roadmap — modules, topics and resources in English, Tamil and Hindi.`,
  };
}

export default async function PathwayPage({ params }: Props) {
  const { slug } = await params;
  const pathway = await getPathway(slug);
  if (!pathway) notFound();

  const topicCount = pathway.modules.reduce((n, m) => n + m.topics.length, 0);
  const estHours = Math.round(
    pathway.modules.reduce((n, m) => n + (m.est_hours ?? 0), 0)
  );

  return (
    <div className="bg-ruled">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <header className="margin-rule pl-8 sm:pl-12">
          <p aria-hidden="true" className="mb-2 -rotate-2 font-hand text-xl text-margin/80">
            the map —
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{pathway.title}</h1>
          {pathway.tagline && (
            <p className="mt-3 text-lg text-muted-foreground">{pathway.tagline}</p>
          )}
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            {pathway.modules.length} modules · {topicCount} topics · ~{estHours}{" "}
            hrs at your pace
          </p>
          {pathway.outcomes.length > 0 && (
            <ul className="mt-6 max-w-2xl space-y-1.5 text-sm text-muted-foreground">
              {pathway.outcomes.map((o) => (
                <li key={o} className="flex gap-2">
                  <span aria-hidden="true" className="text-verdict">✓</span>
                  {o}
                </li>
              ))}
            </ul>
          )}
        </header>

        <div className="mt-12 pl-1 sm:pl-4">
          <div className="mb-6 hidden sm:block" aria-hidden="true">
            <MarginNote>start at 1, no skipping around —</MarginNote>
          </div>
          <Roadmap pathwaySlug={pathway.slug} modules={pathway.modules} />
        </div>
      </div>
    </div>
  );
}
