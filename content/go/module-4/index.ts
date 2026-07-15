import type { CurriculumModule } from "../../../packages/content-schema/src/index";

export { goErrorValues } from "./error-values";
export { goErrorWrapping } from "./error-wrapping";
export { goPanicRecover } from "./panic-recover";
export { goDependencyDirection } from "./dependency-direction";

export const goModule4: CurriculumModule = {
  id: "go-4",
  courseId: "go",
  title: "Errors & Program Design",
  order: 4,
  description: "Error values, wrapping and inspection, panic/recover, and dependency direction.",
  lessonIds: [
    "go-error-values",
    "go-error-wrapping",
    "go-panic-recover",
    "go-dependency-direction",
  ],
  projectId: "go-transaction-validator",
};
