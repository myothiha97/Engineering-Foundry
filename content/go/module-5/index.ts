import type { CurriculumModule } from "../../../packages/content-schema/src/index";

export { goIoReaderWriter } from "./io-reader-writer";
export { goFilesOs } from "./files-os";
export { goJson } from "./json";
export { goTimeContext } from "./time-context";
export { goNetHttp } from "./net-http";
export { goDatabaseSql } from "./database-sql";

export const goModule5: CurriculumModule = {
  id: "go-5",
  courseId: "go",
  title: "Standard Library & I/O",
  order: 5,
  description: "Reader/Writer, files, JSON, time, context, HTTP, and CLIs.",
  lessonIds: [
    "go-io-reader-writer",
    "go-files-os",
    "go-json",
    "go-time-context",
    "go-net-http",
    "go-database-sql",
  ],
  projectId: "go-http-data-service",
};
