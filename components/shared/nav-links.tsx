"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/components/auth/use-user";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/pathways", label: "Pathways" },
  { href: "/problems", label: "Problems" },
  { href: "/speak", label: "Speak" },
  { href: "/dashboard", label: "Dashboard", authed: true },
];

/**
 * Header nav with a pen-underline on the section you're in.
 * Dashboard only shows once you're signed in — a guest tapping it and a
 * guest tapping "Sign in" used to land on the same page, which read as
 * a bug rather than a feature.
 */
export function NavLinks() {
  const pathname = usePathname();
  const { user } = useUser();
  return (
    <nav className="ml-auto flex items-center gap-0.5 overflow-x-auto sm:gap-1">
      {nav
        .filter((item) => !item.authed || user)
        .map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-md px-2 py-1.5 text-sm font-medium transition-colors sm:px-3",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {item.label}
            {active && (
              <svg
                viewBox="0 0 60 4"
                className="absolute inset-x-2 -bottom-0.5 h-1 text-ballpoint sm:inset-x-3"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M1 2.5 C 15 1, 30 3.5, 45 2 S 55 2.5, 59 1.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
