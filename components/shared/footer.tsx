import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

export function Footer() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Wordmark className="text-base" />
          <span>· become full-fledged</span>
        </div>
        <p>
          Free, for students. Built by{" "}
          <Link
            href="/"
            className="underline decoration-ballpoint/40 underline-offset-4 hover:text-foreground"
          >
            a fresher who got out
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
