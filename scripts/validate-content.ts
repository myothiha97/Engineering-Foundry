import { validateCurriculum } from "../packages/content-schema/src/index";
import { backendModule0, backendProcessToService, goLessons, goModule0 } from "../content";

const result = validateCurriculum(
  [...goLessons, backendProcessToService],
  [goModule0, backendModule0],
);
console.log(`Validated ${result.lessons.length} lessons across ${result.modules.length} modules.`);
