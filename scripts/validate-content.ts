import { validateCurriculum } from "../packages/content-schema/src/index";
import { backendModule0, backendProcessToService, goContentModules, goLessons } from "../content";

const result = validateCurriculum(
  [...goLessons, backendProcessToService],
  [...goContentModules, backendModule0],
);
console.log(`Validated ${result.lessons.length} lessons across ${result.modules.length} modules.`);
