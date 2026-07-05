import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Fledge and pick up where you left off.",
};

export default function LoginPage() {
  return (
    <div>
      <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-lg border border-rule bg-card p-6 shadow-sm sm:p-8">
          <p aria-hidden="true" className="-rotate-2 font-hand text-xl text-margin/80">
            welcome back —
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your plan is where you left it.
          </p>
          <div className="mt-6">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
