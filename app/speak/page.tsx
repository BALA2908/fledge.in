import type { Metadata } from "next";
import Link from "next/link";
import { Mic, BookOpenText, ShieldCheck } from "lucide-react";
import { getSpeakingPrompts } from "@/lib/content";
import { RecentSpeaking } from "@/components/speak/recent-speaking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Communication Lab",
  description:
    "In-browser speaking practice — answer HR questions out loud, read passages aloud, see your pace and filler words. Your voice never leaves your device.",
};

export default async function SpeakPage() {
  const prompts = await getSpeakingPrompts();
  const hr = prompts.filter((p) => p.kind === "hr_question");
  const reading = prompts.filter((p) => p.kind === "reading_passage");
  const firstHr = hr[0]?.slug;
  const firstReading = reading[0]?.slug;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <header className="margin-rule pl-8 sm:pl-12">
        <p aria-hidden="true" className="mb-2 -rotate-2 font-hand text-xl text-margin/80">
          say it out loud —
        </p>
        <h1 className="text-4xl font-bold tracking-tight">Communication Lab</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          The coding round is half the battle. This is the other half —
          answering out loud, in English, without freezing. Practice here
          until it&apos;s boring.
        </p>
      </header>

      {/* mode cards */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <ModeCard
          href={firstHr ? `/speak/${firstHr}` : "/speak"}
          icon={<Mic className="size-6 text-ballpoint" aria-hidden="true" />}
          title="Answer like an interview"
          body="Real HR questions — self-intro, strengths, your project. Speak your answer; see your pace and filler words."
          count={hr.length}
          countLabel="questions"
          disabled={!firstHr}
        />
        <ModeCard
          href={firstReading ? `/speak/${firstReading}` : "/speak"}
          icon={<BookOpenText className="size-6 text-ballpoint" aria-hidden="true" />}
          title="Read aloud"
          body="Short passages, easy to hard. Read them out and get an accuracy score — the fastest way to smooth out pronunciation."
          count={reading.length}
          countLabel="passages"
          disabled={!firstReading}
        />
      </div>

      {/* all prompts */}
      {hr.length > 0 && (
        <PromptGroup title="Interview questions" prompts={hr} />
      )}
      {reading.length > 0 && (
        <PromptGroup title="Reading passages" prompts={reading} />
      )}

      {prompts.length === 0 && (
        <p className="mt-10 font-hand text-2xl text-muted-foreground">
          prompts are being written —
        </p>
      )}

      <RecentSpeaking />

      {/* privacy + how it works */}
      <section className="mt-12 rounded-lg border border-verdict/30 bg-verdict/5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-verdict" aria-hidden="true" />
          Your voice never leaves your device
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Recording and speech-to-text run entirely in your browser. We save
          only the numbers — your pace, filler count, accuracy. The recording
          itself is never uploaded. The transcript is saved only if you flip
          the toggle yourself. Works best in Chrome or Edge; the live
          transcript needs an internet connection (that&apos;s the browser&apos;s
          engine, not us).
        </p>
      </section>
    </div>
  );
}

function ModeCard({
  href,
  icon,
  title,
  body,
  count,
  countLabel,
  disabled,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  count: number;
  countLabel: string;
  disabled: boolean;
}) {
  const inner = (
    <>
      {icon}
      <h2 className="mt-3 text-xl font-semibold">{title}</h2>
      <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{body}</p>
      <p className="mt-4 font-mono text-xs text-muted-foreground">
        {count} {countLabel}
      </p>
    </>
  );
  if (disabled)
    return (
      <div className="flex flex-col rounded-lg border border-dashed border-rule p-6 opacity-70">
        {inner}
      </div>
    );
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-rule bg-card p-6 shadow-sm transition-colors hover:border-ballpoint/50"
    >
      {inner}
    </Link>
  );
}

function PromptGroup({
  title,
  prompts,
}: {
  title: string;
  prompts: { slug: string; title: string; tips: string[] }[];
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-3 divide-y divide-rule rounded-lg border border-rule bg-card">
        {prompts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/speak/${p.slug}`}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent"
            >
              <span className="min-w-0 truncate font-medium hover:text-primary">
                {p.title}
              </span>
              <span aria-hidden="true" className="shrink-0 font-mono text-xs text-muted-foreground">
                practice →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
