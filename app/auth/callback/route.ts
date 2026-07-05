import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth + email-confirmation landing point. Exchanges the auth code for a
 * session, then sends the user on: brand-new users go to onboarding,
 * returning users to wherever they were headed.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If the user has no plan yet, onboarding is the right landing spot.
      let target = next;
      if (!target) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: plan } = await supabase
            .from("user_plans")
            .select("id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();
          target = plan ? "/dashboard" : "/onboarding";
        } else {
          target = "/dashboard";
        }
      }
      // Respect the deployment host behind Vercel's proxy.
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = process.env.NODE_ENV === "development";
      if (isLocal) return NextResponse.redirect(`${origin}${target}`);
      if (forwardedHost)
        return NextResponse.redirect(`https://${forwardedHost}${target}`);
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=That sign-in link didn't work. Try again.`
  );
}
