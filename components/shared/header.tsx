import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { NavLinks } from "@/components/shared/nav-links";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" aria-label="Fledge home" className="shrink-0">
          <Wordmark className="text-xl" />
        </Link>
        <NavLinks />
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          {/* placeholder until Phase 3 auth */}
          <Button size="sm" className="hidden sm:inline-flex">
            Sign in
          </Button>
        </div>
      </div>
    </header>
  );
}
