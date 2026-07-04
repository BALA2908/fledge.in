import { Wordmark } from "@/components/brand/Wordmark";

/**
 * Placeholder page shell for routes whose real build comes in a later
 * phase: a ruled notebook page with the red margin rule, content to the
 * right of it, and one Caveat scribble in the margin gutter.
 */
export function NotebookStub({
  scribble,
  title,
  children,
}: {
  scribble: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-ruled">
      <div className="mx-auto min-h-[60dvh] max-w-3xl px-4 py-16">
        <div className="margin-rule pl-8 sm:pl-12">
          <p
            aria-hidden="true"
            className="mb-2 -rotate-2 font-hand text-lg text-margin/80"
          >
            {scribble}
          </p>
          <h1 className="text-3xl font-bold leading-[2rem] sm:text-4xl">
            {title}
          </h1>
          <div className="mt-8 space-y-4 leading-8 text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ComingSoonLine() {
  return (
    <p className="text-sm">
      — <Wordmark className="text-sm" /> is being built in the open, one page
      at a time.
    </p>
  );
}
