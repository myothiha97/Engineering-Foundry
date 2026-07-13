import type { CurriculumModule } from "../../../packages/content-schema/src/index";

export { goEscapeAnalysisDeep } from "./escape-analysis-deep";
export { goGcTuning } from "./gc-tuning";
export { goReflection } from "./reflection";
export { goUnsafeCgo } from "./unsafe-cgo";
export { goModulesAdvanced } from "./modules-advanced";

export const goModule8: CurriculumModule = {
  id: "go-8",
  courseId: "go",
  title: "Runtime, Performance & the Deep End",
  order: 8,
  description:
    "Escape analysis in depth, GC behavior & tuning, reflection, unsafe & cgo, and advanced modules/versioning.",
  lessonIds: [
    "go-escape-analysis-deep",
    "go-gc-tuning",
    "go-reflection",
    "go-unsafe-cgo",
    "go-modules-advanced",
  ],
  projectId: "go-ledger-core-optimized",
};
