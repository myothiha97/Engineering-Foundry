export const progressStates = [
  "not_started",
  "in_progress",
  "explanation_reviewed",
  "mental_model_understood",
  "exercise_attempted",
  "exercise_completed",
  "project_applied",
  "needs_review",
  "mastered",
] as const;
export type ProgressState = (typeof progressStates)[number];

const rank = new Map(progressStates.map((state, index) => [state, index]));

export type ProgressEvent =
  | { type: "OPEN" }
  | { type: "REVIEW_EXPLANATION" }
  | { type: "CONFIRM_MENTAL_MODEL" }
  | { type: "ATTEMPT_EXERCISE"; correct: boolean }
  | { type: "APPLY_PROJECT" }
  | { type: "VERIFY_MASTERY"; passed: boolean };

export function transitionProgress(current: ProgressState, event: ProgressEvent): ProgressState {
  if (event.type === "VERIFY_MASTERY") return event.passed ? "mastered" : "needs_review";
  if (event.type === "ATTEMPT_EXERCISE")
    return event.correct ? "exercise_completed" : "needs_review";
  const next: Partial<Record<ProgressEvent["type"], ProgressState>> = {
    OPEN: "in_progress",
    REVIEW_EXPLANATION: "explanation_reviewed",
    CONFIRM_MENTAL_MODEL: "mental_model_understood",
    APPLY_PROJECT: "project_applied",
  };
  const candidate = next[event.type] ?? current;
  return (rank.get(candidate) ?? 0) > (rank.get(current) ?? 0) ? candidate : current;
}

export type ReviewInput = {
  lastReviewedAt: Date;
  intervalDays: number;
  ease: number;
  correct: boolean;
};
export function scheduleReview(input: ReviewInput) {
  const ease = Math.max(1.3, input.ease + (input.correct ? 0.1 : -0.2));
  const intervalDays = input.correct ? Math.max(1, Math.round(input.intervalDays * ease)) : 1;
  const dueAt = new Date(input.lastReviewedAt);
  dueAt.setUTCDate(dueAt.getUTCDate() + intervalDays);
  return { dueAt, intervalDays, ease };
}

export function masteryScore(input: {
  explanation: boolean;
  mentalModel: boolean;
  exercise: boolean;
  project: boolean;
  verification: boolean;
}) {
  return Math.round(
    (Number(input.explanation) * 0.1 +
      Number(input.mentalModel) * 0.2 +
      Number(input.exercise) * 0.25 +
      Number(input.project) * 0.2 +
      Number(input.verification) * 0.25) *
      100,
  );
}

export function resolveAvailableLessons<T extends { id: string; prerequisites: string[] }>(
  lessons: T[],
  mastered: Set<string>,
) {
  return lessons.filter((lesson) => lesson.prerequisites.every((id) => mastered.has(id)));
}
