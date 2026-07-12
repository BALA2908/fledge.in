import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side content queries — plain anon client (no cookies), so RLS
 * applies, problems are read exclusively through the problems_public view,
 * and the queries work inside generateStaticParams (no request scope).
 * All pages using these are static + revalidated, so each query runs
 * rarely, not per-request.
 */
function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export type PathwayCard = {
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  sort: number;
  moduleCount: number;
  topicCount: number;
  estHours: number;
};

export type RoadmapTopic = {
  id: string;
  slug: string;
  title: string;
  est_minutes: number;
  is_core: boolean;
  sort: number;
};

export type RoadmapModule = {
  slug: string;
  title: string;
  description: string | null;
  est_hours: number | null;
  sort: number;
  topics: RoadmapTopic[];
};

export type PathwayDetail = {
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  outcomes: string[];
  modules: RoadmapModule[];
};

export type TopicResource = {
  id: string;
  type: "video" | "doc" | "article" | "course";
  title: string;
  url: string;
  source: string | null;
  language: "english" | "tamil" | "hindi";
  minutes: number | null;
  depth: "intro" | "deep";
  is_verified: boolean;
  sort: number;
};

export type TopicDetail = {
  slug: string;
  title: string;
  summary_md: string | null;
  tips: string[];
  est_minutes: number;
  is_core: boolean;
  id: string;
  resources: TopicResource[];
  module: { slug: string; title: string };
  pathway: { slug: string; title: string };
  /** slugs of the previous/next topic within the same pathway, for footer nav */
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

export type ProblemListItem = {
  id: string;
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  kind: "coding" | "mcq";
  tags: string[];
  topic_slugs: string[];
  pathway_slugs: string[];
};

export async function getPathways(): Promise<PathwayCard[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pathways")
    .select(
      "slug, title, tagline, description, sort, modules(est_hours, topics(id, est_minutes))"
    )
    .order("sort");
  if (error) throw new Error(`getPathways: ${error.message}`);

  return (data ?? []).map((p) => {
    const modules = p.modules ?? [];
    const topics = modules.flatMap((m) => m.topics ?? []);
    const estFromModules = modules.reduce(
      (sum, m) => sum + (Number(m.est_hours) || 0),
      0
    );
    const estFromTopics =
      topics.reduce((sum, t) => sum + (t.est_minutes || 0), 0) / 60;
    return {
      slug: p.slug,
      title: p.title,
      tagline: p.tagline,
      description: p.description,
      sort: p.sort,
      moduleCount: modules.length,
      topicCount: topics.length,
      estHours: Math.round(estFromModules || estFromTopics),
    };
  });
}

export async function getPathway(slug: string): Promise<PathwayDetail | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pathways")
    .select(
      `slug, title, tagline, description, outcomes,
       modules(slug, title, description, est_hours, sort,
         topics(id, slug, title, est_minutes, is_core, sort))`
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getPathway(${slug}): ${error.message}`);
  if (!data) return null;

  const modules = (data.modules ?? [])
    .map((m) => ({
      slug: m.slug,
      title: m.title,
      description: m.description,
      est_hours: m.est_hours === null ? null : Number(m.est_hours),
      sort: m.sort,
      topics: (m.topics ?? []).sort((a, b) => a.sort - b.sort),
    }))
    .sort((a, b) => a.sort - b.sort);

  return {
    slug: data.slug,
    title: data.title,
    tagline: data.tagline,
    description: data.description,
    outcomes: data.outcomes ?? [],
    modules,
  };
}

export async function getTopic(
  pathwaySlug: string,
  topicSlug: string
): Promise<TopicDetail | null> {
  // Fetch via the pathway so the URL is validated and prev/next come free.
  const pathway = await getPathway(pathwaySlug);
  if (!pathway) return null;

  const flat = pathway.modules.flatMap((m) =>
    m.topics.map((t) => ({ topic: t, module: m }))
  );
  const index = flat.findIndex((f) => f.topic.slug === topicSlug);
  if (index === -1) return null;
  const { module } = flat[index];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id, slug, title, summary_md, tips, est_minutes, is_core, resources(*)")
    .eq("slug", topicSlug)
    .maybeSingle();
  if (error) throw new Error(`getTopic(${topicSlug}): ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    summary_md: data.summary_md,
    tips: data.tips ?? [],
    est_minutes: data.est_minutes,
    is_core: data.is_core,
    resources: ((data.resources ?? []) as TopicResource[]).sort(
      (a, b) => a.sort - b.sort
    ),
    module: { slug: module.slug, title: module.title },
    pathway: { slug: pathway.slug, title: pathway.title },
    prev:
      index > 0
        ? { slug: flat[index - 1].topic.slug, title: flat[index - 1].topic.title }
        : null,
    next:
      index < flat.length - 1
        ? { slug: flat[index + 1].topic.slug, title: flat[index + 1].topic.title }
        : null,
  };
}

