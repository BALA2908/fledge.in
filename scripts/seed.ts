/**
 * Seed script — reads content/**\/*.json, validates with zod, upserts into
 * Supabase via the admin client. Idempotent: safe to run repeatedly.
 *
 *   npm run db:seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { ZodError, ZodType } from "zod";
import { createAdminClient } from "../lib/supabase/admin";
import {
  pathwaySchema,
  problemSchema,
  speakingPromptSchema,
  type PathwayContent,
  type ProblemContent,
  type SpeakingPromptContent,
} from "../types/content";

const CONTENT_DIR = join(process.cwd(), "content");

function walkJsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  let files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files = files.concat(walkJsonFiles(full));
    else if (entry.endsWith(".json")) files.push(full);
  }
  return files.sort();
}

function fail(message: string): never {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((i) => `  at ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

function loadAndValidate<T>(file: string, schema: ZodType<T>): T {
  const rel = relative(process.cwd(), file);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf-8"));
  } catch (e) {
    fail(`${rel} is not valid JSON:\n  ${(e as Error).message}`);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    fail(`${rel} failed validation:\n${formatZodError(parsed.error)}`);
  }
  return parsed.data;
}

async function seedPathway(
  supabase: ReturnType<typeof createAdminClient>,
  pathway: PathwayContent
) {
  const { data: pathwayRow, error: pathwayError } = await supabase
    .from("pathways")
    .upsert(
      {
        slug: pathway.slug,
        title: pathway.title,
        tagline: pathway.tagline ?? null,
        description: pathway.description ?? null,
        outcomes: pathway.outcomes,
        is_published: pathway.is_published,
        sort: pathway.sort,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();
  if (pathwayError) fail(`upsert pathway "${pathway.slug}": ${pathwayError.message}`);

  for (const [moduleSort, mod] of pathway.modules.entries()) {
    const { data: moduleRow, error: moduleError } = await supabase
      .from("modules")
      .upsert(
        {
          pathway_id: pathwayRow.id,
          slug: mod.slug,
          sort: moduleSort,
          title: mod.title,
          description: mod.description ?? null,
          est_hours: mod.est_hours ?? null,
        },
        { onConflict: "pathway_id,slug" }
      )
      .select("id")
      .single();
    if (moduleError) fail(`upsert module "${mod.slug}": ${moduleError.message}`);

    for (const [topicSort, topic] of mod.topics.entries()) {
      const { data: topicRow, error: topicError } = await supabase
        .from("topics")
        .upsert(
          {
            module_id: moduleRow.id,
            slug: topic.slug,
            sort: topicSort,
            title: topic.title,
            summary_md: topic.summary_md,
            tips: topic.tips,
            est_minutes: topic.est_minutes,
            is_core: topic.is_core,
          },
          { onConflict: "slug" }
        )
        .select("id")
        .single();
      if (topicError) fail(`upsert topic "${topic.slug}": ${topicError.message}`);

      // Resources have no natural key — replace the topic's set wholesale.
      // Nothing references resources by id, so this stays idempotent and clean.
      const { error: deleteError } = await supabase
        .from("resources")
        .delete()
        .eq("topic_id", topicRow.id);
      if (deleteError) fail(`clear resources for "${topic.slug}": ${deleteError.message}`);

      if (topic.resources.length > 0) {
        const { error: insertError } = await supabase.from("resources").insert(
          topic.resources.map((r, sort) => ({
            topic_id: topicRow.id,
            type: r.type,
            title: r.title,
            url: r.url,
            source: r.source ?? null,
            language: r.language,
            minutes: r.minutes ?? null,
            depth: r.depth,
            is_verified: r.is_verified,
            sort,
          }))
        );
        if (insertError) fail(`insert resources for "${topic.slug}": ${insertError.message}`);
      }
    }
  }
}

async function seedProblem(
  supabase: ReturnType<typeof createAdminClient>,
  problem: ProblemContent
) {
  const isCoding = problem.kind === "coding";
  const { error } = await supabase.from("problems").upsert(
    {
      slug: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty,
      kind: problem.kind,
      statement_md: problem.statement_md ?? null,
      input_format_md: isCoding ? problem.input_format_md : null,
      output_format_md: isCoding ? problem.output_format_md : null,
      constraints_md: isCoding ? (problem.constraints_md ?? null) : null,
      sample_tests: isCoding ? problem.sample_tests : null,
      hidden_tests: isCoding ? problem.hidden_tests : null,
      starter_code: isCoding ? problem.starter_code : null,
      reference_solution: isCoding ? problem.reference_solution : null,
      mcq: isCoding ? null : problem.mcq,
      hints: problem.hints,
      tags: problem.tags,
      topic_slugs: problem.topic_slugs,
      pathway_slugs: problem.pathway_slugs,
      module_slug: problem.module_slug ?? null,
      diagnostic: problem.diagnostic,
      time_limit_ms: isCoding ? problem.time_limit_ms : 4000,
      is_published: problem.is_published,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "slug" }
  );
  if (error) fail(`upsert problem "${problem.slug}": ${error.message}`);
}

async function seedSpeakingPrompt(
  supabase: ReturnType<typeof createAdminClient>,
  prompt: SpeakingPromptContent
) {
  const { error } = await supabase.from("speaking_prompts").upsert(
    {
      slug: prompt.slug,
      kind: prompt.kind,
      title: prompt.title,
      prompt_md: prompt.prompt_md,
      tips: prompt.tips,
      sort: prompt.sort,
      is_published: prompt.is_published,
    },
    { onConflict: "slug" }
  );
  if (error) fail(`upsert speaking prompt "${prompt.slug}": ${error.message}`);
}

async function main() {
  const supabase = createAdminClient();

  const pathwayFiles = walkJsonFiles(join(CONTENT_DIR, "pathways"));
  const problemFiles = walkJsonFiles(join(CONTENT_DIR, "problems"));
  const speakingFiles = walkJsonFiles(join(CONTENT_DIR, "speaking"));

  console.log(
    `Seeding ${pathwayFiles.length} pathway file(s), ${problemFiles.length} problem file(s), ${speakingFiles.length} speaking file(s)…`
  );

  // Validate everything first — no partial writes on a broken content set.
  const pathways = pathwayFiles.map((f) => ({
    file: f,
    data: loadAndValidate(f, pathwaySchema),
  }));
  const problems = problemFiles.map((f) => ({
    file: f,
    data: loadAndValidate(f, problemSchema),
  }));
  // Speaking files are ARRAYS of prompts.
  const speakingPrompts = speakingFiles.flatMap((f) => {
    const raw = JSON.parse(readFileSync(f, "utf-8"));
    if (!Array.isArray(raw)) fail(`${relative(process.cwd(), f)} must be a JSON array of prompts`);
    return (raw as unknown[]).map((entry) => {
      const parsed = speakingPromptSchema.safeParse(entry);
      if (!parsed.success)
        fail(
          `${relative(process.cwd(), f)} has an invalid prompt:\n${parsed.error.issues
            .map((i) => `  at ${i.path.join(".") || "(root)"}: ${i.message}`)
            .join("\n")}`
        );
      return { file: f, data: parsed.data };
    });
  });

  const slugCounts = new Map<string, number>();
  for (const { data } of problems) {
    slugCounts.set(data.slug, (slugCounts.get(data.slug) ?? 0) + 1);
  }
  for (const [slug, count] of slugCounts) {
    if (count > 1) fail(`duplicate problem slug "${slug}" appears in ${count} files`);
  }

  const speakingSlugs = new Map<string, number>();
  for (const { data } of speakingPrompts)
    speakingSlugs.set(data.slug, (speakingSlugs.get(data.slug) ?? 0) + 1);
  for (const [slug, count] of speakingSlugs)
    if (count > 1) fail(`duplicate speaking prompt slug "${slug}" appears ${count} times`);

  for (const { file, data } of pathways) {
    await seedPathway(supabase, data);
    console.log(`✅ pathway ${data.slug} (${relative(process.cwd(), file)})`);
  }
  for (const { file, data } of problems) {
    await seedProblem(supabase, data);
    console.log(`✅ problem ${data.slug} (${relative(process.cwd(), file)})`);
  }
  for (const { data } of speakingPrompts) {
    await seedSpeakingPrompt(supabase, data);
  }
  if (speakingPrompts.length > 0)
    console.log(`✅ ${speakingPrompts.length} speaking prompts`);

  console.log("\nDone. Seeding is idempotent — run it again any time.");
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
