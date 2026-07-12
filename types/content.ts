import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------
const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case");

// ---------------------------------------------------------------------------
// Pathway JSON (content/pathways/*.json) — PLAN.md §4 + §5
// ---------------------------------------------------------------------------
export const resourceSchema = z.object({
  type: z.enum(["video", "doc", "article", "course"]),
  title: z.string().min(1),
  url: z.string().min(1), // "TODO" allowed for unverified YouTube links
  source: z.string().optional(),
  language: z.enum(["english", "tamil", "hindi"]),
  minutes: z.number().int().positive().optional(),
  depth: z.enum(["intro", "deep"]).default("intro"),
  is_verified: z.boolean().default(false),
});

export const topicSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  summary_md: z.string().min(1),
  tips: z.array(z.string()).default([]),
  est_minutes: z.number().int().positive(),
  is_core: z.boolean().default(true),
  resources: z.array(resourceSchema).default([]),
});

export const moduleSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  est_hours: z.number().positive().optional(),
  topics: z.array(topicSchema).min(1),
});

export const pathwaySchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  tagline: z.string().optional(),
  description: z.string().optional(),
  outcomes: z.array(z.string()).default([]),
  is_published: z.boolean().default(false),
  sort: z.number().int().default(0),
  modules: z.array(moduleSchema).min(1),
});

// ---------------------------------------------------------------------------
// Problem JSON (content/problems/**/*.json) — PLAN.md §5 example shape
// ---------------------------------------------------------------------------
export const testCaseSchema = z.object({
  input: z.string(),
  output: z.string(),
});

const problemBaseSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  hints: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  topic_slugs: z.array(slugSchema).default([]),
  pathway_slugs: z.array(slugSchema).default([]),
  module_slug: slugSchema.optional(),
  diagnostic: z.boolean().default(false),
  is_published: z.boolean().default(true),
});

export const codingProblemSchema = problemBaseSchema.extend({
  kind: z.literal("coding"),
  statement_md: z.string().min(1),
  input_format_md: z.string().min(1),
  output_format_md: z.string().min(1),
  constraints_md: z.string().optional(),
  sample_tests: z.array(testCaseSchema).min(1),
  hidden_tests: z.array(testCaseSchema).min(1),
  starter_code: z.record(z.string(), z.string()),
  reference_solution: z.record(z.string(), z.string()),
  time_limit_ms: z.number().int().positive().default(4000),
});

export const mcqProblemSchema = problemBaseSchema.extend({
  kind: z.literal("mcq"),
  statement_md: z.string().optional(),
  mcq: z
    .object({
      question_md: z.string().min(1),
      options: z.array(z.string()).min(2),
      correct_index: z.number().int().nonnegative(),
      explanation_md: z.string().min(1),
    })
    .refine((m) => m.correct_index < m.options.length, {
      message: "correct_index is out of range for options",
      path: ["correct_index"],
    }),
});

export const problemSchema = z.discriminatedUnion("kind", [
  codingProblemSchema,
  mcqProblemSchema,
]);

// ---------------------------------------------------------------------------
// Speaking prompt JSON (content/speaking/*.json) — PLAN.md §4 + Phase 6
// ---------------------------------------------------------------------------
export const speakingPromptSchema = z.object({
  slug: slugSchema,
  kind: z.enum(["hr_question", "reading_passage"]),
  title: z.string().min(1),
  prompt_md: z.string().min(1),
  tips: z.array(z.string()).default([]),
  sort: z.number().int().default(0),
  is_published: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Inferred TS types
// ---------------------------------------------------------------------------
export type SpeakingPromptContent = z.infer<typeof speakingPromptSchema>;
export type ResourceContent = z.infer<typeof resourceSchema>;
export type TopicContent = z.infer<typeof topicSchema>;
export type ModuleContent = z.infer<typeof moduleSchema>;
export type PathwayContent = z.infer<typeof pathwaySchema>;
export type TestCase = z.infer<typeof testCaseSchema>;
export type CodingProblemContent = z.infer<typeof codingProblemSchema>;
export type McqProblemContent = z.infer<typeof mcqProblemSchema>;
export type ProblemContent = z.infer<typeof problemSchema>;
