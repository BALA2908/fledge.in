"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/auth/google-button";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("That email doesn't look right."),
  password: z.string().min(1, "Type your password."),
});

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const urlError = params.get("error");

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(urlError);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        fieldErrors[String(issue.path[0])] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      setLoading(false);
      setFormError(
        error.message.includes("Invalid login credentials")
          ? "Email and password don't match. Check for typos and try again."
          : error.message.includes("Email not confirmed")
            ? "Your email isn't verified yet — find our mail in your inbox and click the link."
            : "Sign-in failed. Wait a moment and try again."
      );
      return;
    }
    router.push(next || "/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {next && (
        <p className="rounded-md bg-accent/70 px-3 py-2 text-sm text-accent-foreground">
          {next.startsWith("/dashboard")
            ? "Your dashboard is personal — sign in and it opens."
            : next.startsWith("/onboarding")
              ? "Sign in first, then we'll set up your plan."
              : "Sign in and you'll land right where you were headed."}
        </p>
      )}
      <GoogleButton next={next || undefined} />
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-rule" />
        <span className="font-mono text-[11px] uppercase text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-rule" />
      </div>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="text-sm text-margin">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(e) =>
              setValues((v) => ({ ...v, password: e.target.value }))
            }
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-sm text-margin">{errors.password}</p>
          )}
        </div>
        {formError && (
          <p role="alert" className="text-sm text-margin">
            {formError}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        First time here?{" "}
        <Link
          href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create your account
        </Link>
      </p>
    </div>
  );
}
