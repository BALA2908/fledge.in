import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Markdown } from "@/components/notebook/markdown";
import { MarginNote, PenUnderline } from "@/components/notebook/margin-note";
import { ResourceList } from "@/components/topic/resource-list";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { getPathway, getPathways, getProblemsForTopic, getTopic } from "@/lib/content";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string; topicSlug: string }> };

export async function generateStaticParams() {
  const pathways = await getPathways();
  const params: { slug: string; topicSlug: string }[] = [];
  for (const p of pathways) {
    const detail = await getPathway(p.slug);
    for (const m of detail?.modules ?? [])
      for (const t of m.topics)
        params.push({ slug: p.slug, topicSlug: t.slug });
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, topicSlug } = await params;
  const topic = await getTopic(slug, topicSlug);
  if (!topic) return { title: "Topic not found" };
  return {
    title: `${topic.title} · ${topic.pathway.title}`,
    description: topic.summary_md?.slice(0, 155) ?? topic.title,
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug, topicSlug } = await params;
  const topic = await getTopic(slug, topicSlug);
  if (!topic) notFound();

  const problems = await getProblemsForTopic(topic.slug);

  return (
    <div className="bg-ruled">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* breadcrumb */}
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted-foreground">
          <Link href="/pathways" className="hover:text-primary">
            Pathways
          </Link>
          {" / "}
          <Link href={`/pathways/${topic.pathway.slug}`} className="hover:text-primary">
            {topic.pathway.title}
          </Link>
          {" / "}
          <span aria-current="page" className="text-foreground">
            {topic.title}
          </span>
        </nav>

        {/* the notebook page: margin gutter + red rule + content */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[13rem_1fr]">
          {/* margin gutter — handwritten tips (§2A #4) */}
          <aside className="order-2 lg:order-1">
            {topic.tips.length > 0 && (
              <div className="space-y-5 lg:sticky lg:top-24">
                <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground lg:sr-only">
                  Margin notes
                </h2>
                {topic.tips.map((tip, i) => (
                  <div key={i}>
                    <MarginNote className="text-foreground/85">{tip}</MarginNote>
                    <div className="max-w-28">
                      <PenUnderline className="opacity-70" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* content, right of the red margin rule */}
          <div className="order-1 min-w-0 lg:order-2 lg:margin-rule lg:pl-10">
            <header>
              <p className="font-mono text-xs text-muted-foreground">
                {topic.module.title} · ~{topic.est_minutes} min
                {!topic.is_core && " · deep dive"}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {topic.title}
              </h1>
            </header>

            {topic.summary_md && (
              <div className="mt-6">
                <Markdown>{topic.summary_md}</Markdown>
              </div>
            )}

            {/* resources */}
            <section className="mt-10">
              <h2 className="text-xl font-semibold">Learn it</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick one resource in your language — watching all of them is
                procrastination with extra steps.
              </p>
              <div className="mt-4">
                {topic.resources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Resources for this topic are on their way.
                  </p>
                ) : (
                  <ResourceList resources={topic.resources} />
                )}
              </div>
            </section>

            {/* practice */}
            <section className="mt-10">
              <h2 className="text-xl font-semibold">Practice this topic</h2>
              {problems.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No problems tagged here yet — the DSA pathway topics have the
                  full bank. Browse{" "}
                  <Link href="/problems" className="text-primary underline-offset-4 hover:underline">
                    all problems →
                  </Link>
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {problems.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/problems/${p.slug}`}
                        className="group flex items-center justify-between gap-3 rounded-md border border-rule bg-card p-3 transition-colors hover:border-ballpoint/50"
                      >
                        <span className="min-w-0 truncate text-sm font-medium group-hover:text-primary">
                          {p.title}
                        </span>
                        <DifficultyBadge difficulty={p.difficulty} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* prev / next */}
            <nav
              aria-label="Topic navigation"
              className="mt-12 flex items-stretch justify-between gap-3 border-t border-rule pt-6"
            >
              {topic.prev ? (
                <Link
                  href={`/pathways/${topic.pathway.slug}/${topic.prev.slug}`}
                  className="group flex min-w-0 items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{topic.prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {topic.next ? (
                <Link
                  href={`/pathways/${topic.pathway.slug}/${topic.next.slug}`}
                  className="group flex min-w-0 items-center gap-2 text-right text-sm text-muted-foreground hover:text-primary"
                >
                  <span className="truncate">{topic.next.title}</span>
                  <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
