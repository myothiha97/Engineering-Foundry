"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  masteryScore,
  scheduleReview,
  transitionProgress,
  type ProgressEvent,
  type ProgressState,
} from "./index";

/**
 * Evidence a learner has produced for a single lesson. This is the anonymous,
 * client-side record that later migrates to the server. Mastery is gated on it:
 * opening or reading a lesson produces none of these flags.
 */
export type LessonEvidence = {
  explanationReviewed: boolean;
  mentalModel: boolean;
  predictionCorrect: boolean;
  exercisePassed: boolean;
  projectApplied: boolean;
  /** mastery-criterion id -> attested */
  criteria: Record<string, boolean>;
};

export const emptyEvidence: LessonEvidence = {
  explanationReviewed: false,
  mentalModel: false,
  predictionCorrect: false,
  exercisePassed: false,
  projectApplied: false,
  criteria: {},
};

/**
 * One lesson's spaced-review schedule (SM-2-style, dates as ISO strings so the
 * payload stays JSON-serializable). Created when evidence routes a lesson to
 * needs_review; updated by each review outcome.
 */
export type ReviewEntry = {
  lastReviewedAt: string;
  intervalDays: number;
  ease: number;
  dueAt: string;
  reason: string;
};

type LocalState = {
  progress: Record<string, ProgressState>;
  /** Learner-controlled completion, intentionally separate from evidence-backed mastery. */
  completedLessons: string[];
  bookmarks: string[];
  notes: Record<string, string>;
  /** last stage/section id the learner viewed, per lesson — restored on reload */
  stages: Record<string, string>;
  evidence: Record<string, LessonEvidence>;
  /** Exercise ids worked through per lesson. */
  exerciseCompletions: Record<string, string[]>;
  /** completed milestone keys per module project id */
  projectMilestones: Record<string, string[]>;
  /** Spaced-review schedule per lesson id. */
  reviews: Record<string, ReviewEntry>;
  lastVisited?: string;
};

type Context = LocalState & {
  /** True once persisted state has loaded — use before restoring per-lesson UI. */
  hydrated: boolean;
  setProgress: (id: string, state: ProgressState) => void;
  toggleLessonComplete: (id: string) => void;
  resetLesson: (id: string, projectId?: string) => void;
  /** Advance progress through the monotonic engine ladder from a learning event. */
  applyEvent: (id: string, event: ProgressEvent) => void;
  toggleBookmark: (id: string) => void;
  setNote: (id: string, note: string) => void;
  setStage: (id: string, stage: string) => void;
  recordEvidence: (id: string, patch: Partial<LessonEvidence>) => void;
  getEvidence: (id: string) => LessonEvidence;
  getExerciseCompletions: (id: string) => string[];
  markExerciseComplete: (id: string, exerciseId: string) => void;
  /** Completed milestone keys for a module project. */
  getMilestones: (projectId: string) => string[];
  /** Toggle a single project milestone's completion. */
  toggleMilestone: (projectId: string, milestone: string) => void;
  getReview: (id: string) => ReviewEntry | undefined;
  /** Record one review attempt: reschedules the entry via the SM-2-style engine. */
  recordReviewOutcome: (id: string, correct: boolean) => void;
  /** Weighted 0-100 mastery score derived from a lesson's captured evidence. */
  masteryScoreFor: (id: string, requiredCriteria?: string[]) => number;
};

const LearningContext = createContext<Context | null>(null);
const initial: LocalState = {
  progress: {},
  completedLessons: [],
  bookmarks: [],
  notes: {},
  stages: {},
  evidence: {},
  exerciseCompletions: {},
  projectMilestones: {},
  reviews: {},
};

/** Tolerate older persisted payloads that predate `stages`/`evidence`. */
function hydrate(raw: string): LocalState {
  const parsed = JSON.parse(raw) as Partial<LocalState>;
  return {
    ...initial,
    ...parsed,
    completedLessons: parsed.completedLessons ?? [],
    stages: parsed.stages ?? {},
    evidence: parsed.evidence ?? {},
    exerciseCompletions: parsed.exerciseCompletions ?? {},
    projectMilestones: parsed.projectMilestones ?? {},
    reviews: parsed.reviews ?? {},
  };
}

