"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/auth/google-button";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  fullName: z.string().min(2, "Tell us your name — it goes on your plan."),
  email: z.string().email("That email doesn't look right."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "";

  const [values, setValues] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(
          next || "/onboarding"
        )}`,
      },
    });

    if (error) {
      setLoading(false);
      setFormError(
        error.message.includes("already registered")
          ? "This email already has an account — sign in instead."
          : "Couldn't create the account. Wait a moment and try again."
      );
      return;
    }

    // Email confirmation off → session exists, go straight to onboarding.
    if (data.session) {
      router.push(next || "/onboarding");
      router.refresh();
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-md border border-verdict/40 bg-verdict/5 p-4">
        <MailCheck className="size-5 text-verdict" aria-hidden="true" />
        <p className="mt-2 font-medium">Check your inbox.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a verification link to{" "}
          <span className="font-medium text-foreground">{values.email}</span>.
          Click it and you land straight in onboarding. Check spam if it
          hides.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GoogleButton next={next || "/onboarding"} />
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-rule" />
        <span className="font-mono text-[11px] uppercase text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-rule" />
      </div>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Your name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            value={values.fullName}
            onChange={(e) =>
              setValues((v) => ({ ...v, fullName: e.target.value }))
            }
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && (
            <p className="text-sm text-margin">{errors.fullName}</p>
          )}
        </div>
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
            autoComplete="new-password"
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
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
