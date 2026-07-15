import { normalizeStage, validateCurriculum } from "../packages/content-schema/src/index";
import { backendModule0, backendProcessToService, goContentModules, goLessons } from "../content";

const result = validateCurriculum(
  [...goLessons, backendProcessToService],
  [...goContentModules, backendModule0],
);

const requiredBeginnerStages = [
  "problem",
  "mental-model",
  "mechanics",
  "implementation",
  "failure-cases",
  "design",
  "summary",
] as const;

const qualityErrors: string[] = [];
for (const lesson of goLessons) {
  const officialReferences = lesson.references.filter((reference) => {
    const hostname = new URL(reference.url).hostname;
    return hostname === "go.dev" || hostname === "pkg.go.dev";
  });
  if (officialReferences.length < 2) {
    qualityErrors.push(`${lesson.id}: needs at least two official Go references`);
  }

  for (const stage of requiredBeginnerStages) {
    if (!lesson.sections[stage]) {
      qualityErrors.push(`${lesson.id}: missing core stage ${stage}`);
    }
  }

  if (/ledgerflow/i.test(JSON.stringify(lesson))) {
    qualityErrors.push(`${lesson.id}: contains project-specific LedgerFlow content`);
  }

  for (const [stage, value] of Object.entries(lesson.sections)) {
    const { body } = normalizeStage(value);
    if (/\n(?:-|\*|\d+\.)\s/.test(body)) {
      qualityErrors.push(
        `${lesson.id}/${stage}: put lists in a points block instead of a prose paragraph`,
      );
    }

    for (const paragraph of body.split(/\n\s*\n/).filter(Boolean)) {
      if (paragraph.includes("```")) continue;
      const words = paragraph
        .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/[*_`#>-]/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      if (words >= 100) {
        qualityErrors.push(
          `${lesson.id}/${stage}: ${words}-word paragraph exceeds the 99-word readability limit`,
        );
      }
    }
  }
}

if (qualityErrors.length) {
  throw new Error(`Go content quality checks failed:\n- ${qualityErrors.join("\n- ")}`);
}

console.log(`Validated ${result.lessons.length} lessons across ${result.modules.length} modules.`);
console.log(
  `Checked ${goLessons.length} Go lessons for official references, core stages, project neutrality, and paragraph density.`,
);
