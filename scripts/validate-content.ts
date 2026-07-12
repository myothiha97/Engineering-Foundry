import { validateCurriculum } from "../packages/content-schema/src/index";
import { backendModule0, backendProcessToService, goModule0, goSourceToProcess } from "../content";

const result = validateCurriculum(
  [goSourceToProcess, backendProcessToService],
  [goModule0, backendModule0],
);
console.log(`Validated ${result.lessons.length} lessons across ${result.modules.length} modules.`);
