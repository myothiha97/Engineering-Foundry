import type { CurriculumModule } from "../../../packages/content-schema/src/index";

export { goGcTuning } from "./gc-tuning";
export { goReflection } from "./reflection";
export { goUnsafeCgo } from "./unsafe-cgo";
export { goModulesAdvanced } from "./modules-advanced";

export const goModule8: CurriculumModule = {
  id: "go-8",
  courseId: "go",
  title: "Advanced Go — Optional Deep Dives",
  order: 8,
  description: "GC behavior, reflection, unsafe and cgo, plus advanced module versioning.",
  lessonIds: [
    "go-toolchain-modules",
    "go-gc-tuning",
    "go-reflection",
    "go-unsafe-cgo",
    "go-modules-advanced",
  ],
  projectId: "go-performance-lab",
};
