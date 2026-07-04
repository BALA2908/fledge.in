/**
 * Proves the anon key can NEVER read judge secrets.
 *
 *   npm run verify:rls
 *
 * Checks, using only NEXT_PUBLIC_SUPABASE_ANON_KEY:
 *   1. selecting from the problems TABLE fails (grant revoked)
 *   2. selecting hidden_tests / reference_solution anywhere fails
 *   3. the problems_public VIEW works and exposes no secret columns
 *
 * Exits 1 if any secret is reachable.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    "❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
  process.exit(1);
}

const anon = createClient(url, anonKey);

let failures = 0;

function pass(msg: string) {
  console.log(`✅ ${msg}`);
}
function fail(msg: string) {
  console.error(`❌ ${msg}`);
  failures++;
}

async function main() {
  // 1. Direct table select must be blocked entirely.
  {
    const { data, error } = await anon.from("problems").select("slug").limit(1);
    if (error) pass(`problems table is not readable with anon key (${error.code}: ${error.message})`);
    else if (data && data.length === 0)
      // RLS with no policy returns empty rather than erroring — still means no rows leak,
      // but the grant revoke should make it a hard error. Flag it.
      fail("problems table select returned an empty result instead of a permission error — expected the grant to be revoked");
    else fail("problems table IS readable with the anon key!");
  }

  // 2. hidden_tests via the table.
  {
    const { data, error } = await anon.from("problems").select("hidden_tests").limit(1);
    if (error) pass(`hidden_tests is not readable via the problems table (${error.code})`);
    else if (data && data.length > 0 && data.some((r) => r.hidden_tests != null))
      fail("hidden_tests IS readable via the problems table!");
    else pass("hidden_tests query returned no data via the problems table");
  }

  // 3. reference_solution via the table.
  {
    const { data, error } = await anon.from("problems").select("reference_solution").limit(1);
    if (error) pass(`reference_solution is not readable via the problems table (${error.code})`);
    else if (data && data.length > 0 && data.some((r) => r.reference_solution != null))
      fail("reference_solution IS readable via the problems table!");
    else pass("reference_solution query returned no data via the problems table");
  }

  // 4. The view must work…
  {
    const { data, error } = await anon.from("problems_public").select("slug, title").limit(5);
    if (error) fail(`problems_public view is NOT readable with anon key: ${error.message}`);
    else pass(`problems_public view is readable (${data?.length ?? 0} row(s)) — the app's read path works`);
  }

  // 5. …but must not carry the secret columns.
  for (const col of ["hidden_tests", "reference_solution"] as const) {
    const { data, error } = await anon.from("problems_public").select(col).limit(1);
    if (error) pass(`problems_public has no "${col}" column (${error.code})`);
    else if (data && data.some((r) => (r as Record<string, unknown>)[col] != null))
      fail(`problems_public EXPOSES ${col}!`);
    else pass(`problems_public returned no "${col}" data`);
  }

  console.log(
    failures === 0
      ? "\n🔒 All checks passed — judge secrets are unreachable with the anon key."
      : `\n🚨 ${failures} check(s) FAILED — do not ship until this is fixed.`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(`❌ ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