export function LearningProvider({
  children,
  storageKey = "engineering-learning",
}: {
  children: ReactNode;
  storageKey?: string;
}) {
  const [state, setState] = useState<LocalState>(initial);
  const [hydrated, setHydrated] = useState(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load once on mount, before any writes, so we never clobber saved evidence.
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setState(hydrate(saved));
      } catch {
        /* corrupt payload — start fresh */
      }
    }
    setHydrated(true);
  }, [storageKey]);

  // Persist on a debounce so high-frequency edits (typing a note) don't thrash
  // localStorage on every keystroke.
  useEffect(() => {
    if (!hydrated) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }, 350);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [state, storageKey, hydrated]);

  const getEvidence = useCallback(
    (id: string) => state.evidence[id] ?? emptyEvidence,
    [state.evidence],
  );

  const value = useMemo<Context>(
    () => ({
      ...state,
      hydrated,
      setProgress: (id, progress) =>
        setState((s) => ({ ...s, progress: { ...s.progress, [id]: progress }, lastVisited: id })),
      toggleLessonComplete: (id) =>
        setState((s) => ({
          ...s,
          completedLessons: s.completedLessons.includes(id)
            ? s.completedLessons.filter((lessonId) => lessonId !== id)
            : [...s.completedLessons, id],
          lastVisited: id,
        })),
      resetLesson: (id, projectId) =>
        setState((s) => {
          const progress = { ...s.progress };
          const stages = { ...s.stages };
          const evidence = { ...s.evidence };
          const exerciseCompletions = { ...s.exerciseCompletions };
          const projectMilestones = { ...s.projectMilestones };
          delete progress[id];
          delete stages[id];
          delete evidence[id];
          delete exerciseCompletions[id];
          if (projectId) delete projectMilestones[projectId];
          return {
            ...s,
            progress,
            stages,
            evidence,
            exerciseCompletions,
            projectMilestones,
            completedLessons: s.completedLessons.filter((lessonId) => lessonId !== id),
            lastVisited: id,
          };
        }),
      applyEvent: (id, event) =>
        setState((s) => {
          const current = s.progress[id] ?? "not_started";
          const next = transitionProgress(current, event);
          // Landing in needs_review seeds (or re-arms) a due-now review entry,
          // so failed evidence automatically feeds the review queue.
          let reviews = s.reviews;
          if (next === "needs_review") {
            const now = new Date().toISOString();
            const prev = s.reviews[id];
            reviews = {
              ...s.reviews,
              [id]: {
                lastReviewedAt: now,
                intervalDays: 1,
                ease: prev?.ease ?? 2.5,
                dueAt: now,
                reason:
                  event.type === "VERIFY_MASTERY"
                    ? "mastery verification failed"
                    : "incorrect answer",
              },
            };
          }
          return {
            ...s,
            progress: { ...s.progress, [id]: next },
            reviews,
            lastVisited: id,
          };
        }),
      toggleBookmark: (id) =>
        setState((s) => ({
          ...s,
          bookmarks: s.bookmarks.includes(id)
            ? s.bookmarks.filter((x) => x !== id)
            : [...s.bookmarks, id],
        })),
      setNote: (id, note) => setState((s) => ({ ...s, notes: { ...s.notes, [id]: note } })),
      setStage: (id, stage) =>
        setState((s) => ({ ...s, stages: { ...s.stages, [id]: stage }, lastVisited: id })),
      recordEvidence: (id, patch) =>
        setState((s) => {
          const prev = s.evidence[id] ?? emptyEvidence;
          return {
            ...s,
            evidence: {
              ...s.evidence,
              [id]: { ...prev, ...patch, criteria: { ...prev.criteria, ...patch.criteria } },
            },
          };
        }),
      getEvidence,
      getExerciseCompletions: (id) => state.exerciseCompletions[id] ?? [],
      markExerciseComplete: (id, exerciseId) =>
        setState((s) => {
          const completed = s.exerciseCompletions[id] ?? [];
          if (completed.includes(exerciseId)) return s;
          return {
            ...s,
            exerciseCompletions: { ...s.exerciseCompletions, [id]: [...completed, exerciseId] },
            lastVisited: id,
          };
        }),
      getReview: (id) => state.reviews[id],
      recordReviewOutcome: (id, correct) =>
        setState((s) => {
          const prev = s.reviews[id];
          const now = new Date();
          const next = scheduleReview({
            lastReviewedAt: now,
            intervalDays: prev?.intervalDays ?? 1,
            ease: prev?.ease ?? 2.5,
            correct,
          });
          return {
            ...s,
            reviews: {
              ...s.reviews,
              [id]: {
                lastReviewedAt: now.toISOString(),
                intervalDays: next.intervalDays,
                ease: next.ease,
                dueAt: next.dueAt.toISOString(),
                reason: prev?.reason ?? "scheduled review",
              },
            },
            lastVisited: id,
          };
        }),
      getMilestones: (projectId) => state.projectMilestones[projectId] ?? [],
      toggleMilestone: (projectId, milestone) =>
        setState((s) => {
          const done = s.projectMilestones[projectId] ?? [];
          const next = done.includes(milestone)
            ? done.filter((m) => m !== milestone)
            : [...done, milestone];
          return { ...s, projectMilestones: { ...s.projectMilestones, [projectId]: next } };
        }),
      masteryScoreFor: (id, requiredCriteria = []) => {
        const e = state.evidence[id] ?? emptyEvidence;
        const verified =
          requiredCriteria.length > 0 &&
          requiredCriteria.every((criterionId) => Boolean(e.criteria[criterionId]));
        return masteryScore({
          explanation: e.explanationReviewed,
          mentalModel: e.mentalModel,
          exercise: e.exercisePassed,
          project: Boolean(e.projectApplied),
          verification: verified,
        });
      },
    }),
    [state, hydrated, getEvidence],
  );
  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearning() {
  const value = useContext(LearningContext);
  if (!value) throw new Error("useLearning must be used inside LearningProvider");
  return value;
}
