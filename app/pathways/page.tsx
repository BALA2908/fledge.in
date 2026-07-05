import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/shared/reveal";
import { getPathways } from "@/lib/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pathways",
  description:
    "Structured career roadmaps for Indian college students — Java Full-Stack, DSA, and more, with hand-picked English resources that double as interview-communication practice.",
};

export default async function PathwaysPage() {
  const pathways = await getPathways();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="margin-rule max-w-2xl pl-8 sm:pl-12">
        <p aria-hidden="true" className="mb-2 -rotate-2 font-hand text-xl text-margin/80">
          pick one, stick to it —
        </p>
        <h1 className="text-4xl font-bold tracking-tight">Pick your path</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          One goal, one map, no tutorial-hopping. Every topic has an honest
          time estimate and hand-picked English resources — learning in
          English is half your interview prep.
        </p>
      </div>

      {pathways.length === 0 ? (
        <p className="mt-16 text-muted-foreground">
          The maps are being drawn right now. Check back soon.
        </p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {pathways.map((p, i) => {
            const inProgress = p.moduleCount < 3;
            return (
              <Reveal key={p.slug} delay={i * 0.06}>
                <Link
                  href={`/pathways/${p.slug}`}
                  className="group flex h-full flex-col rounded-lg border border-rule bg-card p-6 shadow-sm transition-colors hover:border-ballpoint/50 sm:p-8"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-2xl font-semibold transition-colors group-hover:text-primary">
                      {p.title}
                    </h2>
                    {inProgress && (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-margin/40 font-hand text-sm text-margin"
                      >
                        still being written
                      </Badge>
                    )}
                  </div>
                  {p.tagline && (
                    <p className="mt-2 text-muted-foreground">{p.tagline}</p>
                  )}
                  {p.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                  <p className="mt-auto pt-6 font-mono text-xs text-muted-foreground">
                    {p.moduleCount} modules · {p.topicCount} topics · ~
                    {p.estHours} hrs
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
