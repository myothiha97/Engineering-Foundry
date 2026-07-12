import type { CurriculumModule } from "../../../packages/content-schema/src/index";

export { goBasicTypes } from "./basic-types";
export { goCopySemantics } from "./copy-semantics";
export { goFunctionsDefer } from "./functions-defer";
export { goControlFlow } from "./control-flow";

export const goModule1: CurriculumModule = {
  id: "go-1",
  courseId: "go",
  title: "Values & Program Execution",
  order: 1,
  description:
    "The value model: types, zero values, constants, copy semantics, functions, and control flow.",
  lessonIds: ["go-basic-types", "go-copy-semantics", "go-functions-defer", "go-control-flow"],
  projectId: "go-data-transform-cli",
};