export async function getProblemsForTopic(
  topicSlug: string
): Promise<ProblemListItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("problems_public")
    .select("id, slug, title, difficulty, kind, tags, topic_slugs, pathway_slugs")
    .contains("topic_slugs", [topicSlug])
    .eq("kind", "coding")
    .order("difficulty");
  if (error) throw new Error(`getProblemsForTopic(${topicSlug}): ${error.message}`);
  return (data ?? []) as ProblemListItem[];
}

export type ProblemDetail = ProblemListItem & {
  statement_md: string | null;
  input_format_md: string | null;
  output_format_md: string | null;
  constraints_md: string | null;
  sample_tests: { input: string; output: string }[] | null;
  starter_code: Record<string, string> | null;
  mcq: {
    question_md: string;
    options: string[];
    correct_index: number;
    explanation_md: string;
  } | null;
  hints: string[];
  time_limit_ms: number;
};

export async function getProblem(slug: string): Promise<ProblemDetail | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("problems_public")
    .select(
      "id, slug, title, difficulty, kind, tags, topic_slugs, pathway_slugs, statement_md, input_format_md, output_format_md, constraints_md, sample_tests, starter_code, mcq, hints, time_limit_ms"
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getProblem(${slug}): ${error.message}`);
  return (data as ProblemDetail | null) ?? null;
}

export type SpeakingPrompt = {
  id: string;
  slug: string;
  kind: "hr_question" | "reading_passage";
  title: string;
  prompt_md: string;
  tips: string[];
  sort: number;
};

export async function getSpeakingPrompts(): Promise<SpeakingPrompt[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("speaking_prompts")
    .select("id, slug, kind, title, prompt_md, tips, sort")
    .eq("is_published", true)
    .order("sort");
  if (error) throw new Error(`getSpeakingPrompts: ${error.message}`);
  return (data ?? []) as SpeakingPrompt[];
}

export async function getSpeakingPrompt(
  slug: string
): Promise<SpeakingPrompt | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("speaking_prompts")
    .select("id, slug, kind, title, prompt_md, tips, sort")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(`getSpeakingPrompt(${slug}): ${error.message}`);
  return (data as SpeakingPrompt | null) ?? null;
}

export type DiagnosticMcq = {
  slug: string;
  module_slug: string;
  mcq: {
    question_md: string;
    options: string[];
    correct_index: number;
    explanation_md: string;
  };
};

/** Diagnostic MCQs for a pathway (2 per module), for the onboarding check. */
export async function getDiagnosticMcqs(
  pathwaySlug: string
): Promise<DiagnosticMcq[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("problems_public")
    .select("slug, module_slug, mcq")
    .eq("kind", "mcq")
    .eq("diagnostic", true)
    .contains("pathway_slugs", [pathwaySlug])
    .order("slug");
  if (error) throw new Error(`getDiagnosticMcqs(${pathwaySlug}): ${error.message}`);
  return (data ?? []).filter((d) => d.module_slug && d.mcq) as DiagnosticMcq[];
}

export async function getCodingProblems(): Promise<ProblemListItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("problems_public")
    .select("id, slug, title, difficulty, kind, tags, topic_slugs, pathway_slugs")
    .eq("kind", "coding")
    .order("title");
  if (error) throw new Error(`getCodingProblems: ${error.message}`);
  return (data ?? []) as ProblemListItem[];
}
