import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="bg-ruled">
      <section className="mx-auto flex min-h-[70dvh] max-w-6xl flex-col justify-center px-4 py-20">
        <div className="margin-rule max-w-2xl pl-8 sm:pl-12">
          <p
            aria-hidden="true"
            className="mb-3 -rotate-2 font-hand text-xl text-margin/80"
          >
            Day 1 —
          </p>
          <h1 className="text-4xl font-bold leading-[3rem] tracking-tight sm:text-5xl sm:leading-[4rem]">
            Your college doesn&apos;t decide your career.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Your next six months do. Free roadmaps, real practice problems,
            and speaking drills — from a fresher who got out of a
            no-placement college and wrote down every step.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <Link href="/pathways">
                Pick your path
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Link
              href="/"
              className="text-sm font-medium text-primary underline decoration-ballpoint/40 underline-offset-4 hover:decoration-ballpoint"
            >
              Read my story
            </Link>
          </div>
          <p className="mt-12 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            English · Tamil · Hindi
          </p>
        </div>
      </section>
    </div>
  );
}
