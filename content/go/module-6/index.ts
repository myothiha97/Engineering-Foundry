import type { CurriculumModule } from "../../../packages/content-schema/src/index";

export { goGoroutinesScheduler } from "./goroutines-scheduler";
export { goChannelsSelect } from "./channels-select";
export { goSyncAtomic } from "./sync-atomic";
export { goContextCancellation } from "./context-cancellation";
export { goConcurrencyPatterns } from "./concurrency-patterns";

export const goModule6: CurriculumModule = {
  id: "go-6",
  courseId: "go",
  title: "Concurrency",
  order: 6,
  description:
    "Goroutines, the scheduler, channels, sync primitives, context, races, and patterns.",
  lessonIds: [
    "go-goroutines-scheduler",
    "go-channels-select",
    "go-sync-atomic",
    "go-context-cancellation",
    "go-concurrency-patterns",
  ],
  projectId: "go-concurrent-processor",
};
