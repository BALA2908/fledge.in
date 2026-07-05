"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/auth/use-user";

/**
 * Client-side auth widget so public pages stay fully static — the session
 * is read in the browser, never in the layout.
 */
export function UserMenu() {
  const router = useRouter();
  const { user, ready } = useUser();

  // Reserve the space to avoid layout shift while checking.
  if (!ready) return <span aria-hidden="true" className="h-8 w-16" />;

  if (!user)
    return (
      <Button asChild size="sm">
        <Link href="/login">Sign in</Link>
      </Button>
    );

  const name =
    (user.user_metadata.full_name as string | undefined) ??
    user.email ??
    "you";
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="rounded-full outline-none ring-ballpoint focus-visible:ring-2"
      >
        <Avatar className="size-8 border border-rule">
          <AvatarImage
            src={(user.user_metadata.avatar_url as string) ?? undefined}
            alt=""
          />
          <AvatarFallback className="bg-accent font-mono text-xs text-accent-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound className="size-4" aria-hidden="true" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
