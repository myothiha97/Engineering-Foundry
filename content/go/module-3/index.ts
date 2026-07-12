import type { CurriculumModule } from "../../../packages/content-schema/src/index";

export { goInterfaces } from "./interfaces";
export { goAssertionsSwitches } from "./assertions-switches";
export { goEmbedding } from "./embedding";
export { goGenerics } from "./generics";

export const goModule3: CurriculumModule = {
  id: "go-3",
  courseId: "go",
  title: "Type System & Abstraction",
  order: 3,
  description: "Interfaces, method sets, type assertions, embedding, and generics.",
  lessonIds: ["go-interfaces", "go-assertions-switches", "go-embedding", "go-generics"],
  projectId: "go-transaction-engine",
};
