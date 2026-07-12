import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/notebook/markdown";
import { MarginNote, PenUnderline } from "@/components/notebook/margin-note";
import { Recorder } from "@/components/speak/recorder";
import { getSpeakingPrompt, getSpeakingPrompts } from "@/lib/content";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const prompt = await getSpeakingPrompt(slug);
  if (!prompt) return { title: "Prompt not found" };
  return {
    title: `${prompt.title} · Communication Lab`,
    description:
      prompt.kind === "reading_passage"
        ? `Read this passage aloud and get an accuracy score. ${prompt.title}.`
        : `Practice answering "${prompt.title}" out loud — see your pace and filler words.`,
  };
}

export default async function SpeakPromptPage({ params }: Props) {
  const { slug } = await params;
  const prompt = await getSpeakingPrompt(slug);
  if (!prompt) notFound();

  const all = await getSpeakingPrompts();
  const sameKind = all.filter((p) => p.kind === prompt.kind);
  const index = sameKind.findIndex((p) => p.slug === prompt.slug);
  const next = index > -1 && index < sameKind.length - 1 ? sameKind[index + 1] : null;
  const isReading = prompt.kind === "reading_passage";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted-foreground">
        <Link href="/speak" className="hover:text-primary">
          Communication Lab
        </Link>
        {" / "}
        <span aria-current="page" className="text-foreground">
          {prompt.title}
        </span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_13rem]">
        {/* prompt + recorder */}
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {isReading ? "Read aloud" : "Answer out loud"}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {prompt.title}
          </h1>

          <div
            className={
              isReading
                ? "mt-5 rounded-lg border border-rule bg-card p-5 text-lg leading-relaxed"
                : "mt-5"
            }
          >
            <Markdown>{prompt.prompt_md}</Markdown>
          </div>

          <div className="mt-6">
            <Recorder
              prompt={{
                id: prompt.id,
                kind: prompt.kind,
                title: prompt.title,
                prompt_md: prompt.prompt_md,
              }}
            />
          </div>

          {next && (
            <div className="mt-6 flex justify-end">
              <Link
                href={`/speak/${next.slug}`}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Next: {next.title} →
              </Link>
            </div>
          )}
        </div>

        {/* margin: tips as handwritten notes */}
        <aside className="lg:order-last">
          {prompt.tips.length > 0 && (
            <div className="space-y-5 lg:sticky lg:top-24">
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Before you start
              </h2>
              {prompt.tips.map((tip, i) => (
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
      </div>
    </div>
  );
}
