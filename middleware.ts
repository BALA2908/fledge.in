import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only the routes that need a session: protected pages, auth pages
  // (for the logged-in redirect), and auth/api endpoints. Public content
  // pages stay fully static and never touch cookies.
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/profile/:path*",
    "/login",
    "/signup",
    "/api/run/:path*",
    "/api/submit/:path*",
  ],
};
