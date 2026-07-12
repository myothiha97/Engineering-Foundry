export type LearningEvent = {
  name: "lesson_opened" | "stage_viewed" | "exercise_attempted" | "mastery_verified";
  anonymousId?: string;
  userId?: string;
  course: "go" | "backend";
  targetId: string;
  occurredAt: string;
};
export interface AnalyticsSink {
  capture(event: LearningEvent): Promise<void>;
}
export const noOpAnalytics: AnalyticsSink = { async capture() {} };
