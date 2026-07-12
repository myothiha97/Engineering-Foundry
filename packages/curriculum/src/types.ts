import type { Resource } from "@platform/content-schema";

/**
 * Authoring status for a topic. The map is comprehensive (every topic is listed
 * fundamental → advanced); `status` is honest about how much interactive lesson
 * content exists. Planned topics are inspectable but never masterable.
 */
export type CurriculumStatus = "authored" | "in_authoring" | "planned";

export type CourseLevel = "fundamental" | "intermediate" | "advanced";

export type CurriculumTopic = {
  id: string;
  title: string;
  summary: string;
  concepts: string[];
  /** topic ids that ground this one — used for recommendations, not hard locks */
  prerequisites: string[];
  whyNow: string;
  learnerOutcome: string;
  ledgerFlowApplication: string;
  status: CurriculumStatus;
  /** links to an authored lesson in content/ when status === "authored" */
  lessonId?: string;
  resources?: Resource[];
};

export type CurriculumProject = {
  title: string;
  outcome: string;
  milestones: string[];
};

export type CurriculumModule = {
  id: string;
  order: number;
  title: string;
  description: string;
  level: CourseLevel;
  prerequisiteModuleIds: string[];
  topics: CurriculumTopic[];
  project: CurriculumProject;
  /** external references for the whole module (docs + popular repos) */
  resources: Resource[];
};

export type Curriculum = {
  course: "go" | "backend";
  title: string;
  tagline: string;
  modules: CurriculumModule[];
};
