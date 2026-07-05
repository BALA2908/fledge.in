import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroPath } from "@/components/home/hero-path";
import { MarginNote, PenUnderline } from "@/components/notebook/margin-note";
import { Reveal } from "@/components/shared/reveal";
import { getPathways } from "@/lib/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Fledge — your college doesn't decide your career",
  description:
    "Roadmaps, real practice problems, and speaking drills for Indian college students. Practice in English — it's what the interview panel speaks. From a fresher who wrote down every step.",
  openGraph: {
    title: "Fledge — your college doesn't decide your career",
    description:
      "Roadmaps, real practice problems, and speaking drills. Practice in English — it's what the interview panel speaks.",
    type: "website",
    siteName: "Fledge",
  },
};

const steps = [
  {
    title: "Pick your path",
    body: "One goal, one map. Java Full-Stack or DSA — no more tutorial-hopping.",
    doodle: (
      <svg viewBox="0 0 40 40" className="h-9 w-9 text-ballpoint" fill="none" aria-hidden="true">
        <path
          d="M8 32 C 14 20, 26 26, 32 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="1 5"
        />
        <path d="M29 8 l5 0 l-1 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8" cy="32" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Practice in English",
    body: "Interviews, HR rounds, and standups happen in English. Every video and problem here builds that muscle while you learn — two preparations in one.",
    doodle: (
      <svg viewBox="0 0 40 40" className="h-9 w-9 text-ballpoint" fill="none" aria-hidden="true">
        <path
          d="M7 10 h22 a3 3 0 0 1 3 3 v10 a3 3 0 0 1 -3 3 h-12 l-7 6 v-6 h-3 a3 3 0 0 1 -3 -3 v-10 a3 3 0 0 1 3 -3 z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M13 18 h12 M13 22 h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Practice till it sticks",
    body: "Original problems with a real judge, plus speaking drills for the interview rounds nobody prepares you for.",
    doodle: (
      <svg viewBox="0 0 40 40" className="h-9 w-9 text-ballpoint" fill="none" aria-hidden="true">
        <path d="M14 8 l-8 12 l8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M26 8 l8 12 l-8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 30 l6 -20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default async function HomePage() {
  const pathways = await getPathways();

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-ruled">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 md:grid-cols-[1.1fr_0.9fr] md:pt-16">
          <div className="margin-rule pl-8 sm:pl-12">
            <p
              aria-hidden="true"
              className="mb-3 -rotate-2 font-hand text-xl text-margin/80"
            >
              Day 1 —
            </p>
            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl">
              Your college doesn&apos;t decide your career.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Your next six months do. Roadmaps, real practice problems,
              and speaking drills — from a fresher who got out of a
              no-placement college and wrote down every step.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <Link href="/pathways">
                  Pick your path
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Link
                href="#note-from-bala"
                className="text-sm font-medium text-primary underline decoration-ballpoint/40 underline-offset-4 hover:decoration-ballpoint"
              >
                Read my story
              </Link>
            </div>
            <p className="mt-12 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Learn it in English · speak it in the interview
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm md:max-w-none">
            <HeroPath />
          </div>
        </div>
      </section>

      {/* ── Why this exists ──────────────────────────────────────────── */}
      <section className="border-y border-rule bg-secondary/40">
        <Reveal className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="sr-only">Why this exists</h2>
          <ul className="space-y-3 text-lg leading-relaxed">
            <li>Placement training at most colleges is a formality.</li>
            <li>
              The good roadmaps are scattered and assume you already know
              things.
            </li>
            <li>
              So this is one honest map — in plain English, tested on
              myself first. The English is part of the training: it&apos;s
              the language your interviews will happen in.
            </li>
          </ul>
        </Reveal>
      </section>

      {/* ── A note from Bala ─────────────────────────────────────────── */}
      <section
        id="note-from-bala"
        className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16"
      >
        <Reveal>
          <div className="relative [transform:rotate(-0.6deg)]">
            <div
              className="absolute -top-2 left-1/2 z-10 size-4 -translate-x-1/2 rounded-full border border-rule bg-margin/90 shadow-sm"
              aria-hidden="true"
            />
            <article className="relative rounded-lg border border-rule bg-card bg-ruled p-6 pt-8 shadow-sm sm:p-10">
              <div
                className="absolute -left-2 top-24 hidden -rotate-6 sm:block"
                aria-hidden="true"
              >
                <MarginNote>this part was hard —</MarginNote>
              </div>
              <h2 className="text-2xl font-semibold">A note from Bala</h2>
              {/* Draft per PLAN.md §2B — Bala: edit until it sounds like you. */}
              <div className="mt-5 space-y-4 leading-relaxed sm:pl-6">
                <p>
                  I studied at a college most recruiters have never heard of.
                  No product company ever visited. In final year, friends from
                  bigger colleges posted offer letters; I collected rejection
                  mails and stopped opening LinkedIn. There were weeks I
                  didn&apos;t want to leave my room.
                </p>
                <p>
                  What changed things wasn&apos;t luck or talent. It was a map.
                  I picked one path and stopped jumping between ten tutorials.
                  I built small projects. I practiced problems daily. I applied
                  off-campus everywhere, failed the same company&apos;s test
                  more than once, and kept walking.
                </p>
                <p>
                  Today I&apos;m a software engineer working on AI systems.
                  I&apos;m not special. I just had a direction and refused to
                  stop.
                </p>
                <p>
                  This site is that map — in plain English, with
                  everything I wish someone had handed me in second year.
                </p>
              </div>
              <p className="mt-6 font-hand text-2xl sm:pl-6">— Bala</p>
              <p className="text-sm text-muted-foreground sm:pl-6">
                Software engineer · from a college you haven&apos;t heard of
              </p>
            </article>
          </div>
        </Reveal>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight">
              How it works
            </h2>
            <div className="mt-1 max-w-40">
              <PenUnderline />
            </div>
          </Reveal>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.06}>
                <div className="flex h-full flex-col gap-3">
                  {step.doodle}
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pathways ─────────────────────────────────────────────────── */}
      <section className="border-t border-rule bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">
                  The maps so far
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Start where you are. Every topic has an honest time estimate.
                </p>
              </div>
              <Link
                href="/pathways"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                All pathways →
              </Link>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {pathways.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.06}>
                <Link
                  href={`/pathways/${p.slug}`}
                  className="group flex h-full flex-col rounded-lg border border-rule bg-card p-6 shadow-sm transition-colors hover:border-ballpoint/50"
                >
                  <h3 className="text-xl font-semibold transition-colors group-hover:text-primary">
                    {p.title}
                  </h3>
                  {p.tagline && (
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {p.tagline}
                    </p>
                  )}
                  <p className="mt-auto pt-5 font-mono text-xs text-muted-foreground">
                    {p.moduleCount} modules · {p.topicCount} topics · ~
                    {p.estHours} hrs
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
