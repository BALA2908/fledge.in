import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/notebook/markdown";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { ProblemWorkspace } from "@/components/workspace/problem-workspace";
import { McqCard } from "@/components/problems/mcq-card";
import { getCodingProblems, getProblem } from "@/lib/content";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const problems = await getCodingProblems();
  return problems.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) return { title: "Problem not found" };
  return {
    title: problem.title,
    description: problem.statement_md?.slice(0, 155) ?? problem.title,
  };
}

export default async function ProblemPage({ params }: Props) {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) notFound();

  // MCQ problems get the quick-check card, not the editor.
  if (problem.kind === "mcq") {
    if (!problem.mcq) notFound();
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted-foreground">
          <Link href="/problems" className="hover:text-primary">
            Problems
          </Link>
          {" / "}
          <span aria-current="page" className="text-foreground">
            {problem.title}
          </span>
        </nav>
        <header className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </header>
        <div className="mt-6">
          <McqCard problem={{ id: problem.id, title: problem.title, mcq: problem.mcq }} />
        </div>
      </div>
    );
  }

  // Server-rendered description passed into the client workspace as a slot.
  const description = (
    <article>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{problem.title}</h1>
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>
      <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
        {problem.tags.join(" · ")} · {problem.time_limit_ms / 1000}s limit
      </p>
      {problem.statement_md && (
        <div className="mt-4">
          <Markdown className="text-sm">{problem.statement_md}</Markdown>
        </div>
      )}
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {problem.input_format_md && (
          <section>
            <h2 className="text-sm font-semibold">Input</h2>
            <Markdown className="mt-1 text-sm">{problem.input_format_md}</Markdown>
          </section>
        )}
        {problem.output_format_md && (
          <section>
            <h2 className="text-sm font-semibold">Output</h2>
            <Markdown className="mt-1 text-sm">{problem.output_format_md}</Markdown>
          </section>
        )}
      </div>
      {problem.constraints_md && (
        <section className="mt-5">
          <h2 className="text-sm font-semibold">Constraints</h2>
          <Markdown className="mt-1 text-sm">{problem.constraints_md}</Markdown>
        </section>
      )}
      {(problem.sample_tests ?? []).length > 0 && (
        <section className="mt-5">
          <h2 className="text-sm font-semibold">Sample tests</h2>
          <div className="mt-2 space-y-3">
            {(problem.sample_tests ?? []).map((t, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    input {i + 1}
                  </p>
                  <pre className="max-h-44 overflow-auto rounded-md bg-code-surface p-2.5 font-mono text-[11px] leading-relaxed text-[#e8eaf2]">
                    {t.input}
                  </pre>
                </div>
                <div>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    output {i + 1}
                  </p>
                  <pre className="max-h-44 overflow-auto rounded-md bg-code-surface p-2.5 font-mono text-[11px] leading-relaxed text-[#e8eaf2]">
                    {t.output}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-4 font-mono text-xs text-muted-foreground">
        <Link href="/problems" className="hover:text-primary">
          Problems
        </Link>
        {" / "}
        <span aria-current="page" className="text-foreground">
          {problem.title}
        </span>
      </nav>
      <ProblemWorkspace
        problem={{
          id: problem.id,
          slug: problem.slug,
          title: problem.title,
          starter_code: problem.starter_code,
          hints: problem.hints,
          time_limit_ms: problem.time_limit_ms,
        }}
        description={description}
      />
    </div>
  );
}
