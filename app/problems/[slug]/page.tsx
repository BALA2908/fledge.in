import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/notebook/markdown";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
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
  if (!problem || problem.kind !== "coding") notFound();

  return (
    <div className="bg-ruled">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted-foreground">
          <Link href="/problems" className="hover:text-primary">
            Problems
          </Link>
          {" / "}
          <span aria-current="page" className="text-foreground">
            {problem.title}
          </span>
        </nav>

        <div className="mt-6 lg:margin-rule lg:pl-10">
          <header className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{problem.title}</h1>
            <DifficultyBadge difficulty={problem.difficulty} />
          </header>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {problem.tags.join(" · ")} · {problem.time_limit_ms / 1000}s limit
          </p>

          {problem.statement_md && (
            <div className="mt-6">
              <Markdown>{problem.statement_md}</Markdown>
            </div>
          )}

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {problem.input_format_md && (
              <section>
                <h2 className="text-base font-semibold">Input</h2>
                <Markdown className="mt-2 text-sm">{problem.input_format_md}</Markdown>
              </section>
            )}
            {problem.output_format_md && (
              <section>
                <h2 className="text-base font-semibold">Output</h2>
                <Markdown className="mt-2 text-sm">{problem.output_format_md}</Markdown>
              </section>
            )}
          </div>

          {problem.constraints_md && (
            <section className="mt-8">
              <h2 className="text-base font-semibold">Constraints</h2>
              <Markdown className="mt-2 text-sm">{problem.constraints_md}</Markdown>
            </section>
          )}

          {(problem.sample_tests ?? []).length > 0 && (
            <section className="mt-8">
              <h2 className="text-base font-semibold">Sample tests</h2>
              <div className="mt-3 space-y-4">
                {(problem.sample_tests ?? []).map((t, i) => (
                  <div key={i} className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        input {i + 1}
                      </p>
                      <pre className="overflow-x-auto rounded-md bg-code-surface p-3 font-mono text-xs leading-relaxed text-[#e8eaf2]">
                        {t.input}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        output {i + 1}
                      </p>
                      <pre className="overflow-x-auto rounded-md bg-code-surface p-3 font-mono text-xs leading-relaxed text-[#e8eaf2]">
                        {t.output}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {problem.hints.length > 0 && (
            <section className="mt-8">
              <h2 className="text-base font-semibold">Stuck?</h2>
              <div className="mt-3 space-y-2">
                {problem.hints.map((hint, i) => (
                  <details key={i} className="group rounded-md border border-rule bg-card p-3">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground group-open:text-foreground">
                      Hint {i + 1} — open only if you need it
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed">{hint}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <div className="mt-10 rounded-lg border border-dashed border-rule p-5">
            <p className="font-hand text-xl text-muted-foreground">
              the editor lands here soon —
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Write and run code right on this page: Python, Java, C++, and
              JavaScript, judged against real hidden tests. Until then, solve
              it in your own editor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
