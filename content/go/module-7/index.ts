import type { CurriculumModule } from "../../../packages/content-schema/src/index";

export { goUnitTableTests } from "./unit-table-tests";
export { goBenchmarks } from "./benchmarks";
export { goFuzzing } from "./fuzzing";
export { goMocksFakes } from "./mocks-fakes";
export { goVetCoverage } from "./vet-coverage";
export { goProfilingPprof } from "./profiling-pprof";

export const goModule7: CurriculumModule = {
  id: "go-7",
  courseId: "go",
  title: "Advanced Testing & Diagnostics — Optional",
  order: 7,
  description: "Benchmarks, fuzzing, test doubles, vet/coverage/linting, and pprof profiling.",
  lessonIds: [
    "go-benchmarks",
    "go-fuzzing",
    "go-mocks-fakes",
    "go-vet-coverage",
    "go-profiling-pprof",
  ],
  projectId: "go-tested-profiled-core",
};
