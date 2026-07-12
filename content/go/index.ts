import type { Lesson } from "../../packages/content-schema/src/index";
import { goSourceToProcess, goToolchainModules } from "./module-0";

/**
 * Every authored Go lesson, in curriculum order. The workspace opens any lesson
 * in this registry; a topic in `@platform/curriculum` becomes openable the
 * moment its `lessonId` resolves here (and its `status` is flipped to
 * "authored"). New modules append their lessons below.
 */
export const goLessons: Lesson[] = [goSourceToProcess, goToolchainModules];

export const goLessonsById: Record<string, Lesson> = Object.fromEntries(
  goLessons.map((lesson) => [lesson.id, lesson]),
);
