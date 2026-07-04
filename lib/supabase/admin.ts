import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client — service role key. Bypasses RLS.
 * SERVER ONLY: used inside /api/submit and scripts/seed.ts.
 * Never import this from a client component. The runtime guard below is a
 * hard stop in case bundling ever pulls it browser-side.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient was called in the browser. This must never happen."
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Add them to .env.local (see .env.example)."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
