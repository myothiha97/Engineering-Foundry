import type { CurriculumModule } from "../../../packages/content-schema/src/index";

export { goSlices } from "./slices";
export { goMaps } from "./maps";
export { goStringsRunes } from "./strings-runes";
export { goStructsPointers } from "./structs-pointers";
export { goStackHeapEscape } from "./stack-heap-escape";

export const goModule2: CurriculumModule = {
  id: "go-2",
  courseId: "go",
  title: "Memory & Data Structures",
  order: 2,
  description:
    "Slices, maps, strings, structs, and pointers — plus stack/heap and escape analysis.",
  lessonIds: [
    "go-slices",
    "go-maps",
    "go-strings-runes",
    "go-structs-pointers",
    "go-stack-heap-escape",
  ],
  projectId: "go-expense-manager",
};
