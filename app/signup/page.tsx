import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create your Fledge account — pick a path, get a plan, start walking.",
};

export default function SignupPage() {
  return (
    <div>
      <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-lg border border-rule bg-card p-6 shadow-sm sm:p-8">
          <p aria-hidden="true" className="-rotate-2 font-hand text-xl text-margin/80">
            day 1 starts here —
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Two minutes to a plan that knows your target date.
          </p>
          <div className="mt-6">
            <Suspense>
              <SignupForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
