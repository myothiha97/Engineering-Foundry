import type { CurriculumModule, Lesson } from "../../packages/content-schema/src/index";
import { goSourceToProcess, goToolchainModules, goModule0 } from "./module-0";
import {
  goBasicTypes,
  goCopySemantics,
  goFunctionsDefer,
  goControlFlow,
  goModule1,
} from "./module-1";
import {
  goSlices,
  goMaps,
  goStringsRunes,
  goStructsPointers,
  goStackHeapEscape,
  goModule2,
} from "./module-2";

/**
 * Every authored Go lesson, in curriculum order. The workspace opens any lesson
 * in this registry; a topic in `@platform/curriculum` becomes openable the
 * moment its `lessonId` resolves here (and its `status` is flipped to
 * "authored"). New modules append their lessons below.
 */
export const goLessons: Lesson[] = [
  goSourceToProcess,
  goToolchainModules,
  goBasicTypes,
  goCopySemantics,
  goFunctionsDefer,
  goControlFlow,
  goSlices,
  goMaps,
  goStringsRunes,
  goStructsPointers,
  goStackHeapEscape,
];

export const goLessonsById: Record<string, Lesson> = Object.fromEntries(
  goLessons.map((lesson) => [lesson.id, lesson]),
);

/** Content-schema modules, used for referential validation of lessonIds. */
export const goContentModules: CurriculumModule[] = [goModule0, goModule1, goModule2];
