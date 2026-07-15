import type { CurriculumModule } from "../../../packages/content-schema/src/index";

export { goSlices } from "./slices";
export { goMaps } from "./maps";
export { goStringsRunes } from "./strings-runes";
export { goStructsPointers } from "./structs-pointers";
export { goStackHeapEscape } from "./stack-heap-escape";

export const goModule2: CurriculumModule = {
  id: "go-2",
  courseId: "go",
  title: "Structs, Collections & Text",
  order: 2,
  description:
    "Model data with structs, then learn copying, slices, maps, UTF-8 text, and your first tests.",
  lessonIds: [
    "go-structs-pointers",
    "go-copy-semantics",
    "go-slices",
    "go-maps",
    "go-strings-runes",
    "go-unit-table-tests",
    "go-stack-heap-escape",
  ],
  projectId: "go-expense-manager",
};
