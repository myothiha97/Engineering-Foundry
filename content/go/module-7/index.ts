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
  title: "Testing & Tooling",
  order: 7,
  description:
    "Table-driven tests, benchmarks, fuzzing, test doubles, vet/coverage/linting, and pprof profiling.",
  lessonIds: [
    "go-unit-table-tests",
    "go-benchmarks",
    "go-fuzzing",
    "go-mocks-fakes",
    "go-vet-coverage",
    "go-profiling-pprof",
  ],
  projectId: "go-tested-profiled-core",
};
