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
import { masteryScore, transitionProgress, type ProgressEvent, type ProgressState } from "./index";

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
  /** mastery-criterion id -> attested */
  criteria: Record<string, boolean>;
};

export const emptyEvidence: LessonEvidence = {
  explanationReviewed: false,
  mentalModel: false,
  predictionCorrect: false,
  exercisePassed: false,
  criteria: {},
};

type LocalState = {
  progress: Record<string, ProgressState>;
  bookmarks: string[];
  notes: Record<string, string>;
  /** last stage/section id the learner viewed, per lesson — restored on reload */
  stages: Record<string, string>;
  evidence: Record<string, LessonEvidence>;
  lastVisited?: string;
};

type Context = LocalState & {
  /** True once persisted state has loaded — use before restoring per-lesson UI. */
  hydrated: boolean;
  setProgress: (id: string, state: ProgressState) => void;
  /** Advance progress through the monotonic engine ladder from a learning event. */
  applyEvent: (id: string, event: ProgressEvent) => void;
  toggleBookmark: (id: string) => void;
  setNote: (id: string, note: string) => void;
  setStage: (id: string, stage: string) => void;
  recordEvidence: (id: string, patch: Partial<LessonEvidence>) => void;
  getEvidence: (id: string) => LessonEvidence;
  /** Weighted 0-100 mastery score derived from a lesson's captured evidence. */
  masteryScoreFor: (id: string) => number;
};

const LearningContext = createContext<Context | null>(null);
const initial: LocalState = { progress: {}, bookmarks: [], notes: {}, stages: {}, evidence: {} };

/** Tolerate older persisted payloads that predate `stages`/`evidence`. */
function hydrate(raw: string): LocalState {
  const parsed = JSON.parse(raw) as Partial<LocalState>;
  return {
    ...initial,
    ...parsed,
    stages: parsed.stages ?? {},
    evidence: parsed.evidence ?? {},
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
      applyEvent: (id, event) =>
        setState((s) => {
          const current = s.progress[id] ?? "not_started";
          return {
            ...s,
            progress: { ...s.progress, [id]: transitionProgress(current, event) },
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
      masteryScoreFor: (id) => {
        const e = state.evidence[id] ?? emptyEvidence;
        const verified = Object.values(e.criteria).length > 0 && Object.values(e.criteria).every(Boolean);
        return masteryScore({
          explanation: e.explanationReviewed,
          mentalModel: e.mentalModel,
          exercise: e.exercisePassed,
          project: false,
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
