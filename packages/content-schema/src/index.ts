import { z } from "zod";

export const lessonStages = [
  "problem",
  "naive",
  "failure",
  "intuition",
  "mental-model",
  "mechanics",
  "diagram",
  "implementation",
  "experiment",
  "failure-cases",
  "trade-offs",
  "design",
  "ledgerflow",
  "exercises",
  "mastery",
  "summary",
] as const;

export const referenceSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  teaches: z.string().min(1),
  relevance: z.string().min(1),
  required: z.boolean(),
  section: z.string().min(1),
});

/** An external learning resource — docs, articles, and popular GitHub repos. */
export const resourceSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
  kind: z.enum(["repo", "doc", "article", "video", "book", "course", "tool", "playground"]),
  description: z.string().min(1),
  /** Optional display hint for repo popularity, e.g. "130k". */
  stars: z.string().optional(),
});
export type Resource = z.infer<typeof resourceSchema>;

export const exerciseSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "prediction",
    "code-reading",
    "implementation",
    "debugging",
    "refactoring",
    "design",
    "advanced",
  ]),
  prompt: z.string().min(1),
  starterCode: z.string().optional(),
  expectedAnswer: z.string().optional(),
  hints: z.array(z.string()).default([]),
});

export const masteryCriterionSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  kind: z.enum(["explain", "predict", "implement", "debug", "design"]),
  required: z.boolean().default(true),
});

/** A worked code example attached to a lesson stage. */
export const stageExampleSchema = z.object({
  title: z.string().min(1),
  language: z.string().min(1).default("go"),
  code: z.string().min(1),
  takeaway: z.string().min(1),
});

/** A concrete use-case scenario: a situation and the insight it surfaces. */
export const stageScenarioSchema = z.object({
  title: z.string().min(1),
  context: z.string().min(1),
  insight: z.string().min(1),
});

/** One node in an inline explanatory diagram. */
export const diagramNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().optional(),
  tone: z.enum(["default", "accent", "danger", "success", "muted"]).optional(),
});

/**
 * A small, declarative diagram rendered inline in an explanation. Layout is
 * derived from `kind` (no manual coordinates) so authors can add diagrams freely.
 * - flow: left-to-right boxes joined by arrows
 * - stack: top-to-bottom layers
 * - sequence: numbered vertical steps
 * - compare: two-column "before vs after" / "A vs B"
 */
export const stageDiagramSchema = z.object({
  title: z.string().optional(),
  kind: z.enum(["flow", "stack", "sequence", "compare"]).default("flow"),
  nodes: z.array(diagramNodeSchema).min(1),
  caption: z.string().optional(),
});

/** A short beginner-facing callout (tip, analogy, gotcha). */
export const stageNoteSchema = z.object({
  tone: z.enum(["tip", "analogy", "warning", "info"]).default("tip"),
  title: z.string().optional(),
  text: z.string().min(1),
});

/** An interleavable block so a stage can mix prose, diagrams, and examples in order. */
export const contentBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string().min(1) }),
  z.object({ type: z.literal("points"), items: z.array(z.string().min(1)).min(1) }),
  z.object({ type: z.literal("example"), example: stageExampleSchema }),
  z.object({ type: z.literal("scenario"), scenario: stageScenarioSchema }),
  z.object({ type: z.literal("diagram"), diagram: stageDiagramSchema }),
  z.object({ type: z.literal("note"), note: stageNoteSchema }),
]);

/**
 * Rich content for a single lesson stage. `body` is the lead explanation
 * (paragraphs separated by blank lines). `blocks` is the flexible, ordered body
 * used for beginner-friendly stages that interleave prose, diagrams, examples,
 * and callouts. The flat `keyPoints`/`example`/`scenario` fields remain for
 * simple stages and legacy content.
 */
export const stageContentSchema = z.object({
  body: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).optional(),
  example: stageExampleSchema.optional(),
  scenario: stageScenarioSchema.optional(),
  blocks: z.array(contentBlockSchema).optional(),
});

export type StageExample = z.infer<typeof stageExampleSchema>;
export type StageScenario = z.infer<typeof stageScenarioSchema>;
export type StageDiagram = z.infer<typeof stageDiagramSchema>;
export type DiagramNodeSpec = z.infer<typeof diagramNodeSchema>;
export type StageNote = z.infer<typeof stageNoteSchema>;
export type ContentBlock = z.infer<typeof contentBlockSchema>;
export type StageContent = z.infer<typeof stageContentSchema>;

/** A stage may be authored as a plain string (legacy) or as structured content. */
export const stageValueSchema = z.union([z.string(), stageContentSchema]);

/** Normalize either stage form into structured content for rendering. */
export function normalizeStage(value: string | StageContent | undefined): StageContent {
  if (value == null) return { body: "" };
  if (typeof value === "string") return { body: value };
  return value;
}

export const lessonSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  moduleId: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  prerequisites: z.array(z.string()),
  learningObjectives: z.array(z.string()).min(1),
  concepts: z.array(z.string()).min(1),
  ledgerFlowApplications: z.array(z.string()),
  references: z.array(referenceSchema),
  exercises: z.array(exerciseSchema).min(1),
  masteryCriteria: z.array(masteryCriterionSchema).min(1),
  sections: z.record(z.enum(lessonStages), stageValueSchema),
});

export type Lesson = z.infer<typeof lessonSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Reference = z.infer<typeof referenceSchema>;

export const moduleSchema = z.object({
  id: z.string(),
  courseId: z.enum(["go", "backend"]),
  title: z.string(),
  description: z.string(),
  order: z.number().int().nonnegative(),
  lessonIds: z.array(z.string()),
  projectId: z.string(),
});

export type CurriculumModule = z.infer<typeof moduleSchema>;

export function validateCurriculum(lessons: unknown[], modules: unknown[]) {
  const parsedLessons = z.array(lessonSchema).parse(lessons);
  const parsedModules = z.array(moduleSchema).parse(modules);
  const ids = new Set(parsedLessons.map((lesson) => lesson.id));
  for (const lesson of parsedLessons) {
    for (const prerequisite of lesson.prerequisites) {
      if (!ids.has(prerequisite))
        throw new Error(`Unknown prerequisite ${prerequisite} in ${lesson.id}`);
    }
  }
  for (const module of parsedModules) {
    for (const lessonId of module.lessonIds) {
      if (!ids.has(lessonId)) throw new Error(`Unknown lesson ${lessonId} in ${module.id}`);
    }
  }
  return { lessons: parsedLessons, modules: parsedModules };
}
