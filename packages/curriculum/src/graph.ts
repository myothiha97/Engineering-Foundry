import type { Curriculum, CurriculumTopic } from "./types";

export type TopicRef = CurriculumTopic & { moduleId: string; moduleTitle: string };

/** Flatten every topic with its module context, in curriculum order. */
export function allTopics(curriculum: Curriculum): TopicRef[] {
  return curriculum.modules
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((m) =>
      m.topics.map((t) => ({ ...t, moduleId: m.id, moduleTitle: m.title })),
    );
}

/** Validate the prerequisite graph: every prereq must exist and there are no cycles. */
export function validateGraph(curriculum: Curriculum): { ok: boolean; errors: string[] } {
  const topics = allTopics(curriculum);
  const ids = new Set(topics.map((t) => t.id));
  const errors: string[] = [];

  for (const t of topics) {
    for (const p of t.prerequisites) {
      if (!ids.has(p)) errors.push(`Unknown prerequisite "${p}" in topic "${t.id}"`);
    }
  }

  // cycle detection via DFS colouring
  const color = new Map<string, 0 | 1 | 2>();
  const byId = new Map(topics.map((t) => [t.id, t]));
  const visit = (id: string): boolean => {
    color.set(id, 1);
    for (const p of byId.get(id)?.prerequisites ?? []) {
      if (!byId.has(p)) continue;
      const c = color.get(p) ?? 0;
      if (c === 1) {
        errors.push(`Prerequisite cycle involving "${id}" → "${p}"`);
        return true;
      }
      if (c === 0 && visit(p)) return true;
    }
    color.set(id, 2);
    return false;
  };
  for (const t of topics) if ((color.get(t.id) ?? 0) === 0) visit(t.id);

  return { ok: errors.length === 0, errors };
}

/** Topics whose prerequisites are all mastered — a recommendation, not a lock. */
export function availableTopics(curriculum: Curriculum, mastered: Set<string>): TopicRef[] {
  return allTopics(curriculum).filter((t) => t.prerequisites.every((p) => mastered.has(p)));
}
