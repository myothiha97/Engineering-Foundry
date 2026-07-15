import { spawnSync } from "node:child_process";

import { goLessons } from "../content";
import { normalizeStage, type StageExample } from "../packages/content-schema/src/index";

type Candidate = { location: string; example: StageExample };

const candidates: Candidate[] = [];

for (const lesson of goLessons) {
  for (const [stageId, stageValue] of Object.entries(lesson.sections)) {
    const stage = normalizeStage(stageValue);
    if (stage.example?.language.toLowerCase() === "go") {
      candidates.push({ location: `${lesson.id}/${stageId}`, example: stage.example });
    }
    for (const [blockIndex, block] of (stage.blocks ?? []).entries()) {
      if (block.type === "example" && block.example.language.toLowerCase() === "go") {
        candidates.push({
          location: `${lesson.id}/${stageId}/example-${blockIndex + 1}`,
          example: block.example,
        });
      }
    }
  }
}

function parsesWithGofmt(source: string) {
  return spawnSync("gofmt", { input: source, encoding: "utf8" }).status === 0;
}

const failures: string[] = [];
for (const { location, example } of candidates) {
  const code = example.code.trim();
  const variants = /(?:^|\n)package\s+\w+/.test(code)
    ? [code]
    : [`package snippet\n\n${code}`, `package snippet\n\nfunc example() {\n${code}\n}`];

  if (!variants.some(parsesWithGofmt)) {
    failures.push(`${location}: ${example.title}`);
  }
}

if (failures.length > 0) {
  throw new Error(`Go example syntax audit failed:\n- ${failures.join("\n- ")}`);
}

console.log(`Parsed ${candidates.length} structured Go examples with gofmt.`);
