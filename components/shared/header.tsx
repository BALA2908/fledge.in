import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/pathways", label: "Pathways" },
  { href: "/problems", label: "Problems" },
  { href: "/speak", label: "Speak" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" aria-label="Fledge home" className="shrink-0">
          <Wordmark className="text-xl" />
        </Link>
        <nav className="ml-auto flex items-center gap-0.5 overflow-x-auto sm:gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:px-3"
            >
              {item.label}
            </Link>
          ))}
        </nav>
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
